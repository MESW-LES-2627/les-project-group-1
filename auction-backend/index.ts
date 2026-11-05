import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createPaymentLink, stripeWebhook } from './src/payments';
import { sendEmail } from './src/email';
import { saveWinner } from './src/winners';
import * as auth from './src/auth';
import { sql } from './src/db';
import { 
    getListings,
    getListing,
    getCategories,
    getClub,
    getListingAuction,
    setLiveAuctionLookup,
} from './src/listings';

/**
 * Main auction server
 * 
 * Manages live bids via Socket.IO (one room per auction), closes each auction when its timer expires, generates Stripe payment links for the winners and send emails.
 * Also serves the catalogue API.
 */

const app = express();
app.use(cors());
app.use(express.json())

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

export const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.post("/api/auth/register", auth.registerUser);
app.post("/api/auth/login", auth.loginUser);
app.post('/api/auth/logout', (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully.' });
}); // Simple logout endpoint; 
app.post("/api/auth/forgot-password", auth.forgotPassword);
app.post("/api/auth/reset-password", auth.resetPassword);





// ---------- Auction state ----------

// Simple in-memory state for the prototype
const AUCTION_DURATION = 120_000; // 120 seconds
const DEMO_ID = "demo"; // CATALOGUE

interface AuctionState {
    itemName: string;
    currentBid: number;
    highestBidder: string | null;
    endTime: number;
    isActive: boolean;
    bidCount: number;
    bids: Array<{ bidder: string; country?: string; amount: number; timestamp: number }>;
}

interface AuctionRoom {
    startingPrice: number;
    state: AuctionState;
    highestBidderEmail: string | null;
}

const rooms = new Map<string, AuctionRoom>();

const roomName = (auctionId: string) => `auction:${auctionId}`;

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

// Gets the room of an auction. Catalogue auctions are created from the database the first time they are opened.
async function getRoom(auctionId: string): Promise<AuctionRoom | null> {
    const existing = rooms.get(auctionId);
    if (existing) return existing;

    try {
        const listing = await getListingAuction(Number(auctionId));
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

// Gives the catalogue the live values (current bid and end time) so the cards match the auction page
setLiveAuctionLookup((listingId) => {
    const room = rooms.get(String(listingId));
    return room ? { currentBid: room.state.currentBid, endTime: room.state.endTime } : undefined;
});

// Reset endpoint for sprint 0 demo, allows resetting an auction without having to redeploy or restart.
// Use ?auctionId=<id> to reset a catalogue auction, no parameter resets the prototype auction.
app.post("/api/auction/reset", async (req, res) => {
    const auctionId = typeof req.query.auctionId === "string" ? req.query.auctionId : DEMO_ID;
    const room = await getRoom(auctionId);
    if (!room) return res.status(404).json({ error: "auction not found" });

    room.state = createRoom(room.state.itemName, room.startingPrice, Date.now() + AUCTION_DURATION).state;
    room.highestBidderEmail = null;

    io.to(roomName(auctionId)).emit("auction_state", room.state);
    io.to(roomName(auctionId)).emit("auction_reset");
    res.json({ success: true, auction: room.state });
});


app.get("/api/categories", getCategories);
app.get("/api/listings", getListings);
app.get("/api/listings/:id", getListing);
app.get("/api/clubs/:slug", getClub);



io.on("connection", async (socket) => {
    console.log(`New user connected: ${socket.id}`);
    
    const email = socket.handshake.auth.email;
    const clientUsername = socket.handshake.auth.username; 
    socket.data.email = typeof email === "string" && email.includes("@") ? email.trim() : ""; 
    socket.data.username = typeof clientUsername === "string" ? clientUsername.trim() : "";
    socket.data.country = "";

    // If the user is logged in (email is provided), fetch their username and country from the database
    if (socket.data.email) {
        try {
            const userRecord = await sql`select username, country from users where lower(email) = lower(${socket.data.email})`;
            if (userRecord.length > 0) {
                // If the username is not provided by the client, use the one from the database
                if (!socket.data.username) {
                    socket.data.username = userRecord[0].username;
                }
                // If the country is not provided by the client, use the one from the database
                socket.data.country = userRecord[0].country || "";
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
    if (socket.data.username) {
        socket.join(socket.data.username);
    }

    // Send current state to the newly connected user
    socket.emit("auction_state", room.state);

    // Clients can ask for the state again
    socket.on("get_auction_state", () => {
        socket.emit("auction_state", room.state);

        // Late joiners after the auction ended should see the result too
        if (!room.state.isActive) {
            socket.emit("auction_end", {
                winner: room.state.highestBidder,
                winningBid: room.state.currentBid,
            });
        }
    });

    socket.on("place_bid", (bidAmount: number) => {
        const auction = room.state;
        if (!auction.isActive || Date.now() >= auction.endTime) return;
        if (typeof bidAmount !== "number" || !Number.isFinite(bidAmount)) return;

        // Only accept higher bids
        if (bidAmount > auction.currentBid) {
            const bidderName = socket.data.username || socket.id;
            const bidderCountry = socket.data.country;
            auction.currentBid = bidAmount;
            auction.highestBidder = bidderName;
            room.highestBidderEmail = socket.data.email;

            auction.bidCount = (auction.bidCount || 0) + 1;
            if (!auction.bids) auction.bids = [];
            auction.bids.unshift({
                bidder: bidderName,
                country: bidderCountry,
                amount: bidAmount,
                timestamp: Date.now(),
            });

            // Broadcast the updated state to everyone watching this auction
            io.to(roomName(auctionId)).emit("auction_state", auction);
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

function endAuction(auctionId: string, room: AuctionRoom) {
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
                    await saveWinner({
                        itemName,
                        socketId: winnerId,
                        email,
                        winningBid,
                        endedAt,
                        stripeSessionId: link.id,
                    });
                } catch (err) {
                    console.error('Could not save winner:', err);
                }
                console.log('Payment link:', link.url);
                io.to(winnerId).emit('payment_link', link.url);

                if (email) {
                    await sendEmail(
                        email,
                        `You won the auction: ${itemName}`,
                        `<p>Congratulations! Your winning bid was ${winningBid} €.</p>
                        <p><a href="${link.url}">Pay now</a></p>`,
                    ).catch((err) => console.error('Could not send email:', err));
                } else {
                    console.warn('Winner email unavailable; skipping auction email.');
                }
            })
            .catch((err) => console.error('Could not create payment link:', err));
    } else {
        console.log(`Auction ${auctionId} ended with no bids.`);
    }

    // Announce the winner to everyone watching this auction
    io.to(roomName(auctionId)).emit("auction_end", {
        winner: auction.highestBidder,
        winningBid: auction.currentBid
    });
}

function startAuctionTimer() {
    setInterval(() => {
        for (const [auctionId, room] of rooms) {
            if (room.state.isActive && Date.now() >= room.state.endTime) {
                endAuction(auctionId, room);
            }
        }
    }, 1000);
}

if (import.meta.main) {
    startAuctionTimer();
    const PORT = Number(process.env.PORT ?? 3000);
    httpServer.listen(PORT, () => {
        console.log(`Bid server running on http://localhost:${PORT}`);
    });
}
