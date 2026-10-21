import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createPaymentLink, stripeWebhook } from './src/payments';
import { sendEmail } from './src/email';
import { saveWinner } from './src/winners';

/**
 * Main auction server
 * 
 * Manages live bids via Socket.IO, closes the auction when the timer expires, generates Stripe payment links for the winners and send emails.
 */

const app = express();
app.use(cors());

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});






// ---------- Auction state ----------

// Simple in-memory state for the prototype
const AUCTION_DURATION = 120_000; // 120 seconds
let auction = {
    itemName: "Velocity",
    currentBid: 50,
    highestBidder: null as string | null,
    endTime: Date.now() + AUCTION_DURATION,
    isActive: true,
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
    };
    highestBidderEmail = null;

    io.emit("auction_state", auction);
    io.emit("auction_reset");
    res.json({ success: true, auction });
});



io.on("connection", (socket) => {
    console.log(`New user connected: ${socket.id}`);
    const email = socket.handshake.auth.email;
    socket.data.email =
        typeof email === "string" && email.includes("@") ? email.trim() : "";

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
            auction.currentBid = bidAmount;
            auction.highestBidder = socket.id;
            highestBidderEmail = socket.data.email;

            // Broadcast the updated state to all connected clients
            io.emit("auction_state", auction);
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Timer to end the auction
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

const PORT = Number(process.env.PORT ?? 3000);
httpServer.listen(PORT, () => {
    console.log(`Bid server running on http://localhost:${PORT}`);
});
