import type { Request, Response } from "express";
import * as User from "../models/user.model";

const ASSIGNABLE_ROLES = ["ADMIN", "CLUB"];

/** Admin-only: create a user with the ADMIN or CLUB role. */
export async function createUser(req: Request, res: Response) {
    try {
        const { username, email, password, country, role } = req.body;

        if (!username || !email || !password || !country || !role)
            return res.status(400).json({ error: "Username, email, password, country and role are required." });
        if (!ASSIGNABLE_ROLES.includes(role))
            return res.status(400).json({ error: "Role must be ADMIN or CLUB." });
        if (password.length < 8)
            return res.status(400).json({ error: "Password must be at least 8 characters long." });
        if (await User.emailExists(email)) return res.status(400).json({ error: "User already exists." });

        const hashedPassword = await Bun.password.hash(password, { algorithm: "argon2id" });
        const user = await User.createUser(username, email, hashedPassword, country, role);

        return res.status(201).json({
            message: "User created successfully.",
            user: { username: user.username, email: user.email, country: user.country, role: user.role },
        });
    } catch (error) {
        console.error("Admin create user error:", (error as Error).message);
        return res.status(500).json({ error: "Internal server error." });
    }
}