import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { io as ioClient } from "socket.io-client";
import { httpServer } from "../src/app";
import { prisma } from "../src/config/prisma";
import { evictRoom } from "../src/services/auction.service";

const TEST_EMAILS = ["buyer1.bid@feup.pt", "buyer2.bid@feup.pt", "club.bid@feup.pt"];
const TEST_BIDDERS = ["buyer1_bid", "buyer2_bid", "club_bid"];
const TEST_TITLES = [
  "Active Bid Test Jersey",
  "Scheduled Bid Test Jersey",
  "Completed Bid Test Jersey",
  "Cancelled Bid Test Jersey",
];

let baseUrl = "";
let buyer1Token = "";
let buyer2Token = "";
let clubToken = "";
let clubId = 0;
let categoryId = 0;
let activeListingId = 0;
let scheduledListingId = 0;
let completedListingId = 0;
let cancelledListingId = 0;

async function cleanUp() {
  await prisma.bid.deleteMany({ where: { bidder: { in: TEST_BIDDERS } } });
  await prisma.listing.deleteMany({ where: { title: { in: TEST_TITLES } } });
  await prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } });
  await prisma.club.deleteMany({ where: { slug: "place-bid-test-fc" } });
  await prisma.category.deleteMany({ where: { slug: "place-bid-test-cat" } });
}

beforeAll(async () => {
  if (!httpServer.listening) {
    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  }
  const address = httpServer.address();
  const port = typeof address === "object" && address ? address.port : 3000;
  baseUrl = `http://127.0.0.1:${port}`;

  await cleanUp();

  const regBuyer1 = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "buyer1_bid",
      email: "buyer1.bid@feup.pt",
      password: "securepassword123",
      country: "PT",
    }),
  });
  buyer1Token = ((await regBuyer1.json()) as any).token;

  const regBuyer2 = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "buyer2_bid",
      email: "buyer2.bid@feup.pt",
      password: "securepassword123",
      country: "ES",
    }),
  });
  buyer2Token = ((await regBuyer2.json()) as any).token;

  const regClubUser = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "club_bid",
      email: "club.bid@feup.pt",
      password: "securepassword123",
      country: "PT",
    }),
  });
  clubToken = ((await regClubUser.json()) as any).token;
  await prisma.user.update({
    where: { email: "club.bid@feup.pt" },
    data: { role: "CLUB" },
  });

  const club = await prisma.club.create({
    data: { slug: "place-bid-test-fc", name: "Place Bid Test FC", status: "approved" },
  });
  clubId = club.id;

  const category = await prisma.category.create({
    data: { slug: "place-bid-test-cat", name: "Place Bid Test Category" },
  });
  categoryId = category.id;

  const now = Date.now();
  const lActive = await prisma.listing.create({
    data: {
      clubId,
      categoryId,
      title: "Active Bid Test Jersey",
      description: "Active auction",
      status: "verified",
      startingPrice: 100,
      verifiedAt: new Date(now - 60_000),
      auctionEndsAt: new Date(now + 3_600_000),
    },
  });
  activeListingId = lActive.id;

  const lScheduled = await prisma.listing.create({
    data: {
      clubId,
      categoryId,
      title: "Scheduled Bid Test Jersey",
      description: "Future start auction",
      status: "verified",
      startingPrice: 100,
      verifiedAt: new Date(now + 1_800_000),
      auctionEndsAt: new Date(now + 3_600_000),
    },
  });
  scheduledListingId = lScheduled.id;

  const lCompleted = await prisma.listing.create({
    data: {
      clubId,
      categoryId,
      title: "Completed Bid Test Jersey",
      description: "Already ended auction",
      status: "verified",
      startingPrice: 100,
      verifiedAt: new Date(now - 7_200_000),
      auctionEndsAt: new Date(now - 60_000),
    },
  });
  completedListingId = lCompleted.id;

  const lCancelled = await prisma.listing.create({
    data: {
      clubId,
      categoryId,
      title: "Cancelled Bid Test Jersey",
      description: "Rejected/cancelled auction",
      status: "rejected",
      startingPrice: 100,
      verifiedAt: new Date(now - 60_000),
      auctionEndsAt: new Date(now + 3_600_000),
    },
  });
  cancelledListingId = lCancelled.id;
});

afterAll(async () => {
  for (const id of [activeListingId, scheduledListingId, completedListingId, cancelledListingId]) {
    if (id) evictRoom(String(id));
  }
  await cleanUp();
  httpServer.close();
});

