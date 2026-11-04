import type { FormEventHandler } from 'react';
import type { AuctionState, WinnerData } from '../auction/types';
import { MIN_INCREMENT } from '../auction/data';
import { formatEuro, formatTimeLeft } from '../auction/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const styles = {
  winnerCard: 'gap-0 rounded-lg border border-success-border bg-success-bg px-7 py-6 text-success-text ring-0',
  winnerTitle: 'mb-2 text-[1.8rem] font-bold text-black',
  winnerText: 'my-1 text-[1.4rem] font-bold',
  panel:
    'min-h-[148px] flex-row items-center justify-between gap-6 rounded-xl bg-panel-strong px-[30px] py-5 ring-0 max-mobile:min-h-0 max-mobile:flex-col max-mobile:items-stretch max-mobile:gap-5 max-mobile:p-5',
  currentBid: 'text-[clamp(1.7rem,2.3vw,2.8rem)] leading-[1.1] font-bold text-ink-mid',
  price: 'mt-[15px] text-[clamp(2.6rem,3.3vw,4rem)] leading-none font-extrabold max-mobile:mt-[7px]',
  form: 'flex w-[min(31%,260px)] shrink-0 flex-col gap-3 max-mobile:w-full',
  input:
    'h-auto w-full rounded-[20px] border-[1.5px] border-grey bg-white px-[18px] py-[13px] text-center text-[1.4rem] font-bold text-ink shadow-none outline-none placeholder:text-grey-mid focus-visible:border-ink focus-visible:ring-0 disabled:cursor-not-allowed disabled:bg-surface-muted',
  submit:
    'h-auto cursor-pointer rounded-[20px] border-0 bg-ink-strong px-3 py-[14px] text-[clamp(1rem,1.25vw,1.45rem)] font-bold text-white transition-[opacity,transform] duration-150 hover:bg-ink-strong hover:opacity-[0.88] active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-40',
  error: 'mt-[10px] font-bold text-danger',
  meta: 'flex justify-between px-[18px] pt-2 text-[clamp(1.15rem,1.5vw,1.7rem)] font-semibold max-mobile:px-2 max-mobile:text-[1.05rem]',
};

// Props for the active and completed auction states.
interface BidPanelProps {
  auction: AuctionState;
  bidCount: number;
  winnerData: WinnerData | null;
  paymentUrl: string;
  bidAmount: string;
  onBidAmountChange: (value: string) => void;
  onBid: FormEventHandler<HTMLFormElement>;
  error: string;
  myId: string;
  now: number;
}

// Renders the shadcn bid card, with the current amount, bid form, and countdown.
export function BidPanel({
  auction,
  bidCount,
  winnerData,
  paymentUrl,
  bidAmount,
  onBidAmountChange,
  onBid,
  error,
  myId,
  now,
}: BidPanelProps) {
  // Keep the completed-auction result in the same card-based visual language.
  if (winnerData) {
    return (
      <Card className={styles.winnerCard}>
        <h2 className={styles.winnerTitle}>Auction ended!</h2>
        <p className={styles.winnerText}>
          Winner:{' '}
          <strong>
            {winnerData.winner === myId ? 'You!' : winnerData.winner ? winnerData.winner : 'No one'}
          </strong>
        </p>
        <p className={styles.winnerText}>
          Winning bid: <strong>{formatEuro(winnerData.winningBid)}</strong>
        </p>
        {paymentUrl && (
          <p className={styles.winnerText}>
            <a href={paymentUrl}>Pay now</a>
          </p>
        )}
      </Card>
    );
  }

  // Derive the next allowed bid and urgency state from the live auction clock.
  const minBid = auction.currentBid + MIN_INCREMENT;
  const msLeft = auction.endTime - now;
  const ended = !auction.isActive || msLeft <= 0;
  const urgent = !ended && msLeft <= 10 * 60 * 1000;

  return (
    <>
      <Card className={styles.panel}>
        <div>
          <div className={styles.currentBid}>Current bid</div>
          <div className={styles.price}>{formatEuro(auction.currentBid)}</div>
        </div>
        <form className={styles.form} onSubmit={onBid}>
          <Input
            className={styles.input}
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
            className={styles.submit}
            disabled={ended}
          >
            {ended ? 'BIDDING CLOSED' : 'PLACE BID'}
          </Button>
        </form>
      </Card>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.meta}>
        <span>
          {bidCount} bid{bidCount === 1 ? '' : 's'}
        </span>
        <span className={urgent ? 'text-danger-strong' : 'text-danger-deep'}>{formatTimeLeft(msLeft)}</span>
      </div>
      <p className="mt-2 mr-[14px] ml-[14px] font-bold text-[#555]">
        {auction.highestBidder === myId
          ? "You're the highest bidder!"
          : auction.highestBidder
            ? `Highest bidder: ${auction.highestBidder}`
            : 'No bids yet — be the first!'}
      </p>
    </>
  );
}
