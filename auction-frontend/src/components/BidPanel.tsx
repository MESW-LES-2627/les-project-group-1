import type { FormEventHandler } from 'react';
import type { AuctionState, WinnerData } from '../auction/types';
import { MIN_INCREMENT } from '../auction/data';
import { formatEuro, formatTimeLeft, shortId } from '../auction/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

//Props for the BidPanel component
interface BidPanelProps {
  auction: AuctionState;
  bidCount: number;
  winnerData: WinnerData | null;
  paymentUrl: string;
  bidAmount: string;
  onBidAmountChange: (value: string) => void;
  onBid: FormEventHandler<HTMLFormElement>;
  error: string;
  socketId?: string;
  now: number;
}

//BidPanel component display for duration of the auction and adter the auction has ended
export function BidPanel({
  auction,
  bidCount,
  winnerData,
  paymentUrl,
  bidAmount,
  onBidAmountChange,
  onBid,
  error,
  socketId,
  now,
}: BidPanelProps) {
  if (winnerData) {
    return (
      <Card className="gap-0 rounded-lg border border-[#c3e6cb] bg-[#d4edda] px-7 py-6 text-[#155724] ring-0">
        <h2 className="mb-2 text-[1.8rem] font-bold text-black">Auction ended!</h2>
        <p className="my-1 text-[1.4rem] font-bold">
          Winner:{' '}
          <strong>
            {winnerData.winner === socketId ? 'You!' : winnerData.winner ? shortId(winnerData.winner) : 'No one'}
          </strong>
        </p>
        <p className="my-1 text-[1.4rem] font-bold">
          Winning bid: <strong>{formatEuro(winnerData.winningBid)}</strong>
        </p>
        {paymentUrl && (
          <p className="my-1 text-[1.4rem]">
            <a href={paymentUrl}>Pay now</a>
          </p>
        )}
      </Card>
    );
  }

  //Calculate the minimum bid, time left, and whether teh auction has ended or is urgent
  const minBid = auction.currentBid + MIN_INCREMENT;
  const msLeft = auction.endTime - now;
  const ended = !auction.isActive || msLeft <= 0;
  const urgent = !ended && msLeft <= 10 * 60 * 1000;

  return (
    <>
      <Card className="min-h-[148px] flex-row items-center justify-between gap-6 rounded-xl bg-[#d9d9d9] px-[30px] py-5 ring-0 max-[620px]:min-h-0 max-[620px]:flex-col max-[620px]:items-stretch max-[620px]:gap-5 max-[620px]:p-5">
        <div>
          <div className="text-[clamp(1.7rem,2.3vw,2.8rem)] leading-[1.1] font-bold text-[#363636]">Current bid</div>
          <div className="mt-[15px] text-[clamp(2.6rem,3.3vw,4rem)] leading-none font-extrabold max-[620px]:mt-[7px]">{formatEuro(auction.currentBid)}</div>
        </div>
        <form className="flex w-[min(31%,260px)] shrink-0 flex-col gap-3 max-[620px]:w-full" onSubmit={onBid}>
          <Input
            className="h-auto w-full rounded-[20px] border-[1.5px] border-[#999] bg-white px-[18px] py-[13px] text-center text-[1.4rem] font-bold text-ink shadow-none outline-none placeholder:text-[#777] focus-visible:border-ink focus-visible:ring-0 disabled:cursor-not-allowed disabled:bg-[#ececec]"
            type="number"
            inputMode="numeric"
            min={minBid}
            disabled={ended}
            value={bidAmount}
            onChange={(event) => onBidAmountChange(event.target.value)}
            placeholder={`${new Intl.NumberFormat('de-DE').format(minBid)}€`}
            required
          />
          <Button
            type="submit"
            className="h-auto cursor-pointer rounded-[20px] border-0 bg-[#050505] px-3 py-[14px] text-[clamp(1rem,1.25vw,1.45rem)] font-bold text-white transition-[opacity,transform] duration-150 hover:bg-[#050505] hover:opacity-[0.88] active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-40"
            disabled={ended}
          >
            {ended ? 'BIDDING CLOSED' : 'PLACE BID'}
          </Button>
        </form>
      </Card>
      {error && <p className="mt-[10px] font-bold text-[#b3261e]">{error}</p>}

      <div className="flex justify-between px-[18px] pt-2 text-[clamp(1.15rem,1.5vw,1.7rem)] font-semibold max-[620px]:px-2 max-[620px]:text-[1.05rem]">
        <span>
          {bidCount} bid{bidCount === 1 ? '' : 's'}
        </span>
        <span className={urgent ? 'text-[#d32f2f]' : 'text-[#870e0e]'}>{formatTimeLeft(msLeft)}</span>
      </div>
    </>
  );
}
