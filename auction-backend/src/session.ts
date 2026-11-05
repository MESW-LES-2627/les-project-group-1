import type { NextFunction, Request, Response } from "express";
import { randomBytes } from "crypto";
import { sql } from "./db";

export async function createSession(userId: number | string): Promise<string> {
    const token = randomBytes(32).toString("hex");
    await sql`
        INSERT INTO sessions (token, user_id, expires_at)
        VALUES (${token}, ${userId}, now() + interval '7 days')
    `;
    return token;
}

function readToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return null;
    const token = header.slice("Bearer ".length).trim();
    return token.length > 0 ? token : null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const token = readToken(req);
        if (!token) return res.status(401).json({ error: "Authentication required." });

        const rows = await sql`
            SELECT user_id FROM sessions
            WHERE token = ${token} AND expires_at > now()
        `;
        if (rows.length === 0) return res.status(401).json({ error: "Invalid or expired session." });

        res.locals.userId = rows[0].user_id;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}

export async function logoutUser(req: Request, res: Response) {
    try {
        const token = readToken(req);
        if (token) await sql`DELETE FROM sessions WHERE token = ${token}`;
        return res.status(200).json({ message: "Logged out successfully." });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}