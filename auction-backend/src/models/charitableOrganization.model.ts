import { prisma } from "../config/prisma";

//Public fields returned for charitable organizations. 
const defaultSelect = {
  id: true,
  name: true,
  description: true,
  logoUrl: true,
  createdAt: true,
  updatedAt: true,
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

export async function createCharitableOrganization(data: {
  name: string;
  description?: string;
  logoUrl?: string | null;
}) {
  return prisma.charitableOrganization.create({
    data: {
      name: data.name,
      description: data.description ?? "",
      logoUrl: data.logoUrl ?? null,
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