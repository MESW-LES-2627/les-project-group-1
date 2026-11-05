import type { NextFunction, Request, Response } from "express";
import { findUserIdByToken } from "../models/session.model";

export function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = readToken(req);
    if (!token) return res.status(401).json({ error: "Authentication required." });

    const userId = await findUserIdByToken(token);
    if (userId === null) return res.status(401).json({ error: "Invalid or expired session." });

    res.locals.userId = userId;
    next();
  } catch (error) {
    console.error("Auth middleware error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}