import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createPaymentLink, stripeWebhook } from './src/payments';
import { sendEmail } from './src/email';
import { saveWinner } from './src/winners';
import { registerUser } from './src/auth';
import { loginUser } from './src/auth';
import { sql } from './src/db';

/**
 * Main auction server
 * 
 * Manages live bids via Socket.IO, closes the auction when the timer expires, generates Stripe payment links for the winners and send emails.
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

app.post("/api/auth/register", registerUser);
app.post("/api/auth/login", loginUser);





// ---------- Auction state ----------

// Simple in-memory state for the prototype
const AUCTION_DURATION = 120_000; // 120 seconds
let auction = {
    itemName: "Velocity",
    currentBid: 50,
    highestBidder: null as string | null,
    endTime: Date.now() + AUCTION_DURATION,
    isActive: true,
    bidCount: 0,
    bids: [] as Array<{ bidder: string; amount: number; timestamp: number }>,
};
let highestBidderEmail: string | null = null;

// Reset endpoint for sprint 0 demo, allows resetting the auction without having to redeploy or restart
app.post("/api/auction/reset", (_req, res) => {
    auction = {
        itemName: "Velocity",
        currentBid: 50,
        highestBidder: null,
        endTime: Date.now() + AUCTION_DURATION,
        isActive: true,
        bidCount: 0,
        bids: [],
    };
    highestBidderEmail = null;

    io.emit("auction_state", auction);
    io.emit("auction_reset");
    res.json({ success: true, auction });
});



io.on("connection", async (socket) => {
    console.log(`New user connected: ${socket.id}`);
    
    const email = socket.handshake.auth.email;
    const clientUsername = socket.handshake.auth.username; // usarnamw provided by the fronted
    socket.data.email = typeof email === "string" && email.includes("@") ? email.trim() : ""; // Validate email format

    // If the username is not provided, try to fetch it from the database using the email
    socket.data.username = typeof clientUsername === "string" ? clientUsername.trim() : "";
    if (!socket.data.username && socket.data.email) {
        try {
            const userRecord = await sql`select username from users where lower(email) = lower(${socket.data.email})`;
            if (userRecord.length > 0) {
                socket.data.username = userRecord[0].username;
            }
        } catch (err) {
            console.error("Could not fetch username for socket:", err);
        }
    }

    // Send current state to the newly connected user
    socket.emit("auction_state", auction);

    // Clients can ask for the state again (e.g. after their listeners are ready)
    socket.on("get_auction_state", () => {
        socket.emit("auction_state", auction);

        // Late joiners after the auction ended should see the result too
        if (!auction.isActive) {
            socket.emit("auction_end", {
                winner: auction.highestBidder,
                winningBid: auction.currentBid,
            });
        }
    });

    socket.on("place_bid", (bidAmount: number) => {
        if (!auction.isActive || Date.now() >= auction.endTime) return;
        if (typeof bidAmount !== "number" || !Number.isFinite(bidAmount)) return;

        // Only accept higher bids
        if (bidAmount > auction.currentBid) {
            const bidderName = socket.data.username || socket.id;
            auction.currentBid = bidAmount;
            auction.highestBidder = bidderName;
            highestBidderEmail = socket.data.email;

            auction.bidCount = (auction.bidCount || 0) + 1;
            if (!auction.bids) auction.bids = [];
            auction.bids.unshift({
                bidder: bidderName,
                amount: bidAmount,
                timestamp: Date.now(),
            });

            // Broadcast the updated state to all connected clients
            io.emit("auction_state", auction);
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

function startAuctionTimer() {
    setInterval(() => {
        if (auction.isActive && Date.now() >= auction.endTime) {
            auction.isActive = false;

            if (auction.highestBidder) {
                const winnerId = auction.highestBidder;
                const email = highestBidderEmail ?? undefined;
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
                console.log('Auction ended with no bids.');
            }

            // Announce the winner to all clients
            io.emit("auction_end", {
                winner: auction.highestBidder,
                winningBid: auction.currentBid
            });
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
