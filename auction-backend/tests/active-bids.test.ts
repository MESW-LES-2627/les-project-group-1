import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { httpServer } from "../src/app";
import { prisma } from "../src/config/prisma";

const PORT = 3003;
const BASE_URL = `http://localhost:${PORT}`;

let aliceToken = "";
let bobToken = "";
let clubId = 0;
let categoryId = 0;
let activeWinningListingId = 0;
let activeOutbidListingId = 0;
let endedListingId = 0;
let unbidListingId = 0;

beforeAll(async () => {
  if (!httpServer.listening) {
    httpServer.listen(PORT);
  }

  // Clean up test records
  await prisma.bid.deleteMany({ where: { bidder: { in: ["alice_bidder", "bob_bidder"] } } });
  await prisma.listing.deleteMany({
    where: {
      title: {
        in: [
          "Active Winning Jersey",
          "Active Outbid Jersey",
          "Ended Auction Jersey",
          "Unbid Active Jersey",
        ],
      },
    },
  });
  await prisma.user.deleteMany({
    where: { email: { in: ["alice.bids@feup.pt", "bob.bids@feup.pt"] } },
  });
  await prisma.club.deleteMany({ where: { slug: "active-bids-fc" } });
  await prisma.category.deleteMany({ where: { slug: "active-bids-cat" } });

  // Register two bidders via API to obtain valid JWT tokens
  const resAlice = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "alice_bidder",
      email: "alice.bids@feup.pt",
      password: "securepassword123",
      country: "PT",
    }),
  });
  aliceToken = ((await resAlice.json()) as any).token;

  const resBob = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "bob_bidder",
      email: "bob.bids@feup.pt",
      password: "securepassword123",
      country: "ES",
    }),
  });
  bobToken = ((await resBob.json()) as any).token;

  // Create club, category, and listings in different states
  const club = await prisma.club.create({
    data: { slug: "active-bids-fc", name: "Active Bids FC", status: "approved" },
  });
  clubId = club.id;

  const category = await prisma.category.create({
    data: { slug: "active-bids-cat", name: "Active Bids Category" },
  });
  categoryId = category.id;

  const future1 = new Date(Date.now() + 60 * 60 * 1000);
  const future2 = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const past = new Date(Date.now() - 60 * 1000);

  const l1 = await prisma.listing.create({
    data: {
      clubId,
      categoryId,
      title: "Active Winning Jersey",
      description: "Test listing where Alice leads",
      images: ["/jersey-1.png"],
      status: "verified",
      startingPrice: 100,
      auctionEndsAt: future1,
    },
  });
  activeWinningListingId = l1.id;

  const l2 = await prisma.listing.create({
    data: {
      clubId,
      categoryId,
      title: "Active Outbid Jersey",
      description: "Test listing where Bob outbid Alice",
      images: ["/jersey-2.png"],
      status: "verified",
      startingPrice: 150,
      auctionEndsAt: future2,
    },
  });
  activeOutbidListingId = l2.id;

  const l3 = await prisma.listing.create({
    data: {
      clubId,
      categoryId,
      title: "Ended Auction Jersey",
      description: "Expired listing",
      status: "verified",
      startingPrice: 80,
      auctionEndsAt: past,
    },
  });
  endedListingId = l3.id;

  const l4 = await prisma.listing.create({
    data: {
      clubId,
      categoryId,
      title: "Unbid Active Jersey",
      description: "Active listing without Alice's bids",
      status: "verified",
      startingPrice: 90,
      auctionEndsAt: future1,
    },
  });
  unbidListingId = l4.id;

  // Seed bids:
  await prisma.bid.createMany({
    data: [
      { listingId: activeWinningListingId, bidder: "bob_bidder", country: "ES", amount: 110 },
      { listingId: activeWinningListingId, bidder: "alice_bidder", country: "PT", amount: 130 },
      { listingId: activeOutbidListingId, bidder: "alice_bidder", country: "PT", amount: 160 },
      { listingId: activeOutbidListingId, bidder: "bob_bidder", country: "ES", amount: 180 },
      { listingId: endedListingId, bidder: "alice_bidder", country: "PT", amount: 95 },
      { listingId: unbidListingId, bidder: "bob_bidder", country: "ES", amount: 100 },
    ],
  });
});

afterAll(async () => {
  await prisma.bid.deleteMany({ where: { bidder: { in: ["alice_bidder", "bob_bidder"] } } });
  await prisma.listing.deleteMany({
    where: {
      id: {
        in: [
          activeWinningListingId,
          activeOutbidListingId,
          endedListingId,
          unbidListingId,
        ],
      },
    },
  });
  await prisma.user.deleteMany({
    where: { email: { in: ["alice.bids@feup.pt", "bob.bids@feup.pt"] } },
  });
  if (clubId) await prisma.club.delete({ where: { id: clubId } }).catch(() => {});
  if (categoryId) await prisma.category.delete({ where: { id: categoryId } }).catch(() => {});

  httpServer.close();
  await prisma.$disconnect();
});

describe("GET /api/users/me/active-bids", () => {
  it("requires authentication", async () => {
    const res = await fetch(`${BASE_URL}/api/users/me/active-bids`);
    expect(res.status).toBe(401);
  });

  it("returns only active auctions where the user has placed at least one bid", async () => {
    const res = await fetch(`${BASE_URL}/api/users/me/active-bids`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    expect(res.status).toBe(200);

    const data = (await res.json()) as { activeBids: any[] };
    expect(data.activeBids).toHaveLength(2);

    const listingIds = data.activeBids.map((b) => b.listingId);
    expect(listingIds).toContain(activeWinningListingId);
    expect(listingIds).toContain(activeOutbidListingId);
    expect(listingIds).not.toContain(endedListingId);
    expect(listingIds).not.toContain(unbidListingId);
  });

  it("correctly identifies whether the user is the current highest bidder and includes auction details", async () => {
    const res = await fetch(`${BASE_URL}/api/users/me/active-bids`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    expect(res.status).toBe(200);

    const { activeBids } = (await res.json()) as { activeBids: any[] };

    const winning = activeBids.find((b) => b.listingId === activeWinningListingId);
    expect(winning).toBeDefined();
    expect(winning.title).toBe("Active Winning Jersey");
    expect(winning.currentHighestBid).toBe(130);
    expect(winning.userHighestBid).toBe(130);
    expect(winning.isHighestBidder).toBe(true);
    expect(typeof winning.auctionEndsAt).toBe("string");

    const outbid = activeBids.find((b) => b.listingId === activeOutbidListingId);
    expect(outbid).toBeDefined();
    expect(outbid.title).toBe("Active Outbid Jersey");
    expect(outbid.currentHighestBid).toBe(180);
    expect(outbid.userHighestBid).toBe(160);
    expect(outbid.isHighestBidder).toBe(false);
  });

  it("returns an empty list for a user who has not placed any bids on active auctions", async () => {
    const resFresh = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "charlie_nobids",
        email: "charlie.nobids@feup.pt",
        password: "securepassword123",
        country: "PT",
      }),
    });
    const freshToken = ((await resFresh.json()) as any).token;

    const res = await fetch(`${BASE_URL}/api/users/me/active-bids`, {
      headers: { Authorization: `Bearer ${freshToken}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { activeBids: any[] };
    expect(data.activeBids).toEqual([]);

    await prisma.user.deleteMany({ where: { email: "charlie.nobids@feup.pt" } });
  });
});