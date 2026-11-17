import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import * as clubController from "../controllers/auth.controller";

const router = Router();

router.use(requireAuth, requireRole("CLUB", "ADMIN"));

//Default test
router.get("/test", (req, res) => {
    return res.status(200).json({ 
        message: "Acesso autorizado com sucesso!", 
        user: req.user 
    });
});

export default router;