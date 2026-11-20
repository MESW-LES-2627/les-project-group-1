import { prisma } from "../config/prisma";

export interface PersistedBid {
  bidder: string;
  country?: string;
  amount: number;
  timestamp: number;
}

export async function findBidsByListingId(listingId: number): Promise<PersistedBid[]> {
  const rows = await prisma.bid.findMany({
    where: { listingId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { bidder: true, country: true, amount: true, createdAt: true },
  });

  return rows.map((row) => ({
    bidder: row.bidder,
    ...(row.country ? { country: row.country } : {}),
    amount: Number(row.amount),
    timestamp: row.createdAt.getTime(),
  }));
}

export async function createBid(listingId: number, bid: PersistedBid) {
  await prisma.bid.create({
    data: {
      listingId,
      bidder: bid.bidder,
      country: bid.country,
      amount: bid.amount,
      createdAt: new Date(bid.timestamp),
    },
  });
}

export async function deleteBidsByListingId(listingId: number) {
  await prisma.bid.deleteMany({ where: { listingId } });
}

/** Finds all active auctions where the given bidder has placed at least one bid. */
export async function findActiveBidsByBidder(bidder: string) {
  const now = new Date();

  const listings = await prisma.listing.findMany({
    where: {
      status: "verified",
      auctionEndsAt: { gt: now },
      bids: { some: { bidder } },
    },
    select: {
      id: true,
      title: true,
      images: true,
      startingPrice: true,
      auctionEndsAt: true,
      club: { select: { name: true } },
      bids: {
        orderBy: [{ amount: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        select: { bidder: true, amount: true },
      },
    },
    orderBy: { auctionEndsAt: "asc" },
  });

  return listings.map((listing) => {
    const highest = listing.bids[0];
    const currentHighestBid = highest ? Number(highest.amount) : Number(listing.startingPrice ?? 0);
    const userBids = listing.bids.filter((b) => b.bidder === bidder);
    const userHighestBid = userBids[0] ? Number(userBids[0].amount) : 0;

    return {
      listingId: listing.id,
      title: listing.title,
      clubName: listing.club.name,
      image: listing.images[0] ?? null,
      currentHighestBid,
      userHighestBid,
      isHighestBidder: highest?.bidder === bidder,
      auctionEndsAt: listing.auctionEndsAt!.toISOString(),
    };
  });
}