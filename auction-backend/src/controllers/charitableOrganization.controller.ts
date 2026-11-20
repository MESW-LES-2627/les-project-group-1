import type { Request, Response } from "express";
import * as CharitableOrganization from "../models/charitableOrganization.model";

// Prisma error codes: P2002 = unique constraint, P2025 = record not found
const hasCode = (e: unknown, code: string) =>
  typeof e === "object" && e !== null && (e as any).code === code;

function parseId(req: Request) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/admin/charitable-organizations?search=&page=&limit= 
export async function listCharitableOrganizations(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = String(req.query.search ?? "").trim() || undefined;

    const { items, total } = await CharitableOrganization.listCharitableOrganizations({
      search,
      skip: (page - 1) * limit,
      take: limit,
    });

    return res.json({ items, page, limit, total });
  } catch (error) {
    console.error("List charitable organizations error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

//GET /api/admin/charitable-organizations/:id 
export async function getCharitableOrganization(req: Request, res: Response) {
  try {
    const id = parseId(req);
    if (!id) return res.status(400).json({ error: "Invalid id." });

    const organization = await CharitableOrganization.findById(id);
    if (!organization) return res.status(404).json({ error: "Charitable organization not found." });

    return res.json(organization);
  } catch (error) {
    console.error("Get charitable organization error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// POST /api/admin/charitable-organizations
export async function createCharitableOrganization(req: Request, res: Response) {
  try {
    const { name, description, logoUrl, country, verified } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is required." });
    }
    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({ error: "Invalid description." });
    }
    if (logoUrl !== undefined && logoUrl !== null && typeof logoUrl !== "string") {
      return res.status(400).json({ error: "Invalid logoUrl." });
    }
    if (country !== undefined && typeof country !== "string") {
      return res.status(400).json({ error: "Invalid country." });
    }
    if (verified !== undefined && typeof verified !== "boolean") {
      return res.status(400).json({ error: "Invalid verified flag." });
    }

    const organization = await CharitableOrganization.createCharitableOrganization({
      name: name.trim(),
      description: description?.trim() ?? "",
      logoUrl: logoUrl ? logoUrl.trim() : null,
      country: country?.trim().toUpperCase() ?? "",
      verified: verified ?? false,
    });

    return res.status(201).json({
      message: "Charitable organization created successfully.",
      organization,
    });
  } catch (error) {
    if (hasCode(error, "P2002")) {
      return res.status(409).json({ error: "Charitable organization name already exists." });
    }
    console.error("Create charitable organization error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// PATCH /api/admin/charitable-organizations/:id 
export async function updateCharitableOrganization(req: Request, res: Response) {
  try {
    const id = parseId(req);
    if (!id) return res.status(400).json({ error: "Invalid id." });

    const { name, description, logoUrl, country, verified } = req.body;
    const data: Parameters<typeof CharitableOrganization.updateCharitableOrganization>[1] = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Invalid name." });
      }
      data.name = name.trim();
    }
    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({ error: "Invalid description." });
      }
      data.description = description.trim();
    }
    if (logoUrl !== undefined) {
      if (logoUrl !== null && typeof logoUrl !== "string") {
        return res.status(400).json({ error: "Invalid logoUrl." });
      }
      data.logoUrl = logoUrl ? logoUrl.trim() : null;
    }
    if (country !== undefined) {
      if (typeof country !== "string") {
        return res.status(400).json({ error: "Invalid country." });
      }
      data.country = country.trim().toUpperCase();
    }
    if (verified !== undefined) {
      if (typeof verified !== "boolean") {
        return res.status(400).json({ error: "Invalid verified flag." });
      }
      data.verified = verified;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "Nothing to update." });
    }

    const organization = await CharitableOrganization.updateCharitableOrganization(id, data);
    return res.json({
      message: "Charitable organization updated successfully.",
      organization,
    });
  } catch (error) {
    if (hasCode(error, "P2025")) {
      return res.status(404).json({ error: "Charitable organization not found." });
    }
    if (hasCode(error, "P2002")) {
      return res.status(409).json({ error: "Charitable organization name already exists." });
    }
    console.error("Update charitable organization error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// DELETE /api/admin/charitable-organizations/:id 
export async function deleteCharitableOrganization(req: Request, res: Response) {
  try {
    const id = parseId(req);
    if (!id) return res.status(400).json({ error: "Invalid id." });

    await CharitableOrganization.deleteCharitableOrganization(id);
    return res.json({ message: "Charitable organization deleted successfully." });
  } catch (error) {
    if (hasCode(error, "P2025")) {
      return res.status(404).json({ error: "Charitable organization not found." });
    }
    console.error("Delete charitable organization error:", (error as Error).message);
    return res.status(500).json({ error: "Internal server error." });
  }
}