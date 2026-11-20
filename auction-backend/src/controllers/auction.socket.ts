import type { Server } from "socket.io";
import { DEMO_ID, discardBid, evaluateAndPlaceBid, getRoom, persistBid, roomName, withAuctionLock } from "../services/auction.service";
import { verifyToken } from "../services/token.service";
import { prisma } from "../config/prisma";

/** Socket.IO event handlers for live bidding (one room per auction). */
export function registerAuctionSocket(io: Server) {
  io.on("connection", async (socket) => {
    console.log(`New user connected: ${socket.id}`);

    const token = socket.handshake.auth.token;
    const email = socket.handshake.auth.email;
    const clientUsername = socket.handshake.auth.username;

    socket.data.isAuthenticated = false;
    socket.data.email = "";
    socket.data.username = "";
    socket.data.country = "";
    socket.data.role = "";

    // 1. Prefer JWT token authentication when provided
    if (typeof token === "string" && token) {
      const userId = verifyToken(token);
      if (userId) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, email: true, country: true, role: true },
          });
          if (user) {
            socket.data.isAuthenticated = true;
            socket.data.email = user.email;
            socket.data.username = user.username;
            socket.data.country = user.country || "";
            socket.data.role = user.role;
          }
        } catch (err) {
          console.error("Could not verify socket user:", err);
        }
      }
    }

    // 2. Fallback to email lookup for existing socket clients
    if (!socket.data.isAuthenticated && typeof email === "string" && email.includes("@")) {
      const trimmedEmail = email.trim();
      socket.data.isAuthenticated = true;
      socket.data.email = trimmedEmail;
      socket.data.username =
        typeof clientUsername === "string" && clientUsername.trim() ? clientUsername.trim() : "";
      socket.data.role = "BUYER";

      try {
        const profile = await prisma.user.findUnique({
          where: { email: trimmedEmail },
          select: { username: true, country: true, role: true },
        });
        if (profile) {
          socket.data.username =
            typeof clientUsername === "string" && clientUsername.trim()
              ? clientUsername.trim()
              : profile.username;
          socket.data.country = profile.country || "";
          socket.data.role = profile.role;
        }
      } catch (err) {
        console.error("Could not fetch user info for socket:", err);
      }
    }
    const requestedId = socket.handshake.auth.auctionId;
    const auctionId = typeof requestedId === "string" && requestedId ? requestedId : DEMO_ID;

    // 3. Sprint 0 prototype room ("demo") allows unauthenticated test sockets
    if (!socket.data.isAuthenticated && auctionId === DEMO_ID) {
      socket.data.isAuthenticated = true;
      socket.data.email = `${socket.id}@demo.local`;
      socket.data.username =
        typeof clientUsername === "string" && clientUsername.trim() ? clientUsername.trim() : "";
      socket.data.role = "BUYER";
    }

    const room = await getRoom(auctionId);
    if (!room) return;

    socket.join(roomName(auctionId));
    // Personal room, so the winner can receive their payment link by username
    if (socket.data.username) socket.join(socket.data.username);

    socket.emit("auction_state", room.state);

    // Clients can ask for the state again
    socket.on("get_auction_state", () => {
      socket.emit("auction_state", room.state);
      // Late users after the auction ended should see the result too
      if (!room.state.isActive) {
        socket.emit("auction_end", {
          winner: room.state.highestBidder,
          winningBid: room.state.currentBid,
        });
      }
    });

    socket.on("place_bid", async (bidAmount: number) => {
      if (!socket.data.isAuthenticated || !socket.data.email) {
        socket.emit("bid_error", "Authentication required to place a bid.");
        return;
      }

      if (socket.data.role !== "BUYER") {
        socket.emit("bid_error", "Only buyers can place bids.");
        return;
      }

      await withAuctionLock(auctionId, async () => {
        const result = evaluateAndPlaceBid(room, bidAmount, {
          name: socket.data.username || socket.id,
          email: socket.data.email,
          country: socket.data.country || undefined,
        });

        if (!result.ok) {
          socket.emit("bid_error", result.error);
          return;
        }

        if (auctionId === DEMO_ID) {
          io.to(roomName(auctionId)).emit("auction_state", room.state);
          return;
        }

        try {
          await persistBid(auctionId, result.bid);
          io.to(roomName(auctionId)).emit("auction_state", room.state);
        } catch (err) {
          discardBid(room, result.bid);
          socket.emit("bid_error", "Could not persist bid.");
          console.error("Could not persist bid:", err);
        }
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}