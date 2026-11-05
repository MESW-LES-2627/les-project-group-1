import { Router } from "express";
import * as auth from "../controllers/auth.controller";

const router = Router();

router.post("/register", auth.registerUser);
router.post("/login", auth.loginUser);
router.post("/logout", auth.logoutUser);
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);

export default router;
