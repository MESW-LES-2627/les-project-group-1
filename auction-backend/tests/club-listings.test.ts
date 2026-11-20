import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { httpServer } from "../src/app";
import { prisma } from "../src/config/prisma";
import { removeUploadedFiles } from "../src/utils/imageFiles";

/**
 * Creating auctions as a club: POST /api/clubs/me/listings and GET /api/clubs/me/listings.
 * Everything this file creates uses the "test-club-listings" prefix and is deleted at the end.
 */

const PORT = 3004; // different port for testing to avoid conflicts with the main server
const BASE_URL = `http://localhost:${PORT}`;
const PREFIX = "test-club-listings";
const PASSWORD = "clubpassword123";

// Smallest valid PNG (1x1), so the server's image check accepts it
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

let approvedToken = "";
let pendingToken = "";
let otherClubToken = "";
let buyerToken = "";
let adminToken = "";
let categoryId = 0;

async function createUser(name: string, role: "CLUB" | "BUYER" | "ADMIN", clubStatus?: string) {
  const user = await prisma.user.create({
    data: {
      username: `${PREFIX}-${name}`,
      email: `${PREFIX}-${name}@feup.pt`,
      passwordHash: await Bun.password.hash(PASSWORD, { algorithm: "argon2id" }),
      country: "PT",
      role,
    },
  });
  if (clubStatus) {
    await prisma.club.create({
      data: { userId: user.id, slug: `${PREFIX}-${name}`, name: `${PREFIX} ${name}`, status: clubStatus },
    });
  }

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: PASSWORD }),
  });
  const data: any = await res.json();
  return data.token as string;
}

async function cleanUp() {
  const listings = await prisma.listing.findMany({
    where: { club: { slug: { startsWith: PREFIX } } },
    select: { images: true, evidenceImages: true },
  });
  await removeUploadedFiles(listings.flatMap((l) => [...l.images, ...l.evidenceImages]));
  await prisma.listing.deleteMany({ where: { club: { slug: { startsWith: PREFIX } } } });
  await prisma.club.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
}

function listingForm(fields: Record<string, string>, images = 0) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  for (let i = 0; i < images; i++) form.append("images", new Blob([PNG], { type: "image/png" }), `photo-${i}.png`);
  return form;
}

function createListing(token: string, body: FormData | object) {
  const isForm = body instanceof FormData;
  return fetch(`${BASE_URL}/api/clubs/me/listings`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isForm ? {} : { "Content-Type": "application/json" }),
    },
    body: isForm ? body : JSON.stringify(body),
  });
}

function listMine(token: string) {
  return fetch(`${BASE_URL}/api/clubs/me/listings`, { headers: { Authorization: `Bearer ${token}` } });
}

const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

beforeAll(async () => {
  if (!httpServer.listening) httpServer.listen(PORT);
  await cleanUp(); // leftovers from an interrupted run

  const category = await prisma.category.findFirst({ select: { id: true } });
  if (!category) throw new Error("No categories in the database. Run the migrations and the seed first.");
  categoryId = category.id;

  approvedToken = await createUser("approved", "CLUB", "approved");
  pendingToken = await createUser("pending", "CLUB", "pending");
  otherClubToken = await createUser("other", "CLUB", "approved");
  buyerToken = await createUser("buyer", "BUYER");
  adminToken = await createUser("admin", "ADMIN");
});

afterAll(async () => {
  await cleanUp();
  httpServer.close();
});

describe("POST /api/clubs/me/listings: who can create", () => {
  it("rejects requests without a token", async () => {
    const res = await createListing("", { categoryId, title: `${PREFIX} no token`, description: "A jersey with no owner." });
    expect(res.status).toBe(401);
  });

  it("rejects buyers", async () => {
    const res = await createListing(buyerToken, { categoryId, title: `${PREFIX} buyer`, description: "Buyers can't sell." });
    expect(res.status).toBe(403);
  });

  it("rejects clubs that are not approved yet", async () => {
    const res = await createListing(pendingToken, { categoryId, title: `${PREFIX} pending`, description: "Not approved yet." });
    expect(res.status).toBe(403);
    const data: any = await res.json();
    expect(data.error).toBe("club_not_approved");
  });
});

describe("POST /api/clubs/me/listings: drafts", () => {
  it("saves a draft with only the required fields", async () => {
    const res = await createListing(
      approvedToken,
      listingForm({ categoryId: String(categoryId), title: `${PREFIX} draft`, description: "Training jersey, size L.", status: "draft" })
    );
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.status).toBe("draft");
    expect(data.startingPrice).toBeNull();
    expect(data.images).toEqual([]);
  });

  it("starts as a draft when no status is sent", async () => {
    const res = await createListing(approvedToken, {
      categoryId,
      title: `${PREFIX} default status`,
      description: "No status in the request.",
    });
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.status).toBe("draft");
  });

  it("stores player details sent as JSON text in a form", async () => {
    const res = await createListing(
      approvedToken,
      listingForm({
        categoryId: String(categoryId),
        title: `${PREFIX} player details`,
        description: "Signed by the captain.",
        playerName: "Test Player",
        playerDetails: JSON.stringify({ size: "M", age: 30, position: "Forward" }),
        tags: "signed, match-worn",
      })
    );
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.playerName).toBe("Test Player");
    expect(data.playerDetails).toEqual({ size: "M", age: 30, position: "Forward" });
    expect(data.tags).toEqual(["signed", "match-worn"]);
  });

  it("stores no player details when the field is empty", async () => {
    const res = await createListing(
      approvedToken,
      listingForm({ categoryId: String(categoryId), title: `${PREFIX} no details`, description: "Team jersey.", playerDetails: "" })
    );
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.playerDetails).toBeNull();
  });
});

