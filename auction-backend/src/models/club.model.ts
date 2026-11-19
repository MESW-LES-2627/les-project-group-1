import { prisma } from "../config/prisma";

/** New clubs start as "pending". Only an approved club can create, edit or delete listings. */
export const CLUB_APPROVED = "approved";

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