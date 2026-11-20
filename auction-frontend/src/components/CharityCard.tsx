import { flagEmoji } from '../auction/utils';
import { COUNTRIES } from '../lib/countries';
import type { Charity } from '../charities/data';

interface CharityCardProps {
  charity: Charity;
}

const countryName = (code: string) =>
  COUNTRIES.find((country) => country.code === code.toUpperCase())?.name ?? code;

export function CharityCard({ charity }: CharityCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[22px] border-2 border-ink-strong">
      {charity.logoUrl ? (
        <img
          className="aspect-[16/10] w-full border-b-2 border-ink-strong object-cover"
          src={charity.logoUrl}
          alt={`${charity.name} logo`}
          loading="lazy"
        />
      ) : (
        <div className="flex aspect-[16/10] w-full items-center justify-center border-b-2 border-ink-strong bg-surface text-4xl font-black text-ink-strong">
          {charity.name.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <h2 className="text-xl leading-tight font-black text-ink-strong uppercase">{charity.name}</h2>
        <p className="text-sm font-bold text-ink-soft uppercase">Verified charity</p>

        <p className="mt-4 flex-1 text-lg font-medium">{charity.description}</p>

        <dl className="mt-6 flex justify-between border-t-2 border-ink-line pt-4">
          <div>
            <dt className="text-sm font-bold text-ink-soft uppercase">Country</dt>
            <dd className="text-xl font-black text-ink-strong">
              {flagEmoji(charity.country)} {countryName(charity.country)}
            </dd>
          </div>
          <div className="text-right">
            <dt className="text-sm font-bold text-ink-soft uppercase">Auctions</dt>
            <dd className="text-xl font-black text-ink-strong">{charity.auctionCount}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
