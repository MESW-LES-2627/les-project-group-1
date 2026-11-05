import type { Request, Response } from "express";
import * as User from "../models/user.model";
import { findPaidByEmail } from "../models/winner.model";
import { validateAvatar, validateProfileInput } from "../utils/profileValidation";

export async function getMe(req: Request, res: Response) {
  try {
    const user = await User.findMe(req.user!.id);
    if (!user) return res.status(404).json({ error: "not_found" });
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export async function updateMe(req: Request, res: Response) {
  try {
    const result = validateProfileInput(req.body);
    if (!result.ok) return res.status(400).json({ error: result.error });

    const userId = req.user!.id;
    const { username, country, email } = result.value;

    if (await User.usernameTakenByOther(username, userId)) {
      return res.status(409).json({ error: "username_taken" });
    }

    if (email && (await User.emailTakenByOther(email, userId))) {
      return res.status(409).json({ error: "email_taken" });
    }

    const user = await User.updateProfile(userId, username, country, email);
    return res.status(200).json({ user });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      const target = (error as { meta?: { target?: unknown } }).meta?.target;
      const isEmail = Array.isArray(target) ? target.includes("email") : String(target ?? "").includes("email");
      return res.status(409).json({ error: isEmail ? "email_taken" : "username_taken" });
    }
    console.error("Update profile error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export async function getMyPurchases(req: Request, res: Response) {
  try {
    const user = await User.findMe(req.user!.id);
    if (!user) return res.status(404).json({ error: "not_found" });

    const winners = await findPaidByEmail(user.email);
    const purchases = winners.map((winner) => ({
      id: winner.id,
      itemName: winner.itemName,
      amount: winner.winningBid.toNumber(),
      paidAt: winner.paidAt,
    }));
    return res.status(200).json({ purchases });
  } catch (error) {
    console.error("Get purchases error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export async function setMyAvatar(req: Request, res: Response) {
  try {
    const result = validateAvatar(req.body);
    if (!result.ok) return res.status(400).json({ error: result.error });

    await User.setAvatar(req.user!.id, result.value);
    return res.status(200).json({ avatar: result.value });
  } catch (error) {
    console.error("Update avatar error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export async function removeMyAvatar(req: Request, res: Response) {
  try {
    await User.setAvatar(req.user!.id, null);
    return res.status(200).json({ avatar: null });
  } catch (error) {
    console.error("Remove avatar error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}