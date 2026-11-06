import jwt from "jsonwebtoken";
import { env } from "../config/env";

function secret() {
    if (!env.jwtSecret) throw new Error("JWT_SECRET is not set");
    return env.jwtSecret;
}

export function signToken(userId: number) {
    return jwt.sign({ sub: String(userId) }, secret(), { expiresIn: "1d", algorithm: "HS256" });
}

/** Returns the user id from a valid token, or null. */
export function verifyToken(token: string): number | null {
    const key = secret();
    try {
        const payload = jwt.verify(token, key, { algorithms: ["HS256"] });
        const id = Number(typeof payload === "object" ? payload.sub : NaN);
        return Number.isInteger(id) ? id : null;
    } catch {
        return null;
    }
}