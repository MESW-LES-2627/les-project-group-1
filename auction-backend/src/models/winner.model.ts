import { prisma } from "../config/prisma";

export interface WinnerInput {
  itemName: string;
  socketId: string;
  email?: string;
  winningBid: number;
  endedAt: Date;
  stripeSessionId: string;
}

export async function saveWinner(w: WinnerInput) {
  // Demo resets reuse the same item, so keep only its latest winner.
  await prisma.$transaction([
    prisma.winner.deleteMany({ where: { itemName: w.itemName } }),
    prisma.winner.create({
      data: {
        itemName: w.itemName,
        socketId: w.socketId,
        email: w.email ?? null,
        winningBid: w.winningBid,
        endedAt: w.endedAt,
        stripeSessionId: w.stripeSessionId,
      },
    }),
  ]);
}

export async function markPaid(sessionId: string) {
  await prisma.winner.updateMany({
    where: { stripeSessionId: sessionId, status: { not: "paid" } },
    data: { status: "paid", paidAt: new Date() },
  });
}