import { prisma } from "../config/prisma";
import type { Role } from "../../generated/prisma/enums";

export type { Role };

const publicSelect = {
  id: true,
  username: true,
  email: true,
  country: true,
  role: true,
  createdAt: true,
} as const;

export async function emailExists(email: string) {
  return (await prisma.user.count({ where: { email } })) > 0;
}

export async function createUser(username: string, email: string, passwordHash: string, country: string, role: Role = "BUYER") {
  return prisma.user.create({
    data: { username, email, passwordHash, country, role },
    select: { id: true, username: true, email: true, createdAt: true, country: true, role: true },
  });
}

export async function findForLogin(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true, email: true, passwordHash: true, country: true, role: true },
  });
}

export async function findIdByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
}

export async function findProfileByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { username: true, country: true },
  });
}

export async function findMe(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, email: true, country: true, avatar: true },
  });
}

export async function usernameTakenByOther(username: string, userId: number) {
  return (await prisma.user.count({ where: { username, id: { not: userId } } })) > 0;
}

export async function emailTakenByOther(email: string, userId: number) {
  const count = await prisma.user.count({
    where: { email: { equals: email, mode: "insensitive" }, id: { not: userId } },
  });
  return count > 0;
}

export async function updateProfile(userId: number, username: string, country: string, email?: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({ where: { id: userId }, select: { email: true } });
    const user = await tx.user.update({
      where: { id: userId },
      data: { username, country, ...(email ? { email } : {}) },
      select: { username: true, email: true, country: true },
    });
    if (current && email && current.email !== email) {
      await tx.winner.updateMany({
        where: { email: { equals: current.email, mode: "insensitive" } },
        data: { email },
      });
    }
    return user;
  });
}

export async function setAvatar(userId: number, avatar: string | null) {
  await prisma.user.update({ where: { id: userId }, data: { avatar } });
}

export async function setResetToken(email: string, token: string, expiresAt: Date) {
  await prisma.user.updateMany({
    where: { email: { equals: email, mode: "insensitive" } },
    data: { resetToken: token, resetTokenExpires: expiresAt },
  });
}

export async function findByValidResetToken(token: string) {
  return prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpires: { gt: new Date() } },
    select: { id: true },
  });
}

export async function updatePassword(userId: number, passwordHash: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, resetToken: null, resetTokenExpires: null },
  });
}

export async function findAuthById(id: number) {
  return prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
}

export async function listUsers(opts: { role?: Role; search?: string; skip: number; take: number }) {
  const where = {
    ...(opts.role ? { role: opts.role } : {}),
    ...(opts.search
        ? {
          OR: [
            { username: { contains: opts.search, mode: "insensitive" as const } },
            { email: { contains: opts.search, mode: "insensitive" as const } },
          ],
        }
        : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select: publicSelect, orderBy: { id: "asc" }, skip: opts.skip, take: opts.take }),
    prisma.user.count({ where }),
  ]);
  return { items, total };
}

export async function findById(id: number) {
  return prisma.user.findUnique({ where: { id }, select: publicSelect });
}

export async function updateUser(
    id: number,
    data: { username?: string; email?: string; country?: string; role?: Role; passwordHash?: string },
) {
  return prisma.user.update({ where: { id }, data, select: publicSelect });
}

export async function deleteUser(id: number) {
  await prisma.user.delete({ where: { id } });
}