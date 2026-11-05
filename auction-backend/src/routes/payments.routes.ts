import express, { Router } from "express";
import { stripeWebhook } from "../controllers/payments.controller";

const router = Router();

// Stripe needs the raw body to verify the signature.
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

export default router;
