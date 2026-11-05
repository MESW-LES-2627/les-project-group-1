import { Router } from "express";
import authRoutes from "./auth.routes";
import auctionRoutes from "./auction.routes";
import listingsRoutes from "./listings.routes";

/** JSON routes, mounted under /api. (The Stripe webhook is mounted separately in app.ts.) */
const router = Router();

router.use("/auth", authRoutes);
router.use("/auction", auctionRoutes);
router.use("/", listingsRoutes); // /categories, /listings, /clubs

export default router;
