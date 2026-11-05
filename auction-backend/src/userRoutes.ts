import { Router } from "express";
import type { Request, Response } from "express";
import { sql } from "./db";
import { requireAuth } from "./session";
import { validateAvatar, validateProfileInput } from "./profile-validation";

export const userRouter = Router();

userRouter.get("/me", requireAuth, async (_req: Request, res: Response) => {
    try {
        const rows = await sql`
            SELECT username, email, country, avatar FROM users WHERE id = ${res.locals.userId}
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

userRouter.get("/me/purchases", requireAuth, async (_req: Request, res: Response) => {
    try {
        const rows = await sql`
            SELECT w.id, w.item_name, w.winning_bid, w.paid_at
            FROM winners w
            JOIN users u ON lower(u.email) = lower(w.email)
            WHERE u.id = ${res.locals.userId} AND w.status = 'paid'
            ORDER BY w.paid_at DESC
        `;
        const purchases = rows.map((row: any) => ({
            id: row.id,
            itemName: row.item_name,
            amount: Number(row.winning_bid),
            paidAt: row.paid_at,
        }));
        return res.status(200).json({ purchases });
    } catch (error) {
        console.error("Get purchases error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

userRouter.put("/me/avatar", requireAuth, async (req: Request, res: Response) => {
    try {
        const result = validateAvatar(req.body);
        if (!result.ok) return res.status(400).json({ error: result.error });

        await sql`UPDATE users SET avatar = ${result.value} WHERE id = ${res.locals.userId}`;
        return res.status(200).json({ avatar: result.value });
    } catch (error) {
        console.error("Update avatar error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

userRouter.delete("/me/avatar", requireAuth, async (_req: Request, res: Response) => {
    try {
        await sql`UPDATE users SET avatar = NULL WHERE id = ${res.locals.userId}`;
        return res.status(200).json({ avatar: null });
    } catch (error) {
        console.error("Remove avatar error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});