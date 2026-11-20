import type { Server } from "socket.io";
import { sendEmail } from "./email.service";
import { createPaymentLink } from "./stripe.service";
import { saveWinner } from "../models/winner.model";
import { findListingAuction } from "../models/listing.model";
import { createBid, findBidsByListingId } from "../models/bid.model";
import { auctionStatus, type AuctionStatus } from "./auctionStatus";

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
  /** scheduled, active, completed or cancelled. Kept up to date by syncRoom. */
  status?: AuctionStatus;
  /** When the auction opens (ms), or null if it opens as soon as it is verified. */
  startTime?: number | null;
}

export interface AuctionRoom {
  startingPrice: number;
  /** Listing status (draft, pending_verification, verified, rejected). Only verified auctions accept bids. */
  status: string;
  startsAt: number | null;
  cancelledAt?: number | null;
  state: AuctionState;
  highestBidderEmail: string | null;
}

export type PlaceBidResult =
  | { ok: true; bid: AuctionState["bids"][number] }
  | { ok: false; status: number; error: string };

const rooms = new Map<string, AuctionRoom>();

export const roomName = (auctionId: string) => `auction:${auctionId}`;

function createRoom(
  itemName: string,
  startingPrice: number,
  endTime: number,
  status = "verified",
  startsAt: number | null = null,
  cancelledAt: number | null = null
): AuctionRoom {
  const room: AuctionRoom = {
    startingPrice,
    status,
    startsAt,
    cancelledAt,
    highestBidderEmail: null,
    state: {
      itemName,
      currentBid: startingPrice,
      highestBidder: null,
      endTime,
      isActive: false,
      bidCount: 0,
      bids: [],
    },
  };
  openIfDue(room);
  return room;
}

function datesStatus(room: AuctionRoom, now: number) {
  return auctionStatus({ startsAt: room.startsAt, endsAt: room.state.endTime, cancelledAt: room.cancelledAt }, now);
}

/** Sets status and isActive from scratch, for a new room or after its dates changed. */
function openIfDue(room: AuctionRoom, now = Date.now()) {
  const status = datesStatus(room, now);
  room.state.status = status;
  room.state.startTime = room.startsAt;
  room.state.isActive = status === "active" && room.status === "verified";
}

/**
 * Brings the room's status up to date with the clock and returns the status before and after.
 * A scheduled auction opens when its start date is reached; an open one closes at its end date or when
 * cancelled. A room that was closed early stays closed (it is shown as completed).
 */
export function syncRoom(room: AuctionRoom, now = Date.now()): { previous: AuctionStatus | undefined; status: AuctionStatus } {
  const previous = room.state.status;
  let status = datesStatus(room, now);

  if (room.status !== "verified") {
    room.state.isActive = false; // not approved yet: never open, whatever the dates say
  } else if (status === "active") {
    if (previous === "scheduled") room.state.isActive = true;
    else if (!room.state.isActive) status = "completed";
  } else {
    room.state.isActive = false;
  }

  room.state.status = status;
  room.state.startTime = room.startsAt;
  return { previous, status };
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

    const room = createRoom(
      listing.title,
      listing.startingPrice,
      listing.endsAt.getTime(),
      listing.status,
      listing.startsAt ? listing.startsAt.getTime() : null,
      listing.cancelledAt ? listing.cancelledAt.getTime() : null
    );
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
  if (!room) return undefined;
  syncRoom(room);
  return { currentBid: room.state.currentBid, endTime: room.state.endTime, status: room.state.status! };
}

/**
 * Reloads an auction's dates and listing status after they changed (verified, cancelled...) and tells
 * everyone watching it. The room object is updated in place, because open sockets keep a reference to it.
 */
export async function refreshRoom(io: Server | undefined, listingId: number) {
  const room = rooms.get(String(listingId));
  if (!room) return;

  const listing = await findListingAuction(listingId);
  if (!listing) {
    rooms.delete(String(listingId));
    return;
  }

  const wasActive = room.state.isActive;
  room.status = listing.status;
  // The club may have changed the starting price; with no bids yet, it is also the current bid
  room.startingPrice = listing.startingPrice;
  if (room.state.bidCount === 0 && !room.state.highestBidder) room.state.currentBid = listing.startingPrice;
  room.startsAt = listing.startsAt ? listing.startsAt.getTime() : null;
  room.cancelledAt = listing.cancelledAt ? listing.cancelledAt.getTime() : null;
  room.state.endTime = listing.endsAt.getTime();
  openIfDue(room);
  if (wasActive && room.state.status === "active") room.state.isActive = true;

  io?.to(roomName(String(listingId))).emit("auction_state", room.state);
  if (room.state.status === "cancelled") io?.to(roomName(String(listingId))).emit("auction_cancelled");
}

export function resetRoom(room: AuctionRoom) {
  room.status = "verified";
  room.startsAt = null;
  room.cancelledAt = null;
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

  // Listings an admin hasn't approved never accept bids
  if (room.status === "rejected") {
    return { ok: false, status: 400, error: "Cannot place a bid on a cancelled auction." };
  }
  if (room.status !== "verified") {
    return { ok: false, status: 400, error: "Cannot place a bid on a scheduled auction that has not started yet." };
  }

  // Then the auction status, brought up to date with the clock
  const { status } = syncRoom(room, now);
  if (status === "cancelled") {
    return { ok: false, status: 400, error: "Cannot place a bid on a cancelled auction." };
  }
  if (status === "scheduled") {
    return { ok: false, status: 400, error: "Cannot place a bid on a scheduled auction that has not started yet." };
  }
  if (now >= auction.endTime) {
    return { ok: false, status: 400, error: "The auction has already ended." };
  }
  if (status === "completed" || !auction.isActive) {
    return { ok: false, status: 400, error: "Cannot place a bid on a completed or inactive auction." };
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

/**
 * One pass over the open auctions: scheduled ones whose start date arrived become active, and active
 * ones whose end date arrived are completed (winner, payment link, email). Exported for the tests.
 */
export function tickAuctions(io: Server, now = Date.now(), only?: string[]) {
  for (const [auctionId, room] of rooms) {
    if (only && !only.includes(auctionId)) continue;
    const wasActive = room.state.isActive;
    const { previous, status } = syncRoom(room, now);

    if (wasActive && now >= room.state.endTime) {
      endAuction(io, auctionId, room);
      io.to(roomName(auctionId)).emit("auction_state", room.state);
    } else if (previous === "scheduled" && status === "active") {
      io.to(roomName(auctionId)).emit("auction_state", room.state);
      io.to(roomName(auctionId)).emit("auction_started");
    }
  }
}

export function startAuctionTimer(io: Server) {
  setInterval(() => tickAuctions(io), 1000);
}

//Tracks the active promise queue per auction so bids on the same item run sequentially
const roomLocks = new Map<string, Promise<unknown>>();

export async function withAuctionLock<T>(auctionId: string, fn: () => Promise<T>): Promise<T> {
  //Get the tail of the current queue for this auction
  const previous = roomLocks.get(auctionId) ?? Promise.resolve();
  let release!: () => void;
  //Create a gate for the current operation that will unblock the next caller when done
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queued = previous.then(() => current);
  roomLocks.set(auctionId, queued);
  //Wait for all earlier operations on this auction to finish
  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (roomLocks.get(auctionId) === queued) {
      roomLocks.delete(auctionId);
    }
  }
}