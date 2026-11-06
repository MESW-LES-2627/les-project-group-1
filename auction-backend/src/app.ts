import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { env } from "./config/env";
import routes from "./routes";
import paymentsRoutes from "./routes/payments.routes";
import { registerAuctionSocket } from "./controllers/auction.socket";
import { errorHandler, notFound } from "./middlewares/errorHandler";

/** Express app + Socket.IO setup. Doesn't listen, so tests can import it safely. */
export const app = express();
app.use(cors());

// Must be BEFORE express.json(): Stripe signature checks need the raw body.
app.use("/api/stripe", paymentsRoutes);

app.use(express.json());
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: env.frontendUrl, methods: ["GET", "POST"] },
});
app.set("io", io); // lets controllers reach socket.io via req.app.get("io")

registerAuctionSocket(io);
