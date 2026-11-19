import { prisma } from "../config/prisma";

/** New clubs start as "pending". Only an approved club can create, edit or delete listings. */
export const CLUB_APPROVED = "approved";

export const CLUB_STATUSES = ["pending", "approved", "rejected"] as const;
export type ClubStatus = (typeof CLUB_STATUSES)[number];

/** Fields a club owner sees about their own club. Never includes the user's password hash or reset token. */
const ownerSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  status: true,
  logoUrl: true,
  createdAt: true,
  listings: {
    select: { id: true, title: true, status: true, startingPrice: true, auctionEndsAt: true, createdAt: true },
    orderBy: { id: "asc" },
  },
} as const;

export async function findClubByUserId(userId: number) {
  return prisma.club.findUnique({ where: { userId }, select: ownerSelect });
}

export async function findClubLogo(userId: number) {
  return prisma.club.findUnique({ where: { userId }, select: { id: true, logoUrl: true } });
}

export async function updateClubByUserId(userId: number, data: { name?: string; description?: string }) {
  // Throws Prisma P2025 if the user has no club, P2002 if the name is already taken.
  return prisma.club.update({
    where: { userId },
    data,
    select: { id: true, slug: true, name: true, description: true, status: true, logoUrl: true },
  });
}

export async function setClubLogo(userId: number, logoUrl: string | null) {
  await prisma.club.update({ where: { userId }, data: { logoUrl } });
}

// ---------------------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------------------

/** Fields an admin sees about a club, including its owner and number of listings. */
const adminSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  status: true,
  logoUrl: true,
  createdAt: true,
  user: { select: { id: true, username: true, email: true, country: true } },
  _count: { select: { listings: true } },
} as const;

export async function listClubs(params: {
  status?: ClubStatus;
  search?: string;
  skip: number;
  take: number;
}) {
  const where = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" as const } },
            { slug: { contains: params.search, mode: "insensitive" as const } },
            { user: { is: { username: { contains: params.search, mode: "insensitive" as const } } } },
            { user: { is: { email: { contains: params.search, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.club.findMany({ where, select: adminSelect, orderBy: { id: "asc" }, skip: params.skip, take: params.take }),
    prisma.club.count({ where }),
  ]);
  return { items, total };
}

export async function updateClubStatus(id: number, status: ClubStatus) {
  return prisma.club.update({ where: { id }, data: { status }, select: adminSelect });
}