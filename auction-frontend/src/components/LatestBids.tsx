import { LATEST_BIDS_SHOWN } from '../auction/data';
import type { Bid } from '../auction/types';
import { flagEmoji, formatDate, formatEuroSuffix, shortId } from '../auction/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * LastestBids Component
 * 
 * Displays a table of recent bids for the auction item.
 */

interface LatestBidsProps {
  bids: Bid[];
  myId: string;
}

export function LatestBids({ bids, myId }: LatestBidsProps) {
  return (
    <Card className="gap-0 overflow-hidden rounded-xl bg-[#f5f5f5] p-0 shadow-[4px_6px_8px_rgba(0,0,0,0.23)] ring-0">
      <CardHeader className="flex items-center justify-between gap-0 rounded-none bg-[#d9d9d9] px-[18px] py-2 max-[620px]:px-3 max-[620px]:py-[9px]">
        <CardTitle className="text-[clamp(1.8rem,2.35vw,2.8rem)] font-extrabold tracking-[-0.04em] max-[620px]:text-2xl">Latest bids</CardTitle>
        <Button asChild variant="link" className="h-auto p-0 text-[clamp(1rem,1.2vw,1.4rem)] font-bold text-[#3493ce] underline decoration-1 underline-offset-[3px] max-[620px]:text-[0.9rem]">
          <a href="#all-bids">View all</a>
        </Button>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="px-[10px] pt-3 pb-2 text-center text-[clamp(0.8rem,1vw,1.15rem)] font-bold text-[#666] capitalize max-[620px]:px-1 max-[620px]:text-[0.7rem]">Bidder</TableHead>
            <TableHead className="px-[10px] pt-3 pb-2 text-center text-[clamp(0.8rem,1vw,1.15rem)] font-bold text-[#666] capitalize max-[620px]:px-1 max-[620px]:text-[0.7rem]">Date</TableHead>
            <TableHead className="px-[10px] pt-3 pb-2 text-center text-[clamp(0.8rem,1vw,1.15rem)] font-bold text-[#666] capitalize max-[620px]:px-1 max-[620px]:text-[0.7rem]">Bid</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bids.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={3} className="border-t-2 border-[#e1e1e1] px-4 py-4 text-center font-bold text-[#888]">
                No bids yet
              </TableCell>
            </TableRow>
          ) : (
            bids.slice(0, LATEST_BIDS_SHOWN).map((bid, index) => (
              <TableRow key={`${bid.timestamp}-${index}`} className="hover:bg-transparent">
                <TableCell className="border-t-2 border-[#e1e1e1] px-[14px] py-[10px] text-center text-[clamp(0.9rem,1.1vw,1.25rem)] font-extrabold max-[620px]:px-1 max-[620px]:py-[9px] max-[620px]:text-[0.72rem]">
                  <span className="mr-4 text-[1.25em] align-[-2px] max-[620px]:mr-1">{flagEmoji(bid.country)}</span>
                  {shortId(bid.bidder)}
                  {bid.bidder === myId && (
                    <span className="ml-2.5 rounded-full bg-purple px-2 py-0.5 text-xs font-extrabold text-white uppercase">
                      you
                    </span>
                  )}
                </TableCell>
                <TableCell className="border-t-2 border-[#e1e1e1] px-[14px] py-[10px] text-center text-[clamp(0.9rem,1.1vw,1.25rem)] font-bold max-[620px]:px-1 max-[620px]:py-[9px] max-[620px]:text-[0.72rem]">{formatDate(bid.timestamp)}</TableCell>
                <TableCell className="border-t-2 border-[#e1e1e1] px-[14px] py-[10px] text-center text-[clamp(0.9rem,1.1vw,1.25rem)] font-bold max-[620px]:px-1 max-[620px]:py-[9px] max-[620px]:text-[0.72rem]">{formatEuroSuffix(bid.amount)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
