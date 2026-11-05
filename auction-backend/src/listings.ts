import type { Request, Response } from "express";
import { sql } from "./db";

/**
 * Catalogue service
 *
 * Provides handlers for the public memorabilia catalogue: list and search listings,
 * get one listing, list categories and get a club page. Only verified listings are
 * returned, because everything reads from the public_listings view.
 */

// Row shape returned by the public_listings view.
interface ListingRow {
  id: number;
  title: string;
  player_name: string | null;
  player_details: Record<string, string | number> | null;
  season: string | null;
  competition: string | null;
  tags: string[];
  description: string;
  images: string[];
  authenticity_notes: string | null;
  evidence_images: string[];
  certificate_code: string | null;
  verified_at: Date | null;
  starting_price: number | null;
  auction_ends_at: Date | null;
  club_slug: string;
  club_name: string;
  category_slug: string;
  category_name: string;
}

// Live values of an open auction (provided by the auction server in index.ts).
interface LiveAuction {
  currentBid: number;
  endTime: number;
}

let liveAuctionLookup: (listingId: number) => LiveAuction | undefined = () => undefined;

// Lets the auction server tell the catalogue the live current bid and end time of each listing.
export function setLiveAuctionLookup(lookup: (listingId: number) => LiveAuction | undefined) {
  liveAuctionLookup = lookup;
}

// Maps a database row to the summary shown on catalogue cards.
function toSummary(row: ListingRow) {
  const live = liveAuctionLookup(row.id);
  return {
    id: row.id,
    title: row.title,
    playerName: row.player_name,
    season: row.season,
    competition: row.competition,
    tags: row.tags,
    images: row.images,
    club: { slug: row.club_slug, name: row.club_name },
    category: { slug: row.category_slug, name: row.category_name },
    currentBid: live?.currentBid ?? row.starting_price,
    auctionEndsAt: live ? new Date(live.endTime) : row.auction_ends_at,
  };
}

// Maps a database row to the full detail shown on the item page, including authenticity data.
function toDetail(row: ListingRow) {
  return {
    ...toSummary(row),
    description: row.description,
    player: row.player_name && row.player_details ? { name: row.player_name, ...row.player_details } : null,
    authenticityNotes: row.authenticity_notes,
    evidenceImages: row.evidence_images,
    certificateCode: row.certificate_code,
    verifiedAt: row.verified_at,
  };
}

// Lists verified listings.
export async function getListings(req: Request, res: Response) {
  const search = String(req.query.search ?? "").trim();
  const category = String(req.query.category ?? "").trim();
  const pattern = search ? `%${search}%` : null;
  const categorySlug = category || null;

  const rows = await sql`
    select * from public_listings
    where (${pattern}::text is null
        or title ilike ${pattern}
        or club_name ilike ${pattern}
        or player_name ilike ${pattern})
      and (${categorySlug}::text is null or category_slug = ${categorySlug})
    order by id
  `;
  res.json((rows as ListingRow[]).map(toSummary));
}

// Gets one verified listing by id.
export async function getListing(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid id" });

  const [row] = await sql`select * from public_listings where id = ${id}`;
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(toDetail(row as ListingRow));
}

// Lists all categories for browsing and filtering.
export async function getCategories(_req: Request, res: Response) {
  const rows = await sql`select slug, name from categories order by name`;
  res.json(rows);
}

// Gets a club page: club profile plus its verified listings.
export async function getClub(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const [club] = await sql`
    select slug, name, description, logo_url as "logoUrl" from clubs where slug = ${slug}
  `;
  if (!club) return res.status(404).json({ error: "not found" });

  const rows = await sql`select * from public_listings where club_slug = ${slug} order by id`;
  res.json({ ...club, listings: (rows as ListingRow[]).map(toSummary) });
}

// Gets the data needed to open a live auction for a verified listing, or null if it has no auction data.
export async function getListingAuction(id: number) {
  if (!Number.isInteger(id)) return null;

  const [row] = await sql`
    select title, starting_price, auction_ends_at from public_listings where id = ${id}
  `;
  if (!row || row.starting_price === null || !row.auction_ends_at) return null;

  return {
    title: row.title as string,
    startingPrice: Number(row.starting_price),
    endsAt: new Date(row.auction_ends_at),
  };
}