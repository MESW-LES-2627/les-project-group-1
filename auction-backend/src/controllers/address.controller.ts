import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import jwt from "jsonwebtoken";
import { env } from "../config/env"; 

//Get JWT token (userId)
function getUserIdFromReq(req: Request): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1] ?? "";
  try {
    const decoded: any = jwt.verify(token, env.jwtSecret!);
    return Number(decoded.userId || decoded.id || decoded.sub);
  } catch {
    return null;
  }
}

//List user address
export async function getAddresses(req: Request, res: Response) {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });

    res.json(addresses);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Could not fetch addresses" });
  }
}

//Create new address
export async function createAddress(req: Request, res: Response) {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { fullName, street, city, state, postalCode, country, isDefault } = req.body;

    if (!fullName || !street || !city || !postalCode || !country) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        fullName,
        street,
        city,
        state,
        postalCode,
        country,
        isDefault: Boolean(isDefault),
      },
    });

    res.status(201).json(newAddress);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Could not create address" });
  }
}

//Update address
export async function updateAddress(req: Request, res: Response) {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const { fullName, street, city, state, postalCode, country, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: Number(id), userId }, //User only edit its own adresses
      data: { fullName, street, city, state, postalCode, country, isDefault },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Could not update address" });
  }
}

//Delete address
export async function deleteAddress(req: Request, res: Response) {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    await prisma.address.delete({
      where: { id: Number(id), userId }, //User onlt delete its own addresses
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Could not delete address" });
  }
}