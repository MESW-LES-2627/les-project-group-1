import jwt from "jsonwebtoken";
import { env } from "../config/env";

function secret() {
    if (!env.jwtSecret) throw new Error("JWT_SECRET is not set");
    return env.jwtSecret;
}

export interface TokenPayload {
    userId: number;
    role?: string;
    clubId?: number | null;
}

export function signToken(data: number | TokenPayload) {
    const payload = typeof data === "number" ? { sub: String(data) } : { sub: String(data.userId), role: data.role, clubId: data.clubId };
    return jwt.sign(payload, secret(), { expiresIn: "1d", algorithm: "HS256" });
}

/** Returns the user id from a valid token, or null. */
export function verifyToken(token: string): number | null {
    const key = secret();
    try {
        const payload = jwt.verify(token, key, { algorithms: ["HS256"] });
        const id = Number(typeof payload === "object" && payload !== null ? payload.sub : NaN);
        return Number.isInteger(id) ? id : null;
    } catch {
        return null;
    }
}