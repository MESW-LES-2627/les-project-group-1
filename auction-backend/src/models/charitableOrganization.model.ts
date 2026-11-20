import { prisma } from "../config/prisma";

//Public fields returned for charitable organizations.
const defaultSelect = {
  id: true,
  name: true,
  description: true,
  logoUrl: true,
  country: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
} as const;

const publicSelect = {
  ...defaultSelect,
  _count: { select: { listings: true } },
} as const;

//List, find by ID, create, update and delete the organizations.

export async function listCharitableOrganizations(params: {
  search?: string;
  skip: number;
  take: number;
}) {
  const where = params.search
    ? {
        OR: [
          { name: { contains: params.search, mode: "insensitive" as const } },
          { description: { contains: params.search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [items, total] = await Promise.all([
    prisma.charitableOrganization.findMany({
      where,
      select: defaultSelect,
      orderBy: { id: "asc" },
      skip: params.skip,
      take: params.take,
    }),
    prisma.charitableOrganization.count({ where }),
  ]);

  return { items, total };
}

export async function findById(id: number) {
  return prisma.charitableOrganization.findUnique({
    where: { id },
    select: defaultSelect,
  });
}

/** Only verified organizations can be picked by clubs for an auction. */
export async function findVerifiedById(id: number) {
  return prisma.charitableOrganization.findFirst({
    where: { id, verified: true },
    select: defaultSelect,
  });
}

/** Public list shown on the charities page and to clubs when selecting a cause. */
export async function listVerified() {
  const items = await prisma.charitableOrganization.findMany({
    where: { verified: true },
    select: publicSelect,
    orderBy: { name: "asc" },
  });
  return items.map(({ _count, ...organization }) => ({
    ...organization,
    auctionCount: _count.listings,
  }));
}

export async function createCharitableOrganization(data: {
  name: string;
  description?: string;
  logoUrl?: string | null;
  country?: string;
  verified?: boolean;
}) {
  return prisma.charitableOrganization.create({
    data: {
      name: data.name,
      description: data.description ?? "",
      logoUrl: data.logoUrl ?? null,
      country: data.country ?? "",
      verified: data.verified ?? false,
    },
    select: defaultSelect,
  });
}

export async function updateCharitableOrganization(
  id: number,
  data: {
    name?: string;
    description?: string;
    logoUrl?: string | null;
    country?: string;
    verified?: boolean;
  }
) {
  return prisma.charitableOrganization.update({
    where: { id },
    data,
    select: defaultSelect,
  });
}

export async function deleteCharitableOrganization(id: number) {
  await prisma.charitableOrganization.delete({ where: { id } });
}