import type { FormEventHandler } from 'react';
import { Separator } from '@/components/ui/separator';
import { AuctionItemHeading } from '@/components/AuctionItemHeading';
import { BidderControls } from '@/components/BidderControls';
import { BidPanel } from '@/components/BidPanel';
import { CausesList } from '@/components/CausesList';
import { LatestBids } from '@/components/LatestBids';
import { Navbar } from '@/components/Navbar';
import { PlayerDetails } from '@/components/PlayerDetails';
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
    <>
      <Navbar />

      <main
        id="top"
        className="mx-auto grid w-[calc(100%_-_112px)] max-w-[1888px] grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] items-start gap-[clamp(60px,10vw,200px)] py-[60px] pb-[70px] max-[1100px]:w-[calc(100%_-_64px)] max-[1100px]:max-w-[900px] max-[1100px]:grid-cols-1 max-[1100px]:gap-11 max-[1100px]:pt-[38px] max-[620px]:w-[calc(100%_-_36px)] max-[620px]:gap-[34px] max-[620px]:py-6 max-[620px]:pb-[42px]"
      >
        <div className="relative min-w-0">
          <BidderControls
            bidderId={myId}
            onChangeEmail={onChangeEmail}
            onReset={onReset}
            isResetting={isResetting}
            resetError={resetError}
          />
          <PlayerDetails itemName={auction.itemName} activeImage={activeImage} onImageChange={onImageChange} />
        </div>

        <section className="relative min-w-0">
          <AuctionItemHeading itemName={auction.itemName} />

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
            now={now}
          />

          <CausesList />
          <Separator className="my-7 h-[3px] bg-[#d9d9d9]" />
          <LatestBids bids={bids} myId={myId} />
        </section>
      </main>
    </>
  );
}
