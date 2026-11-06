import type { Server } from "socket.io";
import { sendEmail } from "./email.service";
import { createPaymentLink } from "./stripe.service";
import { saveWinner } from "../models/winner.model";
import { findListingAuction } from "../models/listing.model";

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
  state: AuctionState;
  highestBidderEmail: string | null;
}

const rooms = new Map<string, AuctionRoom>();

export const roomName = (auctionId: string) => `auction:${auctionId}`;

function createRoom(itemName: string, startingPrice: number, endTime: number): AuctionRoom {
  return {
    startingPrice,
    highestBidderEmail: null,
    state: {
      itemName,
      currentBid: startingPrice,
      highestBidder: null,
      endTime,
      isActive: endTime > Date.now(),
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

    const room = createRoom(listing.title, listing.startingPrice, listing.endsAt.getTime());
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
  room.state = createRoom(room.state.itemName, room.startingPrice, Date.now() + AUCTION_DURATION).state;
  room.highestBidderEmail = null;
}

/** Returns true if the bid was accepted. */
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
