import { Router } from "express";
import { reset, submitBid } from "../controllers/auction.controller";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/reset", reset);
router.post("/:auctionId/bids", requireAuth, submitBid);

export default router;
