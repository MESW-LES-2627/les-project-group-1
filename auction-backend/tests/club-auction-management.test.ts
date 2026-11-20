import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { httpServer } from "../src/app";
import { prisma } from "../src/config/prisma";
import { clubEditMode } from "../src/services/auctionStatus";
import { evictRoom, getRoom } from "../src/services/auction.service";

/**
 * A club managing its auctions: the list, the details of each one, what it can still edit, and what is
 * locked once the auction has opened. Everything this file creates uses the "test-auction-mgmt" prefix
 * and is deleted at the end.
 */

const PORT = 3006; // different port for testing to avoid conflicts with the main server
const BASE_URL = `http://localhost:${PORT}`;
const PREFIX = "test-auction-mgmt";
const PASSWORD = "mgmtpassword123";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// Smallest valid PNG (1x1)
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

let clubToken = "";
let otherClubToken = "";
let adminToken = "";
let clubId = 0;
let categoryId = 0;
let titleCount = 0;

async function createUser(name: string, role: "CLUB" | "BUYER" | "ADMIN") {
  const user = await prisma.user.create({
    data: {
      username: `${PREFIX}-${name}`,
      email: `${PREFIX}-${name}@feup.pt`,
      passwordHash: await Bun.password.hash(PASSWORD, { algorithm: "argon2id" }),
      country: "PT",
      role,
    },
  });
  let id = 0;
  if (role === "CLUB") {
    const club = await prisma.club.create({
      data: { userId: user.id, slug: `${PREFIX}-${name}`, name: `${PREFIX} ${name}`, status: "approved" },
    });
    id = club.id;
  }
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: PASSWORD }),
  });
  const data: any = await res.json();
  return { token: data.token as string, clubId: id };
}

async function cleanUp() {
  const listings = await prisma.listing.findMany({ where: { club: { slug: { startsWith: PREFIX } } }, select: { id: true } });
  for (const { id } of listings) evictRoom(String(id));
  await prisma.bid.deleteMany({ where: { listing: { club: { slug: { startsWith: PREFIX } } } } });
  await prisma.listing.deleteMany({ where: { club: { slug: { startsWith: PREFIX } } } });
  await prisma.club.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
}

/** A listing straight in the database, in whatever state the test needs. Verified and scheduled by default. */
async function makeListing(data: { status?: string; startsAt?: Date | null; endsAt?: Date; cancelledAt?: Date | null } = {}) {
  const now = Date.now();
  const status = data.status ?? "verified";
  const listing = await prisma.listing.create({
    data: {
      clubId,
      categoryId,
      title: `${PREFIX} listing ${++titleCount}`,
      description: "A jersey used in the auction management tests.",
      images: ["/images/items/sl-benfica/squad-front.png"],
      status,
      startingPrice: 100,
      verifiedAt: status === "verified" ? new Date(now - HOUR) : null,
      auctionStartsAt: data.startsAt === undefined ? new Date(now + HOUR) : data.startsAt,
      auctionEndsAt: data.endsAt ?? new Date(now + 3 * HOUR),
      cancelledAt: data.cancelledAt ?? null,
    },
  });
  return listing.id;
}

const scheduled = () => makeListing();
const active = () => makeListing({ startsAt: new Date(Date.now() - MINUTE) });
const completed = () => makeListing({ startsAt: new Date(Date.now() - 2 * HOUR), endsAt: new Date(Date.now() - MINUTE) });

function api(path: string, token: string, init: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
}

const patch = (id: number, body: object, token = clubToken) =>
  api(`/api/clubs/me/listings/${id}`, token, { method: "PATCH", body: JSON.stringify(body) });

const inHours = (hours: number) => new Date(Date.now() + hours * HOUR).toISOString();

beforeAll(async () => {
  if (!httpServer.listening) httpServer.listen(PORT);
  await cleanUp();

  const category = await prisma.category.findFirst({ select: { id: true } });
  if (!category) throw new Error("No categories in the database. Run the migrations and the seed first.");
  categoryId = category.id;

  const club = await createUser("club", "CLUB");
  clubToken = club.token;
  clubId = club.clubId;
  otherClubToken = (await createUser("other", "CLUB")).token;
  adminToken = (await createUser("admin", "ADMIN")).token;
});

afterAll(async () => {
  await cleanUp();
  httpServer.close();
});

