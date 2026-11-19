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
