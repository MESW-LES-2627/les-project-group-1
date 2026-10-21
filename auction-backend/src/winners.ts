import { sql } from "./db";

/**
 * Winner database operations
 * 
 * Provides functions to save winner information and mark payments as paid.
 */


interface WinnerInput {
  itemName: string;
  socketId: string;
  email?: string;
  winningBid: number;
  endedAt: Date;
  stripeSessionId: string;
}

export async function saveWinner(w: WinnerInput) {
  await sql.begin(async (tx) => {
    // Demo resets reuse the same item, so keep its latest winner rather than
    // accumulating stale winner rows for every run.
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
