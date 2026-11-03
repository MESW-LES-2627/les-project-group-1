import { shortId } from '../auction/utils';
import { Button } from '@/components/ui/button';

interface BidderControlsProps {
  bidderId: string;
  onChangeEmail: () => void;
  onReset: () => void;
  isResetting: boolean;
  resetError: string;
}

export function BidderControls({ bidderId, onChangeEmail, onReset, isResetting, resetError }: BidderControlsProps) {
  return (
    <div className="absolute -top-[46px] left-1/2 z-10 w-max -translate-x-1/2 max-[1100px]:relative max-[1100px]:top-auto max-[1100px]:left-auto max-[1100px]:mb-4 max-[1100px]:w-full max-[1100px]:translate-x-0">
      <div className="mx-auto inline-flex items-center gap-[9px] rounded-full bg-white px-[15px] py-2 text-[0.95rem] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] max-[620px]:gap-1.5 max-[620px]:px-[10px] max-[620px]:py-[7px] max-[620px]:text-[0.78rem]">
        <span className="size-[9px] rounded-full bg-[#2e9d57]" />
        You are bidder <strong className="font-extrabold">{shortId(bidderId)}</strong>
        <Button type="button" variant="link" className="h-auto p-0 font-bold text-inherit underline" onClick={onChangeEmail}>
          change email
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="ml-1 h-auto rounded-full border-[#bbb] bg-transparent px-2 py-0.5 text-xs font-bold text-[#555] hover:bg-[#f0f0f0]"
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
