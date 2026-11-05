import type { Request, Response } from "express";
import crypto from "crypto";
import { env } from "../config/env";
import { sendEmail } from "../services/email.service";
import * as User from "../models/user.model";

/** Registration, login and password recovery. */

export async function registerUser(req: Request, res: Response) {
  try {
    const { username, email, password, country } = req.body;

    if (!username || !email || !password || !country)
      return res.status(400).json({ error: "Username, email, password and country are required." });
    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters long." });

    if (await User.emailExists(email)) return res.status(400).json({ error: "User already exists." });

    const hashedPassword = await Bun.password.hash(password, { algorithm: "argon2id" });
    const newUser = await User.createUser(username, email, hashedPassword, country);

    return res.status(201).json({
      message: "User registered successfully.",
      user: {
        username: newUser.username,
        email: newUser.email,
        created_at: newUser.created_at,
        country: newUser.country,
      },
    });
  } catch (error) {
    console.error("Registration error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const user = await User.findForLogin(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const isPasswordValid = await Bun.password.verify(password, user.password_hash);
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials." });

    return res.status(200).json({
      message: "Login successful.",
      user: { id: user.id, username: user.username, email: user.email, country: user.country },
    });
  } catch (error) {
    console.error("Login error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Stateless logout: the client just discards its session data.
export function logoutUser(_req: Request, res: Response) {
  return res.status(200).json({ message: "Logged out successfully." });
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const genericReply = { message: "If the email exists, a reset link has been sent." };

    const user = await User.findIdByEmail(email);
    if (!user) return res.status(200).json(genericReply);

    // Secure token valid for 15 minutes
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await User.setResetToken(email, resetToken, expiresAt);

    const resetLink = `${env.frontendUrl}/reset-password?token=${resetToken}`;
    try {
      await sendEmail(
        email,
        "Reset your password",
        `<p>Click the link below to set a new password:</p><a href="${resetLink}">Reset Password</a><p>This link expires in 15 minutes.</p>`,
      );
    } catch (emailError) {
      console.warn("Email send skipped/failed (Resend restriction):", (emailError as Error).message);
    }

    return res.status(200).json(genericReply);
  } catch (error) {
    console.error("Forgot password error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) return res.status(400).json({ error: "Token and new password are required." });
    if (newPassword.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters long." });

    const user = await User.findByValidResetToken(token);
    if (!user) return res.status(400).json({ error: "Invalid or expired reset token." });

    const passwordHash = await Bun.password.hash(newPassword, { algorithm: "argon2id" });
    await User.updatePassword(user.id, passwordHash);

    return res.status(200).json({ message: "Password has been successfully reset." });
  } catch (error) {
    console.error("Reset password error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}
