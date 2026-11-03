import { LATEST_BIDS_SHOWN } from '../auction/data';
import type { Bid } from '../auction/types';
import { flagEmoji, formatDate, formatEuroSuffix, shortId } from '../auction/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const cell = 'border-t-2 border-line px-[14px] py-[10px] text-center max-mobile:px-1 max-mobile:py-[9px] max-mobile:text-[0.72rem]';

const styles = {
  card: 'gap-0 overflow-hidden rounded-xl bg-chalk p-0 shadow-[4px_6px_8px_rgba(0,0,0,0.23)] ring-0',
  header: 'flex items-center justify-between gap-0 rounded-none bg-panel-strong px-[18px] py-2 max-mobile:px-3 max-mobile:py-[9px]',
  title: 'text-[clamp(1.8rem,2.35vw,2.8rem)] font-extrabold tracking-[-0.04em] max-mobile:text-2xl',
  viewAll: 'h-auto p-0 text-[clamp(1rem,1.2vw,1.4rem)] font-bold text-info underline decoration-1 underline-offset-[3px] max-mobile:text-[0.9rem]',
  tableHeading: 'px-[10px] pt-3 pb-2 text-center text-[clamp(0.8rem,1vw,1.15rem)] font-bold text-slate capitalize max-mobile:px-1 max-mobile:text-[0.7rem]',
  row: 'hover:bg-transparent',
  emptyCell: 'border-t-2 border-line px-4 py-4 text-center font-bold text-grey-strong',
  bidderCell: `${cell} text-[clamp(0.9rem,1.1vw,1.25rem)] font-extrabold`,
  bidCell: `${cell} text-[clamp(0.9rem,1.1vw,1.25rem)] font-bold`,
  flag: 'mr-4 text-[1.25em] align-[-2px] max-mobile:mr-1',
  youBadge: 'ml-2.5 rounded-full bg-purple px-2 py-0.5 text-xs font-extrabold text-white uppercase',
};

/**
 * LatestBids component
 * 
 * Displays recent bids in shadcn Card/Table primitives, restyled to the auction reference.
 * Bidder IDs are extra-bold; the date and amount columns are bold.
 */

interface LatestBidsProps {
  bids: Bid[];
  myId: string;
}

export function LatestBids({ bids, myId }: LatestBidsProps) {
  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <CardTitle className={styles.title}>Latest bids</CardTitle>
        <Button asChild variant="link" className={styles.viewAll}>
          <a href="#all-bids">View all</a>
        </Button>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow className={cn('border-b-0', styles.row)}>
            <TableHead className={styles.tableHeading}>Bidder</TableHead>
            <TableHead className={styles.tableHeading}>Date</TableHead>
            <TableHead className={styles.tableHeading}>Bid</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bids.length === 0 ? (
            <TableRow className={styles.row}>
              <TableCell colSpan={3} className={styles.emptyCell}>
                No bids yet
              </TableCell>
            </TableRow>
          ) : (
            bids.slice(0, LATEST_BIDS_SHOWN).map((bid, index) => (
              <TableRow key={`${bid.timestamp}-${index}`} className={styles.row}>
                <TableCell className={styles.bidderCell}>
                  <span className={styles.flag}>{flagEmoji(bid.country)}</span>
                  {shortId(bid.bidder)}
                  {bid.bidder === myId && (
                    <span className={styles.youBadge}>
                      you
                    </span>
                  )}
                </TableCell>
                <TableCell className={styles.bidCell}>{formatDate(bid.timestamp)}</TableCell>
                <TableCell className={styles.bidCell}>{formatEuroSuffix(bid.amount)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
