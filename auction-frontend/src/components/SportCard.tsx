import type { Sport } from '../sports/data';

interface SportCardProps {
  sport: Sport;
}

export function SportCard({ sport }: SportCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[22px] border-2 border-ink-strong">
      <img
        className="aspect-[16/10] w-full border-b-2 border-ink-strong object-cover"
        src={sport.image}
        alt={`${sport.name} image`}
        loading="lazy"
      />

      <div className="flex flex-1 flex-col p-6">
        <h2 className="text-xl leading-tight font-black text-ink-strong uppercase">{sport.name}</h2>

        <p className="mt-3 flex-1 text-lg font-medium">{sport.description}</p>

        <dl className="mt-6 flex justify-between border-t-2 border-ink-line pt-4">
          <div>
            <dt className="text-sm font-bold text-ink-soft uppercase">Items</dt>
            <dd className="text-xl font-black text-ink-strong">{sport.items}</dd>
          </div>
          <div className="text-right">
            <dt className="text-sm font-bold text-ink-soft uppercase">Live now</dt>
            <dd className="text-xl font-black text-ink-strong">{sport.liveAuctions}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}