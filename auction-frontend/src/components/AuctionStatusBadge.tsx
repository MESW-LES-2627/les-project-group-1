import { cn } from '@/lib/utils';
import type { AuctionStatus } from '@/auction/types';

/** Label and colour for each auction status, so the catalogue and the auction page say the same thing. */
export const AUCTION_STATUS_LABELS: Record<AuctionStatus, string> = {
  scheduled: 'Scheduled',
  active: 'Live',
  completed: 'Ended',
  cancelled: 'Cancelled',
};

const COLORS: Record<AuctionStatus, string> = {
  scheduled: 'bg-orange text-white',
  active: 'bg-live text-white',
  completed: 'bg-grey-soft text-ink-strong',
  cancelled: 'bg-danger text-white',
};

export function AuctionStatusBadge({ status, className }: { status: AuctionStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-3 py-0.5 text-xs font-extrabold tracking-wide uppercase',
        COLORS[status],
        className
      )}
    >
      {AUCTION_STATUS_LABELS[status]}
    </span>
  );
}
