import type { Request, Response } from "express";
import * as Listing from "../models/listing.model";
import { toDetail, toSummary } from "../services/listings.service";

/** Public memorabilia catalogue. Only verified listings are returned. */

export async function getListings(req: Request, res: Response) {
  const search = String(req.query.search ?? "").trim();
  const category = String(req.query.category ?? "").trim();
  const pattern = search ? `%${search}%` : null;

  const rows = await Listing.findPublicListings(pattern, category || null);
  res.json(rows.map(toSummary));
}

export async function getListing(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid id" });

  const row = await Listing.findPublicListingById(id);
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(toDetail(row));
}

export async function getCategories(_req: Request, res: Response) {
  res.json(await Listing.findCategories());
}

// Club page: club profile plus its verified listings.
export async function getClub(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const club = await Listing.findClubBySlug(slug);
  if (!club) return res.status(404).json({ error: "not found" });

  const rows = await Listing.findPublicListingsByClub(slug);
  res.json({ ...club, listings: rows.map(toSummary) });
}
