import { shortId } from '../auction/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const styles = {
  wrapper:
    'absolute -top-[46px] left-1/2 z-10 w-max -translate-x-1/2 max-tablet:relative max-tablet:top-auto max-tablet:left-auto max-tablet:w-full max-tablet:translate-x-0',
  bar: 'mx-auto inline-flex items-center gap-[9px] rounded-full bg-white px-[15px] py-2 text-[0.95rem] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] max-mobile:gap-1.5 max-mobile:px-[10px] max-mobile:py-[7px] max-mobile:text-[0.78rem]',
  emailButton: 'h-auto p-0 font-bold text-inherit underline',
  resetButton: 'ml-1 h-auto rounded-full border-grey-soft bg-transparent px-2 py-0.5 text-xs font-bold text-slate-strong hover:bg-surface-alt',
};

interface BidderControlsProps {
  bidderId: string;
  onChangeEmail: () => void;
  onReset: () => void;
  isResetting: boolean;
  resetError: string;
  className?: string;
}

// Temporary demo reset bar
export function BidderControls({
  bidderId,
  onChangeEmail,
  onReset,
  isResetting,
  resetError,
  className,
}: BidderControlsProps) {
  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.bar}>
        <span className="size-[9px] rounded-full bg-online" />
        You are bidder <strong className="font-extrabold">{shortId(bidderId)}</strong>
        <Button type="button" variant="link" className={styles.emailButton} onClick={onChangeEmail}>
          change email
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className={styles.resetButton}
          onClick={onReset}
          disabled={isResetting}
          aria-label="Reset auction"
          title="Reset auction for demo"
        >
          {isResetting ? 'Resetting…' : 'Reset'}
        </Button>
      </div>
      {resetError && <p role="alert" className="mt-2 text-center text-sm font-bold text-red-700">{resetError}</p>}
    </div>
  );
}
