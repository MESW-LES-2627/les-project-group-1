import { Router } from "express";
import * as listings from "../controllers/listings.controller";

const router = Router();

router.get("/categories", listings.getCategories);
router.get("/listings", listings.getListings);
router.get("/listings/:id", listings.getListing);
router.get("/clubs/:slug", listings.getClub);

export default router;
