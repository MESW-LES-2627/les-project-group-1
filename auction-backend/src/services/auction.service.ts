import type { Server } from "socket.io";
import { sendEmail } from "./email.service";
import { createPaymentLink } from "./stripe.service";
import { saveWinner } from "../models/winner.model";
import { findListingAuction } from "../models/listing.model";
import { createBid, findBidsByListingId } from "../models/bid.model";

/**
 * Auction logic: one in-memory room per auction, bidding rules, and the timer
 * that closes each auction, creates the payment link, saves the winner and emails them.
 */

const AUCTION_DURATION = 120_000; // 120 seconds
export const DEMO_ID = "demo"; // sprint 0 prototype auction

export interface AuctionState {
  itemName: string;
  currentBid: number;
  highestBidder: string | null;
  endTime: number;
  isActive: boolean;
  bidCount: number;
  bids: Array<{ bidder: string; country?: string; amount: number; timestamp: number }>;
}

export interface AuctionRoom {
  startingPrice: number;
  status: string;
  startsAt: number | null;
  state: AuctionState;
  highestBidderEmail: string | null;
}

export type PlaceBidResult =
  | { ok: true; bid: AuctionState["bids"][number] }
  | { ok: false; status: number; error: string };

const rooms = new Map<string, AuctionRoom>();

export const roomName = (auctionId: string) => `auction:${auctionId}`;

function createRoom(itemName: string, startingPrice: number, endTime: number, status = "verified", startsAt: number | null = null ): 
AuctionRoom {
  const now = Date.now();
  const isScheduled = status !== "verified" || (startsAt !== null && startsAt > now);
  return {
    startingPrice,
    status,
    startsAt,
    highestBidderEmail: null,
    state: {
      itemName,
      currentBid: startingPrice,
      highestBidder: null,
      endTime,
      isActive: !isScheduled && endTime > now,
      bidCount: 0,
      bids: [],
    },
  };
}

// Sprint 0 prototype auction
rooms.set(DEMO_ID, createRoom("Velocity", 50, Date.now() + AUCTION_DURATION));

/** Gets the room of an auction. Catalogue auctions are created from the database the first time they are opened. */
export async function getRoom(auctionId: string): Promise<AuctionRoom | null> {
  const existing = rooms.get(auctionId);
  if (existing) return existing;

  try {
    const listing = await findListingAuction(Number(auctionId));
    if (!listing) return null;

    const created = rooms.get(auctionId);
    if (created) return created;

    const room = createRoom(listing.title, listing.startingPrice, listing.endsAt.getTime(), listing.status, listing.startsAt ? listing.startsAt.getTime() : null);
    const bids = await findBidsByListingId(Number(auctionId));
    room.state.bids = bids;
    room.state.bidCount = bids.length;
    if (bids[0]) {
      room.state.currentBid = bids[0].amount;
      room.state.highestBidder = bids[0].bidder;
    }
    rooms.set(auctionId, room);
    return room;
  } catch (err) {
    console.error("Could not load auction:", err);
    return null;
  }
}

/** Live values of an open auction, so catalogue cards match the auction page. */
export function getLiveAuction(listingId: number) {
  const room = rooms.get(String(listingId));
  return room ? { currentBid: room.state.currentBid, endTime: room.state.endTime } : undefined;
}

export function resetRoom(room: AuctionRoom) {
  room.status = "verified";
  room.startsAt = null;
  room.state = createRoom(room.state.itemName, room.startingPrice, Date.now() + AUCTION_DURATION).state;
  room.highestBidderEmail = null;
}

/** Removes an auction room from memory (useful when listing status/dates change or in tests). */
export function evictRoom(auctionId: string) {
  rooms.delete(auctionId);
}

/** Returns true if the bid was accepted. 
export function placeBid(
  room: AuctionRoom,
  amount: number,
  bidder: { name: string; email: string; country?: string },
) {
  const auction = room.state;
  if (!auction.isActive || Date.now() >= auction.endTime) return false;
  if (typeof amount !== "number" || !Number.isFinite(amount)) return false;
  if (amount <= auction.currentBid) return false; // only higher bids

  auction.currentBid = amount;
  auction.highestBidder = bidder.name;
  room.highestBidderEmail = bidder.email;
  auction.bidCount += 1;
  auction.bids.unshift({ bidder: bidder.name, country: bidder.country, amount, timestamp: Date.now() });
  return true;
}*/

