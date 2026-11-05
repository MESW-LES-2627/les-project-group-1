import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/token.service";
import * as User from "../models/user.model";
import type { Role } from "../models/user.model";

declare global {
    namespace Express {
        interface Request {
            user?: { id: number; role: Role };
        }
    }
}

/** Requires a valid "Authorization: Bearer <token>" header. Sets req.user. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const userId = token ? verifyToken(token) : null;
    if (!userId) return res.status(401).json({ error: "Authentication required." });

    // Read the role from the database on every request, so promotions and demotions apply immediately.
    const user = await User.findAuthById(userId);
    if (!user) return res.status(401).json({ error: "Authentication required." });

    req.user = { id: user.id, role: user.role };
    next();
}

/** Use after requireAuth: allows only the listed roles. */
export function requireRole(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: "Authentication required." });
        if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden." });
        next();
    };
}