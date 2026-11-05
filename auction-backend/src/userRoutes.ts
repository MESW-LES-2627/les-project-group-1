import { Router } from "express";
import type { Request, Response } from "express";
import { sql } from "./db";
import { requireAuth } from "./session";
import { validateProfileInput } from "./profile-validation";

export const userRouter = Router();

userRouter.get("/me", requireAuth, async (_req: Request, res: Response) => {
    try {
        const rows = await sql`
            SELECT username, email, country FROM users WHERE id = ${res.locals.userId}
        `;
        if (rows.length === 0) return res.status(404).json({ error: "not_found" });
        return res.status(200).json({ user: rows[0] });
    } catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

userRouter.put("/me", requireAuth, async (req: Request, res: Response) => {
    try {
        const result = validateProfileInput(req.body);
        if (!result.ok) return res.status(400).json({ error: result.error });

        const userId = res.locals.userId;
        const { username, country } = result.value;

        const taken = await sql`
            SELECT 1 FROM users WHERE username = ${username} AND id <> ${userId}
        `;
        if (taken.length > 0) return res.status(409).json({ error: "username_taken" });

        const rows = await sql`
            UPDATE users SET username = ${username}, country = ${country}
            WHERE id = ${userId}
            RETURNING username, email, country
        `;
        if (rows.length === 0) return res.status(404).json({ error: "not_found" });
        return res.status(200).json({ user: rows[0] });
    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});