/** Validates auction status, timing, and bid amount rules, updating room state if accepted. */
export function evaluateAndPlaceBid(
  room: AuctionRoom,
  amount: unknown,
  bidder: { name: string; email: string; country?: string },
): PlaceBidResult {
  const now = Date.now();
  const auction = room.state;

  // Reject scheduled, cancelled, or non-active listings
  if (room.status === "cancelled" || room.status === "rejected") {
    return { ok: false, status: 400, error: "Cannot place a bid on a cancelled auction." };
  }
  if (room.status === "completed" || !auction.isActive) {
    return { ok: false, status: 400, error: "Cannot place a bid on a completed or inactive auction." };
  }
  if (
    room.status === "scheduled" ||
    room.status === "draft" ||
    room.status === "pending_verification" ||
    (room.startsAt !== null && now < room.startsAt)
  ) {
    return { ok: false, status: 400, error: "Cannot place a bid on a scheduled auction that has not started yet." };
  }

  // Reject bids placed at or after the auction end time
  if (now >= auction.endTime) {
    auction.isActive = false;
    return { ok: false, status: 400, error: "The auction has already ended." };
  }

  // Validate bid amount presence and numeric type
  if (amount === undefined || amount === null || amount === "") {
    return { ok: false, status: 400, error: "Bid amount is required." };
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, status: 400, error: "Bid amount must be a valid positive number." };
  }

  // First bid must be >= startingPrice; subsequent bids must be strictly > currentBid
  if (auction.bidCount === 0 && !auction.highestBidder) {
    if (amount < room.startingPrice) {
      return {
        ok: false,
        status: 400,
        error: `First bid must be at least the starting bid of ${room.startingPrice}.`,
      };
    }
  } else if (amount <= auction.currentBid) {
    return {
      ok: false,
      status: 400,
      error: `Bid amount must be higher than the current highest bid of ${auction.currentBid}.`,
    };
  }

  const bid = {
    bidder: bidder.name,
    country: bidder.country,
    amount,
    timestamp: now,
  };

  auction.currentBid = amount;
  auction.highestBidder = bidder.name;
  room.highestBidderEmail = bidder.email;
  auction.bidCount += 1;
  auction.bids.unshift(bid);

  return { ok: true, bid };
}

/** Boolean wrapper kept for backwards compatibility with existing callers. */
export function placeBid(
    room: AuctionRoom,
    amount: number,
    bidder: { name: string; email: string; country?: string },
  ): boolean {
    return evaluateAndPlaceBid(room, amount, bidder).ok;
  }

/** Persists an accepted bid for catalogue auctions. The demo auction has no listing row. */
export async function persistBid(auctionId: string, bid: AuctionState["bids"][number]) {
  if (auctionId === DEMO_ID || !/^\d+$/.test(auctionId)) return;
  await createBid(Number(auctionId), bid);
}

/** Removes a bid when its database write fails, keeping the live room consistent. */
export function discardBid(room: AuctionRoom, bid: AuctionState["bids"][number]) {
  const index = room.state.bids.indexOf(bid);
  if (index === -1) return;

  room.state.bids.splice(index, 1);
  room.state.bidCount -= 1;
  const latestBid = room.state.bids[0];
  room.state.currentBid = latestBid?.amount ?? room.startingPrice;
  room.state.highestBidder = latestBid?.bidder ?? null;
  room.highestBidderEmail = null;
}

function endAuction(io: Server, auctionId: string, room: AuctionRoom) {
  const auction = room.state;
  auction.isActive = false;

  if (auction.highestBidder) {
    const winnerId = auction.highestBidder;
    const email = room.highestBidderEmail ?? undefined;
    const itemName = auction.itemName;
    const winningBid = auction.currentBid;
    const endedAt = new Date();

    createPaymentLink(itemName, winningBid, email)
      .then(async (link) => {
        try {
          await saveWinner({ itemName, socketId: winnerId, email, winningBid, endedAt, stripeSessionId: link.id });
        } catch (err) {
          console.error("Could not save winner:", err);
        }
        console.log("Payment link:", link.url);
        io.to(winnerId).emit("payment_link", link.url);

        if (email) {
          await sendEmail(
            email,
            `You won the auction: ${itemName}`,
            `<p>Congratulations! Your winning bid was ${winningBid} €.</p>
             <p><a href="${link.url}">Pay now</a></p>`,
          ).catch((err) => console.error("Could not send email:", err));
        } else {
          console.warn("Winner email unavailable; skipping auction email.");
        }
      })
      .catch((err) => console.error("Could not create payment link:", err));
  } else {
    console.log(`Auction ${auctionId} ended with no bids.`);
  }

  // Announce the winner to everyone watching this auction
  io.to(roomName(auctionId)).emit("auction_end", {
    winner: auction.highestBidder,
    winningBid: auction.currentBid,
  });
}

export function startAuctionTimer(io: Server) {
  setInterval(() => {
    for (const [auctionId, room] of rooms) {
      if (room.state.isActive && Date.now() >= room.state.endTime) {
        endAuction(io, auctionId, room);
      }
    }
  }, 1000);
}
