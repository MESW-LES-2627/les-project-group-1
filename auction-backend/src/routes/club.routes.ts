import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { findClubByUserId, findClubBySlug, updateClubProfile } from "../models/user.model";

const router = Router();

router.get("/me", requireAuth, requireRole("CLUB", "ADMIN"), async (req: any, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const club = await findClubByUserId(userId);
    
    if (!club) return res.status(404).json({ error: "Club profile not found for this user" });
    return res.json(club);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/me", requireAuth, requireRole("CLUB", "ADMIN"), async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { name, description, logoUrl } = req.body;
    
    const updatedClub = await updateClubProfile(userId, { name, description, logoUrl });
        return res.json({ 
      message: "Club profile updated successfully", 
      club: updatedClub 
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. ROTA PÚBLICA (Fica completamente livre de autenticação)
router.get("/profile/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug)
    const club = await findClubBySlug(slug);
    if (!club) return res.status(404).json({ error: "Club not found" });
    return res.json(club);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;