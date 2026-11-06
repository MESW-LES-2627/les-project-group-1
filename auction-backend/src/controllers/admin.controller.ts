import type { Request, Response } from "express";
import * as User from "../models/user.model";
import type { Role } from "../models/user.model";

const ROLES: Role[] = ["ADMIN", "CLUB", "BUYER"];
const CREATABLE_ROLES: Role[] = ["ADMIN", "CLUB"]; // buyers register themselves

const isRole = (v: unknown): v is Role => typeof v === "string" && ROLES.includes(v as Role);
// Prisma error codes: P2002 = unique constraint, P2025 = record not found
const hasCode = (e: unknown, code: string) => typeof e === "object" && e !== null && (e as any).code === code;

function parseId(req: Request) {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

/** GET /api/admin/users?role=&search=&page=&limit= */
export async function listUsers(req: Request, res: Response) {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const search = String(req.query.search ?? "").trim() || undefined;

        let role: Role | undefined;
        if (req.query.role !== undefined) {
            if (!isRole(req.query.role)) return res.status(400).json({ error: "Invalid role." });
            role = req.query.role;
        }

        const { items, total } = await User.listUsers({ role, search, skip: (page - 1) * limit, take: limit });
        return res.json({ items, page, limit, total });
    } catch (error) {
        console.error("List users error:", (error as Error).message);
        return res.status(500).json({ error: "Internal server error." });
    }
}

/** GET /api/admin/users/:id */
export async function getUser(req: Request, res: Response) {
    try {
        const id = parseId(req);
        if (!id) return res.status(400).json({ error: "Invalid id." });

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: "User not found." });
        return res.json(user);
    } catch (error) {
        console.error("Get user error:", (error as Error).message);
        return res.status(500).json({ error: "Internal server error." });
    }
}

/** POST /api/admin/users: create a user with the ADMIN or CLUB role. */
export async function createUser(req: Request, res: Response) {
    try {
        const { username, email, password, country, role } = req.body;

        if (!username || !email || !password || !country || !role)
            return res.status(400).json({ error: "Username, email, password, country and role are required." });
        if (!CREATABLE_ROLES.includes(role))
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

/** PATCH /api/admin/users/:id: send only the fields you want to change. */
export async function updateUser(req: Request, res: Response) {
    try {
        const id = parseId(req);
        if (!id) return res.status(400).json({ error: "Invalid id." });

        const { username, email, country, role, password } = req.body;
        const data: Parameters<typeof User.updateUser>[1] = {};

        if (username !== undefined) {
            if (typeof username !== "string" || !username.trim())
                return res.status(400).json({ error: "Invalid username." });
            data.username = username.trim();
        }
        if (email !== undefined) {
            if (typeof email !== "string" || !email.includes("@"))
                return res.status(400).json({ error: "Invalid email." });
            data.email = email.trim();
        }
        if (country !== undefined) {
            if (typeof country !== "string" || !country.trim())
                return res.status(400).json({ error: "Invalid country." });
            data.country = country.trim();
        }
        if (role !== undefined) {
            if (!isRole(role)) return res.status(400).json({ error: "Invalid role." });
            // Stops an admin from locking themselves (and possibly everyone) out.
            if (id === req.user!.id && role !== req.user!.role)
                return res.status(400).json({ error: "You cannot change your own role." });
            data.role = role;
        }
        if (password !== undefined) {
            if (typeof password !== "string" || password.length < 8)
                return res.status(400).json({ error: "Password must be at least 8 characters long." });
            data.passwordHash = await Bun.password.hash(password, { algorithm: "argon2id" });
        }

        if (Object.keys(data).length === 0)
            return res.status(400).json({ error: "Nothing to update." });

        const user = await User.updateUser(id, data);
        return res.json({ message: "User updated successfully.", user });
    } catch (error) {
        if (hasCode(error, "P2025")) return res.status(404).json({ error: "User not found." });
        if (hasCode(error, "P2002")) return res.status(409).json({ error: "Username or email already in use." });
        console.error("Update user error:", (error as Error).message);
        return res.status(500).json({ error: "Internal server error." });
    }
}

/** DELETE /api/admin/users/:id */
export async function deleteUser(req: Request, res: Response) {
    try {
        const id = parseId(req);
        if (!id) return res.status(400).json({ error: "Invalid id." });
        if (id === req.user!.id) return res.status(400).json({ error: "You cannot delete your own account." });

        await User.deleteUser(id);
        return res.json({ message: "User deleted successfully." });
    } catch (error) {
        if (hasCode(error, "P2025")) return res.status(404).json({ error: "User not found." });
        console.error("Delete user error:", (error as Error).message);
        return res.status(500).json({ error: "Internal server error." });
    }
}