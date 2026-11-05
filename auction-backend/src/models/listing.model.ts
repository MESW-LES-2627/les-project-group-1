import { sql } from "../config/db";

/** Queries for the catalogue. Listings are always read from the public_listings view (verified only). */

// Row shape returned by the public_listings view.
export interface ListingRow {
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

export async function findPublicListings(pattern: string | null, categorySlug: string | null) {
  const rows = await sql`
    select * from public_listings
    where (${pattern}::text is null
        or title ilike ${pattern}
        or club_name ilike ${pattern}
        or player_name ilike ${pattern})
      and (${categorySlug}::text is null or category_slug = ${categorySlug})
    order by id
  `;
  return rows as ListingRow[];
}

export async function findPublicListingById(id: number) {
  const [row] = await sql`select * from public_listings where id = ${id}`;
  return row as ListingRow | undefined;
}

export async function findCategories() {
  return await sql`select slug, name from categories order by name`;
}

export async function findClubBySlug(slug: string) {
  const [club] = await sql`
    select slug, name, description, logo_url as "logoUrl" from clubs where slug = ${slug}
  `;
  return club;
}

export async function findPublicListingsByClub(slug: string) {
  const rows = await sql`select * from public_listings where club_slug = ${slug} order by id`;
  return rows as ListingRow[];
}

/** Data needed to open a live auction for a verified listing, or null if it has no auction data. */
export async function findListingAuction(id: number) {
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
