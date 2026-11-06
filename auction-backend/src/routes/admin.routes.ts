import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import * as admin from "../controllers/admin.controller";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/users", admin.listUsers);
router.post("/users", admin.createUser);
router.get("/users/:id", admin.getUser);
router.patch("/users/:id", admin.updateUser);
router.delete("/users/:id", admin.deleteUser);

export default router;