describe("clubEditMode", () => {
  const now = Date.now();
  const listing = (status: string, extra: { startsAt?: number; endsAt?: number; cancelledAt?: number } = {}) => ({
    status,
    auctionStartsAt: new Date(extra.startsAt ?? now + HOUR),
    auctionEndsAt: new Date(extra.endsAt ?? now + 2 * HOUR),
    cancelledAt: extra.cancelledAt ? new Date(extra.cancelledAt) : null,
  });

  it("allows full edits of drafts and rejected listings", () => {
    expect(clubEditMode(listing("draft"), now)).toBe("full");
    expect(clubEditMode(listing("rejected"), now)).toBe("full");
  });

  it("allows only the auction settings of a verified auction that hasn't opened", () => {
    expect(clubEditMode(listing("verified"), now)).toBe("auction");
  });

  it("locks listings under review, auctions that opened or finished, and cancelled ones", () => {
    expect(clubEditMode(listing("pending_verification"), now)).toBeNull();
    expect(clubEditMode(listing("verified", { startsAt: now - MINUTE }), now)).toBeNull();
    expect(clubEditMode(listing("verified", { startsAt: now - 2 * HOUR, endsAt: now - MINUTE }), now)).toBeNull();
    expect(clubEditMode(listing("draft", { cancelledAt: now - 1 }), now)).toBeNull();
  });
});

describe("GET /api/clubs/me/listings: the club's auctions", () => {
  it("lists them with what can still be edited and cancelled", async () => {
    const ids = { scheduled: await scheduled(), active: await active(), draft: await makeListing({ status: "draft" }) };

    const res = await api("/api/clubs/me/listings?limit=100", clubToken);

    expect(res.status).toBe(200);
    const data: any = await res.json();
    const byId = new Map<number, any>(data.items.map((l: any) => [l.id, l]));
    expect(byId.get(ids.scheduled).editMode).toBe("auction");
    expect(byId.get(ids.active).editMode).toBeNull();
    expect(byId.get(ids.draft).editMode).toBe("full");
  });
});

describe("GET /api/clubs/me/listings/:id: details of an auction", () => {
  it("returns the auction with its settings, status and bids", async () => {
    const id = await active();
    await prisma.bid.createMany({
      data: [
        { listingId: id, bidder: "buyer_a", amount: 120 },
        { listingId: id, bidder: "buyer_b", amount: 150 },
      ],
    });

    const res = await api(`/api/clubs/me/listings/${id}`, clubToken);

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.id).toBe(id);
    expect(data.startingPrice).toBe(100);
    expect(data.auctionStatus).toBe("active");
    expect(data.bidCount).toBe(2);
    expect(data.highestBid).toBe(150);
    expect(data.editMode).toBeNull();
    expect(data.canCancel).toBe(false);
  });

  it("says there are no bids yet", async () => {
    const data: any = await (await api(`/api/clubs/me/listings/${await scheduled()}`, clubToken)).json();
    expect(data.bidCount).toBe(0);
    expect(data.highestBid).toBeNull();
  });

  it("doesn't show one club's auction to another club", async () => {
    const res = await api(`/api/clubs/me/listings/${await scheduled()}`, otherClubToken);
    expect(res.status).toBe(404);
  });
});

