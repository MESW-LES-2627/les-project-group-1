import { sql } from "../config/db";

/** Queries for the `winners` table. */

export interface WinnerInput {
  itemName: string;
  socketId: string;
  email?: string;
  winningBid: number;
  endedAt: Date;
  stripeSessionId: string;
}

export async function saveWinner(w: WinnerInput) {
  await sql.begin(async (tx) => {
    // Demo resets reuse the same item, so keep only its latest winner.
    await tx`delete from winners where item_name = ${w.itemName}`;
    await tx`
      insert into winners (item_name, socket_id, email, winning_bid, ended_at, stripe_session_id)
      values (${w.itemName}, ${w.socketId}, ${w.email ?? null}, ${w.winningBid}, ${w.endedAt}, ${w.stripeSessionId})
    `;
  });
}

export async function markPaid(sessionId: string) {
  await sql`
    update winners
    set status = 'paid', paid_at = now()
    where stripe_session_id = ${sessionId} and status <> 'paid'
  `;
}
