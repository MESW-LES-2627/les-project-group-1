import type { FormEventHandler } from 'react';
import { BidPanel } from '../components/BidPanel';
import { CausesList } from '../components/CausesList';
import { LatestBids } from '../components/LatestBids';
import { PlayerDetails } from '../components/PlayerDetails';
import { ITEM } from './data';
import type { AuctionState, Bid, WinnerData } from './types';

/**
 * Props for the AuctionPage component.
 * Displays the auction page with item details, bidding panel, and latest bids.
 * It does not handle side effects or direct WebSocket connections.
 */

// Data and functions needed to display the auction page and handle user interactions.
interface AuctionPageProps {
  auction: AuctionState;
  bids: Bid[];
  bidAmount: string;
  onBidAmountChange: (value: string) => void;
  onBid: FormEventHandler<HTMLFormElement>;
  error: string;
  winnerData: WinnerData | null;
  paymentUrl: string;
  myId: string;
  socketId?: string;
  activeImage: number;
  onImageChange: (index: number) => void;
  now: number;
  onChangeEmail: () => void;
  onReset: () => void;
  isResetting: boolean;
  resetError: string;
}

//Main page view for the auction.
export function AuctionPage({
  auction,
  bids,
  bidAmount,
  onBidAmountChange,
  onBid,
  error,
  winnerData,
  paymentUrl,
  myId,
  socketId,
  activeImage,
  onImageChange,
  now,
  onChangeEmail,
  onReset,
  isResetting,
  resetError,
}: AuctionPageProps) {
  return (
    <main className="mx-auto grid max-w-[1200px] grid-cols-2 gap-10 px-6 py-8 max-[960px]:grid-cols-1 max-[960px]:gap-8 max-[960px]:px-4 max-[960px]:py-6">
      <PlayerDetails itemName={auction.itemName} activeImage={activeImage} onImageChange={onImageChange} />

      <section>
        <div className="mb-[14px] inline-flex items-center gap-2 rounded-full bg-card px-[14px] py-1.5 text-[0.95rem] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <span className="size-[9px] rounded-full bg-[#2e9d57]" />
          You are bidder <strong>{myId}</strong>
          <button type="button" className="ml-2 cursor-pointer border-0 bg-transparent text-inherit underline" onClick={onChangeEmail}>
            change email
          </button>
          <button
            type="button"
            className="ml-1 cursor-pointer rounded-full border border-[#bbb] bg-transparent px-2 py-0.5 text-xs font-bold text-[#555] hover:bg-[#f0f0f0] disabled:cursor-wait disabled:opacity-50"
            onClick={onReset}
            disabled={isResetting}
            aria-label="Reset auction"
            title="Reset auction for demo"
          >
            {isResetting ? 'Resetting…' : 'Reset'}
          </button>
        </div>
        {resetError && <p role="alert" className="-mt-2 mb-3 text-sm text-red-700">{resetError}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="m-0 text-[2rem] leading-none font-black text-black uppercase max-[960px]:text-5xl">{auction.itemName}</h1>
          {ITEM.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-xl px-4 py-[5px] text-xl font-extrabold text-white max-[960px]:px-4 max-[960px]:py-1.5 max-[960px]:text-[1.3rem] ${tag === 'worn' ? 'bg-ink' : 'bg-purple'}`}
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-1.5 mb-5 ml-2 font-bold text-[#555]">{ITEM.subtitle}</p>

        <BidPanel
          auction={auction}
          bidCount={auction.bidCount ?? bids.length}
          winnerData={winnerData}
          paymentUrl={paymentUrl}
          bidAmount={bidAmount}
          onBidAmountChange={onBidAmountChange}
          onBid={onBid}
          error={error}
          socketId={socketId}
          myId={myId}
          now={now}
        />

        <CausesList />
        <hr className="mt-7 mb-[18px] border-0 border-t-[3px] border-[#d9d9d9]" />
        <LatestBids bids={bids} myId={myId} />
      </section>
    </main>
  );
}
