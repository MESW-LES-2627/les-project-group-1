import { formatEuro } from '../auction/utils';
import type { Charity } from '../charities/data';

interface CharityCardProps {
  charity: Charity;
}

export function CharityCard({ charity }: CharityCardProps) {
  const initial = charity.name.charAt(0).toUpperCase();

  return (
    <article className="flex flex-col rounded-[22px] border-2 border-ink-strong p-6">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink-strong text-2xl font-black text-white"
        >
          {initial}
        </span>
        <div>
          <h2 className="text-xl leading-tight font-black text-ink-strong uppercase">{charity.name}</h2>
          <p className="text-sm font-bold text-ink-soft uppercase">{charity.cause}</p>
        </div>
      </div>

      <p className="mt-4 flex-1 text-lg font-medium">{charity.description}</p>

      <dl className="mt-6 flex justify-between border-t-2 border-ink-line pt-4">
        <div>
          <dt className="text-sm font-bold text-ink-soft uppercase">Raised</dt>
          <dd className="text-xl font-black text-ink-strong">{formatEuro(charity.raised)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-sm font-bold text-ink-soft uppercase">Auctions</dt>
          <dd className="text-xl font-black text-ink-strong">{charity.auctions}</dd>
        </div>
      </dl>
    </article>
  );
}