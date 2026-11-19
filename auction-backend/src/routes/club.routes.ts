import express, { Router } from "express";
import multer from "multer";
import { requireAuth, requireApprovedClub, requireRole } from "../middlewares/auth";
import * as club from "../controllers/club.controller";
import * as listings from "../controllers/listings.controller";

const router = Router();

// The logo body is the raw image file. Auth runs first, so nothing is read from anonymous requests.
const rawImage = express.raw({ type: ["image/png", "image/jpeg", "image/webp"], limit: "2mb" });
// Listing images come in the same request as the listing fields (multipart/form-data), kept in memory until saved.
const listingUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024, files: 20 }, // 2 MB per image
}).fields([
    { name: "images", maxCount: 10 },
    { name: "evidenceImages", maxCount: 10 },
]);
const clubOwner = [requireAuth, requireRole("CLUB", "ADMIN")];

// Club owner area (mounted at /api/clubs)
router.get("/me", ...clubOwner, club.getMyClub);
router.put("/me", ...clubOwner, club.updateMyClub);
router.put("/me/logo", ...clubOwner, rawImage, club.uploadMyLogo);
router.delete("/me/logo", ...clubOwner, club.removeMyLogo);

// A club's own listings. Only CLUB users whose club is approved; every query is scoped to that club.
const clubListingsAuth = [requireAuth, requireRole("CLUB"), requireApprovedClub];
router.get("/me/listings", ...clubListingsAuth, club.listMyListings);
router.post("/me/listings", ...clubListingsAuth, listingUpload, club.createMyListing);
router.get("/me/listings/:id", ...clubListingsAuth, club.getMyListing);
router.patch("/me/listings/:id", ...clubListingsAuth, listingUpload, club.updateMyListing);
router.delete("/me/listings/:id", ...clubListingsAuth, club.deleteMyListing);

// Public: GET /api/clubs/:slug (club + verified listings only)
router.get("/profile/:slug", listings.getClub);

export default router;