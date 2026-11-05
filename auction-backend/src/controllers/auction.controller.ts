import type { Request, Response } from "express";
import type { Server } from "socket.io";
import { DEMO_ID, getRoom, resetRoom, roomName } from "../services/auction.service";

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
  io.to(roomName(auctionId)).emit("auction_state", room.state);
  io.to(roomName(auctionId)).emit("auction_reset");
  res.json({ success: true, auction: room.state });
}
