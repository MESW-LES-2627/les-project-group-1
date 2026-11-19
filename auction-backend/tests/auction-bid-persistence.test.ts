import { afterAll, beforeAll, describe, expect, test } from "bun:test";

process.env.STRIPE_SECRET_KEY = "sk_test_bid_persistence";
process.env.RESEND_API_KEY = "re_test_bid_persistence";
process.env.FRONTEND_URL = "http://localhost:5173";

const { prisma } = await import("../src/config/prisma");
const { getRoom } = await import("../src/services/auction.service");

describe("auction bid persistence", () => {
  const suffix = Date.now().toString();
  let listingId: number;
  let categoryId: number;
  let clubId: number;

  beforeAll(async () => {
    const category = await prisma.category.create({
      data: { slug: `bid-test-${suffix}`, name: `Bid test ${suffix}` },
    });
    categoryId = category.id;

    const club = await prisma.club.create({
      data: { slug: `bid-test-${suffix}`, name: `Bid Test Club ${suffix}` },
    });
    clubId = club.id;

    const listing = await prisma.listing.create({
      data: {
        clubId,
        categoryId,
        title: `Bid persistence test ${suffix}`,
        description: "Test listing",
        status: "verified",
        startingPrice: 50,
        auctionEndsAt: new Date(Date.now() + 60_000),
      },
    });
    listingId = listing.id;

    await prisma.bid.createMany({
      data: [
        {
          listingId,
          bidder: "alice",
          country: "PT",
          amount: 80,
          createdAt: new Date(Date.now() - 2_000),
        },
        {
          listingId,
          bidder: "bob",
          country: "ES",
          amount: 120,
          createdAt: new Date(Date.now() - 1_000),
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.listing.delete({ where: { id: listingId } });
    await prisma.category.delete({ where: { id: categoryId } });
    await prisma.club.delete({ where: { id: clubId } });
  });

  test("loads the persisted history and current highest bid", async () => {
    const room = await getRoom(String(listingId));

    expect(room).not.toBeNull();
    expect(room?.state.bids.map((bid) => bid.amount)).toEqual([120, 80]);
    expect(room?.state.bidCount).toBe(2);
    expect(room?.state.currentBid).toBe(120);
    expect(room?.state.highestBidder).toBe("bob");
  });
});