describe("Place a bid on an active auction", () => {
  it("rejects unauthenticated bid requests", async () => {
    const res = await fetch(`${baseUrl}/api/auction/${activeListingId}/bids`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 100 }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects bids from non-buyer roles (CLUB/seller)", async () => {
    const res = await fetch(`${baseUrl}/api/auction/${activeListingId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clubToken}`,
      },
      body: JSON.stringify({ amount: 100 }),
    });
    expect(res.status).toBe(403);
    const data = (await res.json()) as any;
    expect(data.error).toBe("Only buyers can place bids.");
  });

  it("requires a valid bid amount", async () => {
    const missing = await fetch(`${baseUrl}/api/auction/${activeListingId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({}),
    });
    expect(missing.status).toBe(400);

    const negative = await fetch(`${baseUrl}/api/auction/${activeListingId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({ amount: -10 }),
    });
    expect(negative.status).toBe(400);
  });

  it("rejects a first bid lower than the starting bid", async () => {
    const res = await fetch(`${baseUrl}/api/auction/${activeListingId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({ amount: 90 }),
    });
    expect(res.status).toBe(400);
  });

  it("accepts a first bid equal to the starting bid", async () => {
    const res = await fetch(`${baseUrl}/api/auction/${activeListingId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({ amount: 100 }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as any;
    expect(data.auction.currentBid).toBe(100);
    expect(data.auction.highestBidder).toBe("buyer1_bid");
  });

  it("requires subsequent bids to be strictly higher than the current highest bid", async () => {
    const equalRes = await fetch(`${baseUrl}/api/auction/${activeListingId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer2Token}`,
      },
      body: JSON.stringify({ amount: 100 }),
    });
    expect(equalRes.status).toBe(400);

    const higherRes = await fetch(`${baseUrl}/api/auction/${activeListingId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer2Token}`,
      },
      body: JSON.stringify({ amount: 120 }),
    });
    expect(higherRes.status).toBe(201);
    const data = (await higherRes.json()) as any;
    expect(data.auction.currentBid).toBe(120);
    expect(data.auction.highestBidder).toBe("buyer2_bid");
  });

  it("rejects bids on scheduled, completed, and cancelled auctions", async () => {
    for (const id of [scheduledListingId, completedListingId, cancelledListingId]) {
      const res = await fetch(`${baseUrl}/api/auction/${id}/bids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${buyer1Token}`,
        },
        body: JSON.stringify({ amount: 200 }),
      });
      expect(res.status).toBe(400);
    }
  });

  it("rejects socket bids from CLUB accounts with bid_error", async () => {
    const socket = ioClient(baseUrl, {
      auth: { token: clubToken, auctionId: String(activeListingId) },
      transports: ["websocket"],
    });

    const errMsg = await new Promise<string>((resolve) => {
      socket.on("auction_state", () => {
        socket.emit("place_bid", 250);
      });
      socket.on("bid_error", (msg: string) => resolve(msg));
    });

    socket.disconnect();
    expect(errMsg).toBe("Only buyers can place bids.");
  });

  it("handles concurrent bids consistently so only valid higher bids succeed", async () => {
    // Current highest bid from previous test is 120. Five identical concurrent bids
    // must produce exactly one accepted bid: the lock prevents duplicate 150s.
    const amounts = [150, 150, 150, 150, 150];
    const responses = await Promise.all(
      amounts.map((amount, idx) =>
        fetch(`${baseUrl}/api/auction/${activeListingId}/bids`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idx % 2 === 0 ? buyer1Token : buyer2Token}`,
          },
          body: JSON.stringify({ amount }),
        }),
      ),
    );

    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((status) => status === 201)).toHaveLength(1);
    expect(statuses.filter((status) => status === 400)).toHaveLength(4);

    // Now that the highest bid is 150, all lower/equal concurrent bids must fail,
    // regardless of the order in which the requests reach the auction lock.
    const tooLowAmounts = [125, 140, 150, 149, 150];
    const tooLowResponses = await Promise.all(
      tooLowAmounts.map((amount, idx) =>
        fetch(`${baseUrl}/api/auction/${activeListingId}/bids`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idx % 2 === 0 ? buyer1Token : buyer2Token}`,
          },
          body: JSON.stringify({ amount }),
        }),
      ),
    );
    expect(tooLowResponses.map((r) => r.status)).toEqual([400, 400, 400, 400, 400]);

    const finalRes = await fetch(`${baseUrl}/api/auction/${activeListingId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer2Token}`,
      },
      body: JSON.stringify({ amount: 150 }),
    });
    expect(finalRes.status).toBe(400);
  });

});