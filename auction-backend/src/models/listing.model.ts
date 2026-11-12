import { prisma } from "../config/prisma";

// Row shape returned by the public_listings view.
export interface ListingRow {
  id: number;
  title: string;
  player_name: string | null;
  player_details: Record<string, string | number> | null;
  season: string | null;
  competition: string | null;
  match: string | null;
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
  club_logo_url: string | null;
  category_slug: string;
  category_name: string;
}

export async function findPublicListings(pattern: string | null, categorySlug: string | null) {
  return prisma.$queryRaw<ListingRow[]>`
    select * from public_listings
    where (${pattern}::text is null
        or title ilike ${pattern}
        or club_name ilike ${pattern}
        or player_name ilike ${pattern}
        or match ilike ${pattern})
      and (${categorySlug}::text is null or category_slug = ${categorySlug})
    order by id
  `;
}

export async function findPublicListingById(id: number) {
  const rows = await prisma.$queryRaw<ListingRow[]>`select * from public_listings where id = ${id}`;
  return rows[0];
}

export async function findCategories() {
  return prisma.category.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } });
}

export async function findClubBySlug(slug: string) {
  return prisma.club.findUnique({
    where: { slug },
    select: { slug: true, name: true, description: true, logoUrl: true },
  });
}

export async function findPublicListingsByClub(slug: string) {
  return prisma.$queryRaw<ListingRow[]>`select * from public_listings where club_slug = ${slug} order by id`;
}

/** Data needed to open a live auction for a verified listing, or null if it has no auction data. */
export async function findListingAuction(id: number) {
  if (!Number.isInteger(id)) return null;

  const rows = await prisma.$queryRaw<
      { title: string; starting_price: number | null; auction_ends_at: Date | null }[]
  >`select title, starting_price, auction_ends_at from public_listings where id = ${id}`;
  const row = rows[0];
  if (!row || row.starting_price === null || !row.auction_ends_at) return null;

  return {
    title: row.title,
    startingPrice: Number(row.starting_price),
    endsAt: new Date(row.auction_ends_at),
  };
}