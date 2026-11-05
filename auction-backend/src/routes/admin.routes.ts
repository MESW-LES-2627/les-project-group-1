import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { createUser } from "../controllers/admin.controller";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));
router.post("/users", createUser);

export default router;