import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const styles = {
  form: 'flex w-full max-w-[380px] flex-col gap-[14px] text-center',
  title: 'm-0 text-[2.4rem] leading-[1.1] font-black text-ink uppercase',
  description: 'mb-1.5 text-base leading-[1.35] font-semibold text-slate-strong',
  emailInput:
    'h-auto w-full rounded-[14px] border-2 border-line-input bg-white px-5 py-3 text-center text-[1.2rem] font-bold text-ink shadow-none outline-none placeholder:text-grey-faint focus-visible:border-ink focus-visible:ring-0',
  submit:
    'h-auto cursor-pointer rounded-2xl border-0 bg-ink p-3 text-[1.2rem] font-extrabold text-white transition-[transform,opacity] duration-150 hover:bg-ink hover:opacity-[0.88] active:scale-[0.98]',
};

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
      <form className={styles.form} onSubmit={onSubmit}>
        <h1 className={styles.title}>Join the auction</h1>
        <p className={styles.description}>Enter your email to place bids and receive the payment link if you win.</p>
        <Input
          className={styles.emailInput}
          type="email"
          required
          autoFocus
          value={emailInput}
          onChange={(event) => onEmailInputChange(event.target.value)}
          placeholder="you@example.com"
        />
        <Button type="submit" className={styles.submit}>
          CONTINUE
        </Button>
      </form>
    </main>
  );
}
