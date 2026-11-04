import type { FormEventHandler } from 'react';
import { Separator } from '@/components/ui/separator';
import { AuctionItemHeading } from '@/components/AuctionItemHeading';
import { BidderControls } from '@/components/BidderControls';
import { BidPanel } from '@/components/BidPanel';
import { CausesList } from '@/components/CausesList';
import { LatestBids } from '@/components/LatestBids';
import { Navbar } from '@/components/Navbar';
import { PlayerGallery, PlayerProfile } from '@/components/PlayerDetails';
import type { AuctionState, Bid, WinnerData } from './types';

const styles = {
  main:
    'mx-auto grid w-[calc(100%_-_112px)] max-w-[1888px] grid-cols-1 items-start gap-x-[clamp(60px,10vw,200px)] gap-y-0 py-[60px] pb-[70px] tablet:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] max-tablet:w-[calc(100%_-_64px)] max-tablet:max-w-[900px] max-tablet:gap-x-0 max-tablet:gap-y-11 max-tablet:pt-[38px] max-mobile:w-[calc(100%_-_36px)] max-mobile:gap-y-[34px] max-mobile:py-6 max-mobile:pb-[42px]',
  info: 'min-w-0 max-tablet:order-2 tablet:col-start-2 tablet:row-start-1',
  media: 'relative min-w-0 max-tablet:contents tablet:col-start-1 tablet:row-start-1 tablet:row-span-2',
  bids: 'min-w-0 max-tablet:order-5 tablet:col-start-2 tablet:row-start-2',
};

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

      <main id="top" className={styles.main}>
        <section className={styles.info}>
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
            myId={myId}
            now={now}
          />

          <CausesList />
          <Separator className="my-7 h-[3px] bg-panel-strong" />
        </section>

        <div className={styles.media}>
          <BidderControls
            bidderId={myId}
            onChangeEmail={onChangeEmail}
            onReset={onReset}
            isResetting={isResetting}
            resetError={resetError}
            className="max-tablet:order-3"
          />
          <PlayerGallery
            itemName={auction.itemName}
            activeImage={activeImage}
            onImageChange={onImageChange}
            className="max-tablet:order-1"
          />
          <PlayerProfile className="max-tablet:order-4" />
        </div>

        <div className={styles.bids}>
          <LatestBids bids={bids} myId={myId} />
        </div>
      </main>
    </>
  );
}
