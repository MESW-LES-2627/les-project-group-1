import { prisma } from "../config/prisma";
import { Prisma } from "../../generated/prisma/client";
import type { ListingInput, NewListingInput } from "../utils/listingValidation";

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
  return prisma.category.findMany({ select: { id: true, slug: true, name: true }, orderBy: { name: "asc" } });
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
/*export async function findListingAuction(id: number) {
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
}*/

export async function findListingAuction(id: number) {
  if (!Number.isInteger(id)) return null;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      status: true,
      startingPrice: true,
      auctionEndsAt: true,
      verifiedAt: true,
    },
  });

  if (!listing || listing.startingPrice === null || !listing.auctionEndsAt) return null;

  return {
    id: listing.id,
    title: listing.title,
    status: listing.status,
    startingPrice: Number(listing.startingPrice),
    startsAt: listing.verifiedAt ? new Date(listing.verifiedAt) : null,
    endsAt: new Date(listing.auctionEndsAt),
  };
}

// CLUB-OWNED LISTINGS

/** Every query here is scoped by clubId, so a club can never read or change another club's listings. */

/** Clubs can only edit listings in these states. Pending and verified listings are locked. */
export const EDITABLE_STATUSES_CLUB = ["draft", "rejected"];

export const listingSelect = {
  id: true,
  categoryId: true,
  category: { select: { slug: true, name: true } },
  title: true,
  playerName: true,
  playerDetails: true,
  season: true,
  competition: true,
  match: true,
  tags: true,
  description: true,
  images: true,
  status: true,
  authenticityNotes: true,
  evidenceImages: true,
  certificateCode: true,
  startingPrice: true,
  auctionEndsAt: true,
  createdAt: true,
  verifiedAt: true,
} as const;

// A nullable JSON column needs Prisma.DbNull to be set to NULL. Returns what to spread into the data.
function playerDetailsData(value: ListingInput["playerDetails"]) {
  if (value === undefined) return {};
  return { playerDetails: value === null ? Prisma.DbNull : value };
}

export async function listOwn(clubId: number, opts: { status?: string; skip: number; take: number }) {
  const where = { clubId, ...(opts.status ? { status: opts.status } : {}) };
  const [items, total] = await prisma.$transaction([
    prisma.listing.findMany({ where, select: listingSelect, orderBy: { id: "desc" }, skip: opts.skip, take: opts.take }),
    prisma.listing.count({ where }),
  ]);
  return { items, total };
}

export async function adminListing(opts: { status?: string; skip: number; take: number }) {
  const where = {
    status: {
      in: ["pending_verification", "verified"],
      ...(opts.status ? { equals: opts.status } : {}),
    },
  };

  const [items, total] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      select: listingSelect,
      orderBy: { id: "desc" },
      skip: opts.skip,
      take: opts.take,
    }),
    prisma.listing.count({ where }),
  ]);

  return { items, total };
}

export async function updateListingStatus(
    id: number,
    status: "pending_verification" | "verified" | "rejected"
) {
  return prisma.listing.update({
    where: { id },
    data: { status },
    select: listingSelect,
  });
}

export async function findOwn(id: number, clubId: number) {
  return prisma.listing.findFirst({ where: { id, clubId }, select: listingSelect });
}

export async function createOwn(clubId: number, input: NewListingInput) {
  // Throws Prisma P2002 if the title is taken, P2003 if the category doesn't exist.
  const { playerDetails, ...rest } = input;
  return prisma.listing.create({
    data: { ...rest, ...playerDetailsData(playerDetails), clubId },
    select: listingSelect,
  });
}

/** Returns how many rows changed: 0 means not found, not yours, or no longer editable. */
export async function updateOwn(id: number, clubId: number, input: ListingInput) {
  const { playerDetails, ...rest } = input;
  const result = await prisma.listing.updateMany({
    where: { id, clubId, status: { in: EDITABLE_STATUSES_CLUB } },
    data: { ...rest, ...playerDetailsData(playerDetails) },
  });
  return result.count;
}

/** Returns how many rows were deleted. Verified listings can't be deleted. */
export async function deleteOwn(id: number, clubId: number) {
  const result = await prisma.listing.deleteMany({ where: { id, clubId, status: { not: "verified" } } });
  return result.count;
}
