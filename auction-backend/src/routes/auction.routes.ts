import { Router } from "express";
import { reset } from "../controllers/auction.controller";

const router = Router();

router.post("/reset", reset);

export default router;
