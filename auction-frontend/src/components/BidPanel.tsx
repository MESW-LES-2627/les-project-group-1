import type { FormEventHandler } from 'react';
import type { AuctionState, WinnerData } from '../auction/types';
import { MIN_INCREMENT } from '../auction/data';
import { formatEuro, formatTimeLeft, shortId } from '../auction/utils';

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
      <div className="rounded-lg border border-[#c3e6cb] bg-[#d4edda] px-7 py-6 text-[#155724]">
        <h2 className="mb-2 text-[1.8rem] text-black">Auction ended!</h2>
        <p className="my-1 text-[1.4rem]">
          Winner:{' '}
          <strong>
            {winnerData.winner === socketId ? 'You!' : winnerData.winner ? shortId(winnerData.winner) : 'No one'}
          </strong>
        </p>
        <p className="my-1 text-[1.4rem]">
          Winning bid: <strong>{formatEuro(winnerData.winningBid)}</strong>
        </p>
        {paymentUrl && (
          <p className="my-1 text-[1.4rem]">
            <a href={paymentUrl}>Pay now</a>
          </p>
        )}
      </div>
    );
  }

  //Calculate the minimum bid, time left, and whether teh auction has ended or is urgent
  const minBid = auction.currentBid + MIN_INCREMENT;
  const msLeft = auction.endTime - now;
  const ended = !auction.isActive || msLeft <= 0;
  const urgent = !ended && msLeft <= 10 * 60 * 1000;

  return (
    <>
      <div className="flex items-start justify-between gap-6 rounded-lg bg-panel px-7 py-[22px] max-[960px]:flex-col">
        <div>
          <div className="text-2xl font-extrabold max-[960px]:text-[1.6rem]">Current bid:</div>
          <div className="mt-2.5 text-[2.8rem] leading-none font-black max-[960px]:text-5xl">{formatEuro(auction.currentBid)}</div>
        </div>
        <form className="flex w-[230px] flex-col gap-3 max-[960px]:w-full" onSubmit={onBid}>
          <input
            className="w-full appearance-none rounded-[14px] border-2 border-[#c4c4c4] bg-white px-5 py-3 text-center text-[1.3rem] font-bold text-ink outline-none placeholder:text-[#aaa] focus:border-ink disabled:cursor-not-allowed disabled:bg-[#ececec]"
            type="number"
            inputMode="numeric"
            min={minBid}
            disabled={ended}
            value={bidAmount}
            onChange={(event) => onBidAmountChange(event.target.value)}
            placeholder={`${new Intl.NumberFormat('de-DE').format(minBid)}€`}
            required
          />
          <button
            type="submit"
            className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-0 bg-ink p-3 text-[1.2rem] font-extrabold text-white transition-[transform,opacity] duration-150 hover:opacity-[0.88] active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-40"
            disabled={ended}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M3 11.5 21 3l-8.5 18-2.2-7.3L3 11.5z" fill="currentColor" />
            </svg>
            {ended ? 'BIDDING CLOSED' : 'PLACE BID'}
          </button>
        </form>
      </div>
      {error && <p className="mt-[10px] font-bold text-[#b3261e]">{error}</p>}

      <div className="flex justify-between px-[14px] pt-[10px] text-xl font-extrabold text-[#8a8a8a] max-[960px]:text-[1.3rem]">
        <span>
          {bidCount} bid{bidCount === 1 ? '' : 's'}
        </span>
        <span className={urgent ? 'text-[#d32f2f]' : 'text-red'}>{formatTimeLeft(msLeft)}</span>
      </div>
      <p className="mt-2 mr-[14px] ml-[14px] font-bold text-[#555]">
        {auction.highestBidder === socketId
          ? "You're the highest bidder!"
          : auction.highestBidder
            ? `Highest bidder: ${shortId(auction.highestBidder)}`
            : 'No bids yet — be the first!'}
      </p>
    </>
  );
}
