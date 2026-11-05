import { formatEuro } from '../auction/utils';
import type { Charity } from '../charities/data';

interface CharityCardProps {
  charity: Charity;
}

export function CharityCard({ charity }: CharityCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[22px] border-2 border-ink-strong">
      <img
        className="aspect-[16/10] w-full border-b-2 border-ink-strong object-cover"
        src={charity.image}
        alt={`${charity.name} photo`}
        loading="lazy"
      />

      <div className="flex flex-1 flex-col p-6">
        <h2 className="text-xl leading-tight font-black text-ink-strong uppercase">{charity.name}</h2>
        <p className="text-sm font-bold text-ink-soft uppercase">{charity.cause}</p>

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
      </div>
    </article>
  );
}