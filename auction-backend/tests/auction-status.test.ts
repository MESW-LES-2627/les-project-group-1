import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import type { Server } from "socket.io";
import { io as ioClient } from "socket.io-client";
import { httpServer } from "../src/app";
import { prisma } from "../src/config/prisma";
import { adminCanCancel, auctionStatus, clubCanCancel } from "../src/services/auctionStatus";
import { evictRoom, getRoom, tickAuctions } from "../src/services/auction.service";

/**
 * Auction statuses (scheduled, active, completed, cancelled), the transitions between them, and who
 * can cancel. Everything this file creates uses the "test-auction-status" prefix and is deleted at the end.
 */

const PORT = 3005; // different port for testing to avoid conflicts with the main server
const BASE_URL = `http://localhost:${PORT}`;
const PREFIX = "test-auction-status";
const PASSWORD = "statuspassword123";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

let clubToken = "";
let otherClubToken = "";
let adminToken = "";
let buyerToken = "";
let clubId = 0;
let categoryId = 0;
let titleCount = 0;

async function createUser(name: string, role: "CLUB" | "BUYER" | "ADMIN", withClub = false) {
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
  if (withClub) {
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

/** A listing straight in the database, in whatever state the test needs. */
async function makeListing(data: {
  status?: string;
  startsAt?: Date | null;
  endsAt?: Date;
  cancelledAt?: Date | null;
}) {
  const now = Date.now();
  const listing = await prisma.listing.create({
    data: {
      clubId,
      categoryId,
      title: `${PREFIX} listing ${++titleCount}`,
      description: "A jersey used in the auction status tests.",
      images: ["/images/items/sl-benfica/squad-front.png"],
      status: data.status ?? "verified",
      startingPrice: 100,
      verifiedAt: (data.status ?? "verified") === "verified" ? new Date(now - HOUR) : null,
      auctionStartsAt: data.startsAt === undefined ? new Date(now - MINUTE) : data.startsAt,
      auctionEndsAt: data.endsAt ?? new Date(now + HOUR),
      cancelledAt: data.cancelledAt ?? null,
    },
  });
  return listing.id;
}

function api(path: string, token: string, init: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

const bid = (id: number, amount = 150) =>
  api(`/api/auction/${id}/bids`, buyerToken, { method: "POST", body: JSON.stringify({ amount }) });

async function publicStatus(id: number) {
  const res = await fetch(`${BASE_URL}/api/listings/${id}`);
  const data: any = await res.json();
  return data.auctionStatus as string;
}

// Collects what the auction timer sends to the sockets, without a real Socket.IO server
function fakeIo() {
  const events: Array<{ room: string; event: string; data: any }> = [];
  const io = { to: (room: string) => ({ emit: (event: string, data?: any) => events.push({ room, event, data }) }) };
  return { io: io as unknown as Server, events };
}

beforeAll(async () => {
  if (!httpServer.listening) httpServer.listen(PORT);
  await cleanUp();

  const category = await prisma.category.findFirst({ select: { id: true } });
  if (!category) throw new Error("No categories in the database. Run the migrations and the seed first.");
  categoryId = category.id;

  const club = await createUser("club", "CLUB", true);
  clubToken = club.token;
  clubId = club.clubId;
  otherClubToken = (await createUser("other", "CLUB", true)).token;
  adminToken = (await createUser("admin", "ADMIN")).token;
  buyerToken = (await createUser("buyer", "BUYER")).token;
});

afterAll(async () => {
  await cleanUp();
  httpServer.close();
});

describe("auctionStatus", () => {
  const now = Date.UTC(2026, 10, 20, 12);

  it("is scheduled before the start date", () => {
    expect(auctionStatus({ startsAt: now + MINUTE, endsAt: now + HOUR }, now)).toBe("scheduled");
  });

  it("is active from the start date until the end date", () => {
    expect(auctionStatus({ startsAt: now, endsAt: now + HOUR }, now)).toBe("active");
    expect(auctionStatus({ startsAt: now - MINUTE, endsAt: now + 1 }, now)).toBe("active");
  });

  it("is active when there is no start date", () => {
    expect(auctionStatus({ startsAt: null, endsAt: now + HOUR }, now)).toBe("active");
  });

  it("is completed from the end date on", () => {
    expect(auctionStatus({ startsAt: now - HOUR, endsAt: now }, now)).toBe("completed");
  });

  it("is cancelled whatever the dates say", () => {
    for (const dates of [
      { startsAt: now + MINUTE, endsAt: now + HOUR },
      { startsAt: now - MINUTE, endsAt: now + HOUR },
      { startsAt: now - HOUR, endsAt: now - MINUTE },
    ]) {
      expect(auctionStatus({ ...dates, cancelledAt: now - 1 }, now)).toBe("cancelled");
    }
  });

  it("accepts dates as Date objects and ISO strings", () => {
    expect(auctionStatus({ startsAt: new Date(now + MINUTE), endsAt: new Date(now + HOUR).toISOString() }, now)).toBe(
      "scheduled"
    );
  });
});

describe("who can cancel", () => {
  const now = Date.now();
  const listing = (status: string, startsAt: number, extra: { endsAt?: number; cancelledAt?: number } = {}) => ({
    status,
    auctionStartsAt: new Date(startsAt),
    auctionEndsAt: new Date(extra.endsAt ?? now + HOUR),
    cancelledAt: extra.cancelledAt ? new Date(extra.cancelledAt) : null,
  });

  it("lets a club cancel while the listing isn't verified", () => {
    expect(clubCanCancel(listing("draft", now - MINUTE), now)).toBe(true);
    expect(clubCanCancel(listing("pending_verification", now - MINUTE), now)).toBe(true);
  });

  it("lets a club cancel a verified auction only while it is scheduled", () => {
    expect(clubCanCancel(listing("verified", now + MINUTE), now)).toBe(true);
    expect(clubCanCancel(listing("verified", now - MINUTE), now)).toBe(false);
    expect(clubCanCancel(listing("verified", now - HOUR, { endsAt: now - MINUTE }), now)).toBe(false);
  });

  it("lets an admin cancel scheduled and active auctions, but not finished ones", () => {
    expect(adminCanCancel(listing("verified", now + MINUTE), now)).toBe(true);
    expect(adminCanCancel(listing("verified", now - MINUTE), now)).toBe(true);
    expect(adminCanCancel(listing("verified", now - HOUR, { endsAt: now - MINUTE }), now)).toBe(false);
  });

  it("doesn't let anyone cancel twice", () => {
    expect(clubCanCancel(listing("draft", now - MINUTE, { cancelledAt: now - 1 }), now)).toBe(false);
    expect(adminCanCancel(listing("verified", now - MINUTE, { cancelledAt: now - 1 }), now)).toBe(false);
  });
});

describe("status transitions in the live auction", () => {
  it("opens a scheduled auction when its start date is reached, and tells the watchers", async () => {
    const startsAt = Date.now() + 10 * MINUTE;
    const id = await makeListing({ startsAt: new Date(startsAt) });
    const room = (await getRoom(String(id)))!;
    expect(room.state.status).toBe("scheduled");
    expect(room.state.isActive).toBe(false);
    expect(room.state.startTime).toBe(startsAt);

    const { io, events } = fakeIo();
    tickAuctions(io, startsAt - 1, [String(id)]);
    expect(room.state.status).toBe("scheduled");
    expect(events).toEqual([]);

    tickAuctions(io, startsAt, [String(id)]);
    expect(room.state.status).toBe("active");
    expect(room.state.isActive).toBe(true);
    expect(events.map((e) => e.event)).toEqual(["auction_state", "auction_started"]);
    expect(events[0]!.data.status).toBe("active");
  });

  it("completes an active auction when its end date is reached, and tells the watchers", async () => {
    const endsAt = Date.now() + 10 * MINUTE;
    const id = await makeListing({ endsAt: new Date(endsAt) });
    const room = (await getRoom(String(id)))!;
    expect(room.state.status).toBe("active");

    const { io, events } = fakeIo();
    tickAuctions(io, endsAt, [String(id)]);

    expect(room.state.status).toBe("completed");
    expect(room.state.isActive).toBe(false);
    expect(events.map((e) => e.event)).toEqual(["auction_end", "auction_state"]);
    expect(events[1]!.data.status).toBe("completed");
  });

  it("does not end the same auction twice", async () => {
    const endsAt = Date.now() + 10 * MINUTE;
    const id = await makeListing({ endsAt: new Date(endsAt) });
    await getRoom(String(id));

    const { io, events } = fakeIo();
    tickAuctions(io, endsAt, [String(id)]);
    tickAuctions(io, endsAt + 5000, [String(id)]);

    expect(events.filter((e) => e.event === "auction_end")).toHaveLength(1);
  });

  it("keeps an auction that is still pending verification closed, even if its dates say active", async () => {
    const id = await makeListing({ status: "pending_verification" });
    const room = (await getRoom(String(id)))!;

    expect(room.state.isActive).toBe(false);
  });
});

describe("bidding in each status", () => {
  it("accepts bids on an active auction", async () => {
    const id = await makeListing({});
    const res = await bid(id);
    expect(res.status).toBe(201);
  });

  it("rejects bids on a scheduled auction", async () => {
    const id = await makeListing({ startsAt: new Date(Date.now() + HOUR), endsAt: new Date(Date.now() + 2 * HOUR) });
    const res = await bid(id);
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toContain("has not started yet");
  });

  it("rejects bids on a completed auction", async () => {
    const id = await makeListing({ startsAt: new Date(Date.now() - 2 * HOUR), endsAt: new Date(Date.now() - MINUTE) });
    const res = await bid(id);
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("The auction has already ended.");
  });

  it("rejects bids on a cancelled auction", async () => {
    const id = await makeListing({ cancelledAt: new Date() });
    const res = await bid(id);
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("Cannot place a bid on a cancelled auction.");
  });
});

describe("start date chosen by the club", () => {
  const form = (fields: Record<string, unknown>) => ({
    categoryId,
    title: `${PREFIX} form ${++titleCount}`,
    description: "Signed jersey with a chosen start date.",
    ...fields,
  });

  it("is saved when the listing is created", async () => {
    const startsAt = new Date(Date.now() + HOUR).toISOString();
    const res = await api("/api/clubs/me/listings", clubToken, {
      method: "POST",
      body: JSON.stringify(form({ auctionStartsAt: startsAt, auctionEndsAt: new Date(Date.now() + 2 * HOUR).toISOString() })),
    });
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.auctionStartsAt).toBe(startsAt);
    expect(data.auctionStatus).toBeNull(); // not verified yet
  });

  it("must be in the future", async () => {
    const res = await api("/api/clubs/me/listings", clubToken, {
      method: "POST",
      body: JSON.stringify(form({ auctionStartsAt: new Date(Date.now() - MINUTE).toISOString() })),
    });
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("invalid_auction_starts_at");
  });

  it("must be before the end date", async () => {
    const res = await api("/api/clubs/me/listings", clubToken, {
      method: "POST",
      body: JSON.stringify(
        form({
          auctionStartsAt: new Date(Date.now() + 2 * HOUR).toISOString(),
          auctionEndsAt: new Date(Date.now() + HOUR).toISOString(),
        })
      ),
    });
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("auction_starts_after_end");
  });

  it("is checked against the saved end date when only the start date is edited", async () => {
    const id = await makeListing({ status: "draft", startsAt: null, endsAt: new Date(Date.now() + HOUR) });
    const res = await api(`/api/clubs/me/listings/${id}`, clubToken, {
      method: "PATCH",
      body: JSON.stringify({ auctionStartsAt: new Date(Date.now() + 2 * HOUR).toISOString() }),
    });
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("auction_starts_after_end");
  });
});

describe("verification and the start date", () => {
  const verify = (id: number) =>
    api(`/api/admin/listings/${id}/status`, adminToken, { method: "PATCH", body: JSON.stringify({ status: "verified" }) });

  it("keeps a future start date, so the auction shows as scheduled in the catalogue", async () => {
    const startsAt = new Date(Date.now() + HOUR);
    const id = await makeListing({ status: "pending_verification", startsAt, endsAt: new Date(Date.now() + 2 * HOUR) });

    const res = await verify(id);

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(new Date(data.auctionStartsAt).getTime()).toBe(startsAt.getTime());
    expect(data.auctionStatus).toBe("scheduled");
    expect(await publicStatus(id)).toBe("scheduled");
  });

  it("opens the auction at the verification date when no start date was chosen", async () => {
    const id = await makeListing({ status: "pending_verification", startsAt: null });
    const before = Date.now();

    const data: any = await (await verify(id)).json();

    expect(new Date(data.auctionStartsAt).getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(data.auctionStartsAt).toBe(data.verifiedAt);
    expect(data.auctionStatus).toBe("active");
    expect(await publicStatus(id)).toBe("active");
  });

  it("opens the auction at the verification date when the chosen start date has already passed", async () => {
    const id = await makeListing({ status: "pending_verification", startsAt: new Date(Date.now() - HOUR) });

    const data: any = await (await verify(id)).json();

    expect(data.auctionStartsAt).toBe(data.verifiedAt);
    expect(data.auctionStatus).toBe("active");
  });

  it("refuses to verify a cancelled listing", async () => {
    const id = await makeListing({ status: "pending_verification", cancelledAt: new Date() });
    const res = await verify(id);
    expect(res.status).toBe(409);
  });
});

describe("POST /api/clubs/me/listings/:id/cancel", () => {
  const cancel = (id: number, token = clubToken) => api(`/api/clubs/me/listings/${id}/cancel`, token, { method: "POST" });

  it("cancels a listing that is still waiting for verification", async () => {
    const id = await makeListing({ status: "pending_verification" });
    const res = await cancel(id);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.cancelledAt).not.toBeNull();
    expect(data.auctionStatus).toBe("cancelled");
    expect(data.canCancel).toBe(false);
  });

  it("cancels a draft", async () => {
    const id = await makeListing({ status: "draft" });
    expect((await cancel(id)).status).toBe(200);
  });

  it("cancels a verified auction that is still scheduled", async () => {
    const id = await makeListing({ startsAt: new Date(Date.now() + HOUR), endsAt: new Date(Date.now() + 2 * HOUR) });
    const res = await cancel(id);
    expect(res.status).toBe(200);
    expect(await publicStatus(id)).toBe("cancelled");
  });

  it("refuses once the auction has opened", async () => {
    const id = await makeListing({});
    const res = await cancel(id);
    expect(res.status).toBe(409);
    const data: any = await res.json();
    expect(data.error).toBe("auction_already_open");
  });

  it("refuses to cancel twice", async () => {
    const id = await makeListing({ status: "draft", cancelledAt: new Date() });
    const res = await cancel(id);
    expect(res.status).toBe(409);
    const data: any = await res.json();
    expect(data.error).toBe("already_cancelled");
  });

  it("doesn't let a club cancel another club's listing", async () => {
    const id = await makeListing({ status: "pending_verification" });
    const res = await cancel(id, otherClubToken);
    expect(res.status).toBe(404);
  });

  it("doesn't let buyers use it", async () => {
    const id = await makeListing({ status: "pending_verification" });
    expect((await cancel(id, buyerToken)).status).toBe(403);
  });

  it("locks the listing against edits once cancelled", async () => {
    const id = await makeListing({ status: "draft", cancelledAt: new Date() });
    const res = await api(`/api/clubs/me/listings/${id}`, clubToken, {
      method: "PATCH",
      body: JSON.stringify({ title: `${PREFIX} edited after cancelling` }),
    });
    expect(res.status).toBe(409);
    const data: any = await res.json();
    expect(data.error).toBe("listing_cancelled");
  });

  it("tells the club in its listings whether it can still cancel", async () => {
    const scheduled = await makeListing({ startsAt: new Date(Date.now() + HOUR), endsAt: new Date(Date.now() + 2 * HOUR) });
    const active = await makeListing({});
    const res = await api("/api/clubs/me/listings?limit=100", clubToken);
    const data: any = await res.json();
    const byId = new Map(data.items.map((l: any) => [l.id, l]));

    expect((byId.get(scheduled) as any).canCancel).toBe(true);
    expect((byId.get(scheduled) as any).auctionStatus).toBe("scheduled");
    expect((byId.get(active) as any).canCancel).toBe(false);
    expect((byId.get(active) as any).auctionStatus).toBe("active");
  });
});

describe("POST /api/admin/listings/:id/cancel", () => {
  const cancel = (id: number, token = adminToken) => api(`/api/admin/listings/${id}/cancel`, token, { method: "POST" });

  it("cancels an active auction, and bids are refused from then on", async () => {
    const id = await makeListing({});
    expect((await bid(id, 120)).status).toBe(201);

    const res = await cancel(id);

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.auctionStatus).toBe("cancelled");
    expect(await publicStatus(id)).toBe("cancelled");
    const refused = await bid(id, 200);
    expect(refused.status).toBe(400);
    const error: any = await refused.json();
    expect(error.error).toBe("Cannot place a bid on a cancelled auction.");
  });

  it("cancels a scheduled auction", async () => {
    const id = await makeListing({ startsAt: new Date(Date.now() + HOUR), endsAt: new Date(Date.now() + 2 * HOUR) });
    expect((await cancel(id)).status).toBe(200);
  });

  it("refuses to cancel an auction that has already finished", async () => {
    const id = await makeListing({ startsAt: new Date(Date.now() - 2 * HOUR), endsAt: new Date(Date.now() - MINUTE) });
    const res = await cancel(id);
    expect(res.status).toBe(409);
    const data: any = await res.json();
    expect(data.error).toBe("auction_completed");
  });

  it("refuses to cancel twice", async () => {
    const id = await makeListing({ cancelledAt: new Date() });
    expect((await cancel(id)).status).toBe(409);
  });

  it("answers 404 for a listing that doesn't exist", async () => {
    expect((await cancel(999999)).status).toBe(404);
  });

  it("is only for admins", async () => {
    const id = await makeListing({});
    expect((await cancel(id, clubToken)).status).toBe(403);
    expect((await cancel(id, buyerToken)).status).toBe(403);
  });

  it("tells everyone watching the auction that it was cancelled", async () => {
    const id = await makeListing({});
    const socket = ioClient(BASE_URL, { auth: { auctionId: String(id) }, transports: ["websocket"] });
    try {
      await new Promise<void>((resolve) => socket.once("auction_state", () => resolve()));

      const cancelled = new Promise<void>((resolve) => socket.once("auction_cancelled", () => resolve()));
      const state = new Promise<any>((resolve) => socket.once("auction_state", resolve));
      expect((await cancel(id)).status).toBe(200);

      expect((await state).status).toBe("cancelled");
      expect((await state).isActive).toBe(false);
      await cancelled;
    } finally {
      socket.disconnect();
    }
  });
});

describe("what a visitor's browser receives", () => {
  async function stateOnRequest(id: number) {
    const socket = ioClient(BASE_URL, { auth: { auctionId: String(id) }, transports: ["websocket"] });
    const events: string[] = [];
    try {
      await new Promise<void>((resolve) => socket.once("auction_state", () => resolve()));
      socket.onAny((event) => events.push(event));
      const state = new Promise<any>((resolve) => socket.once("auction_state", resolve));
      socket.emit("get_auction_state");
      const result = await state;
      await new Promise((resolve) => setTimeout(resolve, 100)); // give a stray auction_end time to arrive
      return { state: result, events };
    } finally {
      socket.disconnect();
    }
  }

  it("sends the status and the start time of a scheduled auction, without announcing a winner", async () => {
    const startsAt = new Date(Date.now() + HOUR);
    const id = await makeListing({ startsAt, endsAt: new Date(Date.now() + 2 * HOUR) });

    const { state, events } = await stateOnRequest(id);

    expect(state.status).toBe("scheduled");
    expect(state.startTime).toBe(startsAt.getTime());
    expect(events).not.toContain("auction_end");
  });

  it("does not announce a winner for a cancelled auction", async () => {
    const id = await makeListing({ cancelledAt: new Date() });

    const { state, events } = await stateOnRequest(id);

    expect(state.status).toBe("cancelled");
    expect(events).not.toContain("auction_end");
  });

  it("announces the result of a completed auction", async () => {
    const id = await makeListing({ startsAt: new Date(Date.now() - 2 * HOUR), endsAt: new Date(Date.now() - MINUTE) });

    const { state, events } = await stateOnRequest(id);

    expect(state.status).toBe("completed");
    expect(events).toContain("auction_end");
  });
});

describe("public catalogue", () => {
  it("sends the start date and the status of each auction", async () => {
    const startsAt = new Date(Date.now() + HOUR);
    const id = await makeListing({ startsAt, endsAt: new Date(Date.now() + 2 * HOUR) });

    const res = await fetch(`${BASE_URL}/api/listings`);
    const data: any[] = (await res.json()) as any[];
    const listing = data.find((l) => l.id === id);

    expect(listing.auctionStatus).toBe("scheduled");
    expect(new Date(listing.auctionStartsAt).getTime()).toBe(startsAt.getTime());
  });

  it("still lists cancelled auctions, marked as cancelled", async () => {
    const id = await makeListing({ cancelledAt: new Date() });
    expect(await publicStatus(id)).toBe("cancelled");
  });
});
