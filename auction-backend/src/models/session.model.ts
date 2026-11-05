import { randomBytes } from "crypto";
import { prisma } from "../config/prisma";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  return token;
}

export async function findUserIdByToken(token: string) {
  const session = await prisma.session.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    select: { userId: true },
  });
  return session?.userId ?? null;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}