describe("PATCH a verified auction that hasn't opened yet", () => {
  it("changes the starting price, dates and charity", async () => {
    const id = await scheduled();
    const charity = await prisma.charitableOrganization.findFirst({ where: { verified: true }, select: { id: true } });
    const startsAt = inHours(2);
    const endsAt = inHours(5);

    const res = await patch(id, {
      startingPrice: 250,
      auctionStartsAt: startsAt,
      auctionEndsAt: endsAt,
      ...(charity ? { charitableOrganizationId: charity.id, donationPercentage: 20 } : {}),
    });

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.startingPrice).toBe(250);
    expect(data.auctionStartsAt).toBe(startsAt);
    expect(data.auctionEndsAt).toBe(endsAt);
    expect(data.status).toBe("verified"); // still approved: only the auction settings changed
    expect(data.auctionStatus).toBe("scheduled");
    if (charity) {
      expect(data.charitableOrganizationId).toBe(charity.id);
      expect(data.donationPercentage).toBe(20);
    }
  });

  it("updates the countdown of anyone already on the auction page", async () => {
    const id = await scheduled();
    const room = (await getRoom(String(id)))!;
    const startsAt = inHours(2);

    expect((await patch(id, { auctionStartsAt: startsAt })).status).toBe(200);

    expect(room.state.startTime).toBe(new Date(startsAt).getTime());
    expect(room.state.status).toBe("scheduled");
  });

  it("shows the new starting price to buyers, also when the auction page was already open", async () => {
    const id = await scheduled();
    const room = (await getRoom(String(id)))!; // someone opened the auction page with the old price
    expect(room.state.currentBid).toBe(100);

    expect((await patch(id, { startingPrice: 250 })).status).toBe(200);

    expect(room.startingPrice).toBe(250);
    expect(room.state.currentBid).toBe(250);
    const card: any = await (await fetch(`${BASE_URL}/api/listings/${id}`)).json();
    expect(card.currentBid).toBe(250);
  });

  it("refuses changes to the item itself, which the admin already verified", async () => {
    const id = await scheduled();
    const res = await patch(id, { title: `${PREFIX} renamed`, startingPrice: 300 });

    expect(res.status).toBe(409);
    const data: any = await res.json();
    expect(data.error).toBe("only_auction_settings");
    expect(data.fields).toEqual(["title"]);
    const saved = await prisma.listing.findUnique({ where: { id }, select: { startingPrice: true } });
    expect(Number(saved!.startingPrice)).toBe(100); // nothing was saved
  });

  it("refuses new photos", async () => {
    const id = await scheduled();
    const form = new FormData();
    form.append("startingPrice", "200");
    form.append("images", new Blob([PNG], { type: "image/png" }), "photo.png");

    const res = await fetch(`${BASE_URL}/api/clubs/me/listings/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${clubToken}` },
      body: form,
    });

    expect(res.status).toBe(409);
    const data: any = await res.json();
    expect(data.error).toBe("only_auction_settings");
  });

  it("refuses to send it back for verification", async () => {
    const res = await patch(await scheduled(), { status: "draft" });
    expect(res.status).toBe(409);
    const data: any = await res.json();
    expect(data.fields).toEqual(["status"]);
  });

  it("refuses to remove the start date, which would open the auction straight away", async () => {
    const res = await patch(await scheduled(), { auctionStartsAt: null });
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("auction_start_required");
  });

  it("refuses a start date in the past", async () => {
    const res = await patch(await scheduled(), { auctionStartsAt: new Date(Date.now() - MINUTE).toISOString() });
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("invalid_auction_starts_at");
  });

  it("refuses to remove the starting price or the end date", async () => {
    const price = await patch(await scheduled(), { startingPrice: null });
    expect(price.status).toBe(400);
    expect(((await price.json()) as any).missing).toEqual(["startingPrice"]);

    const end = await patch(await scheduled(), { auctionEndsAt: null });
    expect(end.status).toBe(400);
    expect(((await end.json()) as any).missing).toEqual(["auctionEndsAt"]);
  });

  it("refuses an end date before the saved start date", async () => {
    const res = await patch(await scheduled(), { auctionEndsAt: new Date(Date.now() + 30 * MINUTE).toISOString() });
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("auction_starts_after_end");
  });

  it("refuses an invalid starting price", async () => {
    const res = await patch(await scheduled(), { startingPrice: 0 });
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("invalid_starting_price");
  });
});

describe("PATCH once nothing can be changed", () => {
  const locked: Array<[string, () => Promise<number>]> = [
    ["an auction that has started", active],
    ["an auction that has finished", completed],
    ["a listing waiting for verification", () => makeListing({ status: "pending_verification" })],
  ];

  for (const [name, make] of locked) {
    it(`refuses to edit ${name}`, async () => {
      const id = await make();
      const res = await patch(id, { startingPrice: 999 });

      expect(res.status).toBe(409);
      const data: any = await res.json();
      expect(data.error).toBe("listing_locked");
      const saved = await prisma.listing.findUnique({ where: { id }, select: { startingPrice: true } });
      expect(Number(saved!.startingPrice)).toBe(100);
    });
  }

  it("refuses to edit a cancelled auction", async () => {
    const res = await patch(await makeListing({ cancelledAt: new Date() }), { startingPrice: 999 });
    expect(res.status).toBe(409);
    const data: any = await res.json();
    expect(data.error).toBe("listing_cancelled");
  });

  it("still allows full edits of a draft", async () => {
    const id = await makeListing({ status: "draft" });
    const res = await patch(id, { title: `${PREFIX} draft renamed`, startingPrice: 80 });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.title).toBe(`${PREFIX} draft renamed`);
  });

  it("doesn't let a club edit another club's auction", async () => {
    const res = await patch(await scheduled(), { startingPrice: 200 }, otherClubToken);
    expect(res.status).toBe(404);
  });
});

