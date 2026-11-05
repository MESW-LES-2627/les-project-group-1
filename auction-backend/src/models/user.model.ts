import { prisma } from "../config/prisma";

export async function emailExists(email: string) {
  return (await prisma.user.count({ where: { email } })) > 0;
}

export async function createUser(username: string, email: string, passwordHash: string, country: string) {
  return prisma.user.create({
    data: { username, email, passwordHash, country },
    select: { id: true, username: true, email: true, createdAt: true, country: true },
  });
}

export async function findForLogin(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true, email: true, passwordHash: true, country: true },
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

export async function updateProfile(userId: number, username: string, country: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { username, country },
    select: { username: true, email: true, country: true },
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