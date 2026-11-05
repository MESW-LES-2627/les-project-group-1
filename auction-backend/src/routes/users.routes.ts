import { Router } from "express";
import * as users from "../controllers/users.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/me", users.getMe);
router.put("/me", users.updateMe);
router.get("/me/purchases", users.getMyPurchases);
router.put("/me/avatar", users.setMyAvatar);
router.delete("/me/avatar", users.removeMyAvatar);

export default router;