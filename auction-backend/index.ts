import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { promises as fs } from 'fs';
import { createPaymentLink, stripeWebhook } from './src/payments';
import { sendEmail } from './src/email';

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
        origin: "http://localhost:5173", // Default Vite React port
        methods: ["GET", "POST"]
    }
});

// ---------- Winner record ----------

interface WinnerRecord {
    itemName: string;
    winner: string;      // socket id of the winning bidder (anonymous for now)
    winningBid: number;
    endedAt: string;     // ISO timestamp
    email?: string;
    status?: string;
    stripeSessionId?: string;
    paidAt?: string;
}

const WINNERS_FILE = 'winners.json';

// Appends the record to winners.json so it survives a server restart
async function saveWinnerRecord(record: WinnerRecord): Promise<void> {
    let records: WinnerRecord[] = [];
    try {
        records = JSON.parse(await fs.readFile(WINNERS_FILE, 'utf8'));
    } catch {
        // file doesn't exist yet (or is empty): start a new list
    }
    records.push(record);
    await fs.writeFile(WINNERS_FILE, JSON.stringify(records, null, 2));
}

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

// Filled in when the auction ends (stays null if nobody bid)
let winnerRecord: WinnerRecord | null = null;

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
const timer = setInterval(() => {
    if (auction.isActive && Date.now() >= auction.endTime) {
        auction.isActive = false;
        clearInterval(timer);

        if (auction.highestBidder) {
            const winnerId = auction.highestBidder;
            const email = highestBidderEmail ?? undefined;
            const record: WinnerRecord = {
                itemName: auction.itemName,
                winner: winnerId,
                winningBid: auction.currentBid,
                endedAt: new Date().toISOString(),
                email,
                status: 'pending_payment',
            };
            winnerRecord = record;

            createPaymentLink(record.itemName, record.winningBid, email)
                .then(async (link) => {
                record.stripeSessionId = link.id;
                await saveWinnerRecord(record);
                console.log('Payment link:', link.url);
                io.to(winnerId).emit('payment_link', link.url);

                if (email) {
                    await sendEmail(
                    email,
                    `You won the auction: ${record.itemName}`,
                    `<p>Congratulations! Your winning bid was ${record.winningBid} €.</p>
                    <p><a href="${link.url}">Pay now</a></p>`,
                    ).catch((err) => console.error('Could not send email:', err));
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

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Bid server running on http://localhost:${PORT}`);
});