describe("POST /api/clubs/me/listings: sending for verification", () => {
  it("creates a listing pending verification when price, end date and a photo are there", async () => {
    const res = await createListing(
      approvedToken,
      listingForm(
        {
          categoryId: String(categoryId),
          title: `${PREFIX} complete`,
          description: "Match-worn home jersey.",
          startingPrice: "150",
          auctionEndsAt: tomorrow(),
          status: "pending_verification",
        },
        1
      )
    );
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.status).toBe("pending_verification");
    expect(data.startingPrice).toBe(150);
    expect(data.images).toHaveLength(1);
    expect(data.images[0]).toStartWith("/uploads/listings/");
  });

  it("says what is missing when the listing is incomplete", async () => {
    const res = await createListing(
      approvedToken,
      listingForm({
        categoryId: String(categoryId),
        title: `${PREFIX} incomplete`,
        description: "No price, no date, no photo.",
        status: "pending_verification",
      })
    );
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("incomplete_listing");
    expect(data.missing).toEqual(["startingPrice", "auctionEndsAt", "images"]);
  });

  it("never lets a club create a listing that is already verified", async () => {
    const res = await createListing(approvedToken, {
      categoryId,
      title: `${PREFIX} verified`,
      description: "Trying to skip the admin.",
      status: "verified",
    });
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("invalid_status");
  });
});

describe("POST /api/clubs/me/listings: validation", () => {
  const cases: Array<[string, Record<string, unknown>, string]> = [
    ["a short title", { title: "ab" }, "invalid_title"],
    ["a short description", { description: "short" }, "invalid_description"],
    ["an end date in the past", { auctionEndsAt: "2020-01-01T00:00:00.000Z" }, "invalid_auction_ends_at"],
    ["a negative price", { startingPrice: -5 }, "invalid_starting_price"],
    ["player details that are not an object", { playerDetails: ["a", "b"] }, "invalid_player_details"],
  ];

  for (const [name, change, error] of cases) {
    it(`rejects ${name}`, async () => {
      const res = await createListing(approvedToken, {
        categoryId,
        title: `${PREFIX} validation ${error}`,
        description: "A valid description.",
        ...change,
      });
      expect(res.status).toBe(400);
      const data: any = await res.json();
      expect(data.error).toBe(error);
    });
  }

  it("rejects a category that doesn't exist", async () => {
    const res = await createListing(approvedToken, {
      categoryId: 999999,
      title: `${PREFIX} unknown category`,
      description: "A valid description.",
    });
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("unknown_category");
  });

  it("rejects a title another listing already uses", async () => {
    const body = { categoryId, title: `${PREFIX} duplicate`, description: "A valid description." };
    expect((await createListing(approvedToken, body)).status).toBe(201);
    const res = await createListing(approvedToken, body);
    expect(res.status).toBe(409);
    const data: any = await res.json();
    expect(data.error).toBe("title_taken");
  });

  it("rejects files that are not images", async () => {
    const form = listingForm({ categoryId: String(categoryId), title: `${PREFIX} not an image`, description: "A valid description." });
    form.append("images", new Blob(["just some text, not a picture"], { type: "image/png" }), "fake.png");
    const res = await createListing(approvedToken, form);
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toBe("invalid_image");
  });
});

describe("GET /api/clubs/me/listings", () => {
  it("returns the club's drafts and listings pending verification", async () => {
    const res = await listMine(approvedToken);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    const titles = data.items.map((l: any) => l.title);
    expect(titles).toContain(`${PREFIX} draft`);
    expect(titles).toContain(`${PREFIX} complete`);
  });

  it("filters by status", async () => {
    const res = await fetch(`${BASE_URL}/api/clubs/me/listings?status=pending_verification`, {
      headers: { Authorization: `Bearer ${approvedToken}` },
    });
    const data: any = await res.json();
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items.every((l: any) => l.status === "pending_verification")).toBe(true);
  });

  it("doesn't show one club's listings to another club", async () => {
    const res = await listMine(otherClubToken);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.items).toEqual([]);
    expect(data.total).toBe(0);
  });
});

describe("PATCH /api/admin/listings/:id/status: verification date", () => {
  function setStatus(id: number, status: string) {
    return fetch(`${BASE_URL}/api/admin/listings/${id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function submittedListing(title: string) {
    const res = await createListing(
      approvedToken,
      listingForm(
        {
          categoryId: String(categoryId),
          title: `${PREFIX} ${title}`,
          description: "Waiting for the admin.",
          startingPrice: "80",
          auctionEndsAt: tomorrow(),
          status: "pending_verification",
        },
        1
      )
    );
    const data: any = await res.json();
    expect(data.verifiedAt).toBeNull();
    return data.id as number;
  }

  it("records when the admin verified the listing", async () => {
    const id = await submittedListing("to verify");
    const before = Date.now();

    const res = await setStatus(id, "verified");

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.status).toBe("verified");
    expect(data.verifiedAt).not.toBeNull();
    const verifiedAt = new Date(data.verifiedAt).getTime();
    expect(verifiedAt).toBeGreaterThanOrEqual(before - 1000);
    expect(verifiedAt).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it("clears the date when the listing goes back to pending verification", async () => {
    const id = await submittedListing("verified then reset");
    await setStatus(id, "verified");

    const res = await setStatus(id, "pending_verification");

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.status).toBe("pending_verification");
    expect(data.verifiedAt).toBeNull();
  });
});
