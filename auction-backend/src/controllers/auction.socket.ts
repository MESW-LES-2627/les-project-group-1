import type { Server } from "socket.io";
import { DEMO_ID, getRoom, placeBid, roomName } from "../services/auction.service";
import { findProfileByEmail } from "../models/user.model";

/** Socket.IO event handlers for live bidding (one room per auction). */
export function registerAuctionSocket(io: Server) {
  io.on("connection", async (socket) => {
    console.log(`New user connected: ${socket.id}`);

    const email = socket.handshake.auth.email;
    const clientUsername = socket.handshake.auth.username;
    socket.data.email = typeof email === "string" && email.includes("@") ? email.trim() : "";
    socket.data.username = typeof clientUsername === "string" ? clientUsername.trim() : "";
    socket.data.country = "";

    // Logged-in users: fill username/country from the database if missing
    if (socket.data.email) {
      try {
        const profile = await findProfileByEmail(socket.data.email);
        if (profile) {
          if (!socket.data.username) socket.data.username = profile.username;
          socket.data.country = profile.country || "";
        }
      } catch (err) {
        console.error("Could not fetch user info for socket:", err);
      }
    }

    const requestedId = socket.handshake.auth.auctionId;
    const auctionId = typeof requestedId === "string" && requestedId ? requestedId : DEMO_ID;
    const room = await getRoom(auctionId);
    if (!room) return;

    socket.join(roomName(auctionId));
    // Personal room, so the winner can receive their payment link by username
    if (socket.data.username) socket.join(socket.data.username);

    socket.emit("auction_state", room.state);

    // Clients can ask for the state again
    socket.on("get_auction_state", () => {
      socket.emit("auction_state", room.state);
      // Late joiners after the auction ended should see the result too
      if (!room.state.isActive) {
        socket.emit("auction_end", { winner: room.state.highestBidder, winningBid: room.state.currentBid });
      }
    });

    socket.on("place_bid", (bidAmount: number) => {
      const accepted = placeBid(room, bidAmount, {
        name: socket.data.username || socket.id,
        email: socket.data.email,
        country: socket.data.country,
      });
      if (accepted) io.to(roomName(auctionId)).emit("auction_state", room.state);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