describe("DELETE", () => {
  it("refuses to delete a verified auction", async () => {
    const res = await api(`/api/clubs/me/listings/${await scheduled()}`, clubToken, { method: "DELETE" });
    expect(res.status).toBe(409);
  });

  it("deletes a draft", async () => {
    const id = await makeListing({ status: "draft" });
    const res = await api(`/api/clubs/me/listings/${id}`, clubToken, { method: "DELETE" });
    expect(res.status).toBe(204);
    expect(await prisma.listing.findUnique({ where: { id } })).toBeNull();
  });
});

describe("rejecting: the admin sends a listing back to the club to fix", () => {
  const setStatus = (id: number, status: string) =>
    api(`/api/admin/listings/${id}/status`, adminToken, { method: "PATCH", body: JSON.stringify({ status }) });

  it("goes round the whole cycle: reject, fix, resubmit, verify", async () => {
    const id = await makeListing({ status: "pending_verification" });

    // The admin rejects it
    const rejected = await setStatus(id, "rejected");
    expect(rejected.status).toBe(200);
    const afterReject: any = await rejected.json();
    expect(afterReject.status).toBe("rejected");
    expect(afterReject.verifiedAt).toBeNull();
    expect(afterReject.canCancel).toBe(false);

    // The club sees it can edit everything, fixes it, and it becomes a draft again
    const mine: any = await (await api(`/api/clubs/me/listings/${id}`, clubToken)).json();
    expect(mine.editMode).toBe("full");
    const fixed = await patch(id, { description: "Now with a clear photo of the label and the certificate." });
    expect(fixed.status).toBe(200);
    expect(((await fixed.json()) as any).status).toBe("draft");

    // It sends it again, and this time the admin approves it
    const resubmitted = await patch(id, { status: "pending_verification" });
    expect(resubmitted.status).toBe(200);
    expect(((await resubmitted.json()) as any).status).toBe("pending_verification");
    const verified = await setStatus(id, "verified");
    expect(((await verified.json()) as any).status).toBe("verified");
  });

  it("only rejects a listing that is under review", async () => {
    const res = await setStatus(await scheduled(), "rejected");
    expect(res.status).toBe(409);
    const data: any = await res.json();
    expect(data.error).toBe("not_under_review");
  });

  it("keeps rejected listings in the admin list, so they can still be viewed", async () => {
    const id = await makeListing({ status: "rejected" });
    const res = await api("/api/admin/listings?status=rejected&limit=100", adminToken);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.items.map((l: any) => l.id)).toContain(id);
    expect(data.items.every((l: any) => l.status === "rejected")).toBe(true);
  });

  it("doesn't show the club's drafts to the admin", async () => {
    const id = await makeListing({ status: "draft" });
    const data: any = await (await api("/api/admin/listings?limit=100", adminToken)).json();
    expect(data.items.map((l: any) => l.id)).not.toContain(id);
  });

  it("doesn't let the admin cancel a listing under review: it is rejected instead", async () => {
    const id = await makeListing({ status: "pending_verification" });
    const res = await api(`/api/admin/listings/${id}/cancel`, adminToken, { method: "POST" });
    expect(res.status).toBe(409);
    const data: any = await res.json();
    expect(data.error).toBe("not_verified");
    const listed: any = await (await api("/api/admin/listings?limit=100", adminToken)).json();
    expect(listed.items.find((l: any) => l.id === id).canCancel).toBe(false);
  });
});

describe("deleting: the club removes a listing that was never public", () => {
  const remove = (id: number) => api(`/api/clubs/me/listings/${id}`, clubToken, { method: "DELETE" });

  it("deletes a listing waiting for verification", async () => {
    const id = await makeListing({ status: "pending_verification" });
    expect((await remove(id)).status).toBe(204);
    expect(await prisma.listing.findUnique({ where: { id } })).toBeNull();
  });

  it("deletes a rejected listing", async () => {
    const id = await makeListing({ status: "rejected" });
    expect((await remove(id)).status).toBe(204);
  });

  it("offers deleting instead of cancelling before approval", async () => {
    const id = await makeListing({ status: "pending_verification" });
    const data: any = await (await api(`/api/clubs/me/listings/${id}`, clubToken)).json();
    expect(data.canCancel).toBe(false);
  });
});
