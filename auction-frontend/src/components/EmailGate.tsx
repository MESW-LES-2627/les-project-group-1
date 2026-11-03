import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * EmailGate Component
 * 
 * Inicial screen for collectinf user's email before entering the auction.
 */
interface EmailGateProps {
  emailInput: string;
  onEmailInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function EmailGate({ emailInput, onEmailInputChange, onSubmit }: EmailGateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form className="flex w-full max-w-[380px] flex-col gap-[14px] text-center" onSubmit={onSubmit}>
        <h1 className="m-0 text-[2.4rem] leading-[1.1] font-black text-ink uppercase">Join the auction</h1>
        <p className="mb-1.5 text-base leading-[1.35] font-semibold text-[#555]">Enter your email to place bids and receive the payment link if you win.</p>
        <Input
          className="h-auto w-full rounded-[14px] border-2 border-[#c4c4c4] bg-white px-5 py-3 text-center text-[1.2rem] font-bold text-ink shadow-none outline-none placeholder:text-[#aaa] focus-visible:border-ink focus-visible:ring-0"
          type="email"
          required
          autoFocus
          value={emailInput}
          onChange={(event) => onEmailInputChange(event.target.value)}
          placeholder="you@example.com"
        />
        <Button type="submit" className="h-auto cursor-pointer rounded-2xl border-0 bg-ink p-3 text-[1.2rem] font-extrabold text-white transition-[transform,opacity] duration-150 hover:bg-ink hover:opacity-[0.88] active:scale-[0.98]">
          CONTINUE
        </Button>
      </form>
    </main>
  );
}
