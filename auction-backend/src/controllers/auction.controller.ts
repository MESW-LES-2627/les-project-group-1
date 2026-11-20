import type { Request, Response } from "express";
import type { Server } from "socket.io";
import { DEMO_ID, discardBid, evaluateAndPlaceBid, getRoom, persistBid, resetRoom, roomName, withAuctionLock } from "../services/auction.service";
import { deleteBidsByListingId } from "../models/bid.model";
import { prisma } from "../config/prisma";

/**
* Demo endpoint: restart an auction without redeploying.
* Use ?auctionId=<id> for a catalogue auction; no parameter resets the prototype auction.
 */
export async function reset(req: Request, res: Response) {
  const io: Server = req.app.get("io");
  const auctionId = typeof req.query.auctionId === "string" ? req.query.auctionId : DEMO_ID;

  const room = await getRoom(auctionId);
  if (!room) return res.status(404).json({ error: "auction not found" });

  resetRoom(room);
  if (auctionId !== DEMO_ID && /^\d+$/.test(auctionId)) {
    await deleteBidsByListingId(Number(auctionId));
  }
  io.to(roomName(auctionId)).emit("auction_state", room.state);
  io.to(roomName(auctionId)).emit("auction_reset");
  res.json({ success: true, auction: room.state });
}

// Authenticated REST endpoint allowing BUYER users to place a bid.
export async function submitBid(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const auctionId = String(req.params.auctionId ?? "").trim();
  if (!auctionId) {
    return res.status(400).json({ error: "Invalid auction id." });
  }

  const rawAmount = req.body?.amount;
  if (rawAmount === undefined || rawAmount === null || rawAmount === "") {
    return res.status(400).json({ error: "Bid amount is required." });
  }

  const amount = typeof rawAmount === "string" ? Number(rawAmount) : rawAmount;
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return res.status(400).json({ error: "Bid amount must be a valid number." });
  }

  const bidderProfile = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { username: true, email: true, country: true, role: true },
  });
  if (!bidderProfile) {
    return res.status(401).json({ error: "Authentication required." });
  }
  if (bidderProfile.role !== "BUYER") {
    return res.status(403).json({ error: "Only buyers can place bids." });
  }

  return withAuctionLock(auctionId, async () => {
    const room = await getRoom(auctionId);
    if (!room) {
      return res.status(404).json({ error: "Auction not found." });
    }

    const result = evaluateAndPlaceBid(room, amount, {
      name: bidderProfile.username,
      email: bidderProfile.email,
      country: bidderProfile.country,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    try {
      await persistBid(auctionId, result.bid);
    } catch (err) {
      discardBid(room, result.bid);
      console.error("Could not persist bid:", err);
      return res.status(500).json({ error: "Could not persist bid." });
    }

    const io: Server | undefined = req.app.get("io");
    io?.to(roomName(auctionId)).emit("auction_state", room.state);

    return res.status(201).json({
      message: "Bid placed successfully.",
      bid: result.bid,
      auction: room.state,
    });
  });
}