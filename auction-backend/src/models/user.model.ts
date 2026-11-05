import { prisma } from "../config/prisma";

export type Role = "ADMIN" | "CLUB" | "BUYER";

export async function findAuthById(id: number) {
  return prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
}

export async function emailExists(email: string) {
  return (await prisma.user.count({ where: { email } })) > 0;
}

export async function createUser(
    username: string, email: string, passwordHash: string, country: string, role: Role = "BUYER",
) {
  return prisma.user.create({
    data: { username, email, passwordHash, country, role },
    select: { username: true, email: true, createdAt: true, country: true, role: true },
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