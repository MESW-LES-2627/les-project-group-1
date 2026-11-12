import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatEuroSuffix, formatTimeLeft } from '@/auction/utils';
import type { ListingSummary } from '@/catalogue/types';

const styles = {
  card: 'group overflow-hidden rounded-[22px] border border-line bg-card shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_10px_32px_rgba(0,0,0,0.14)]',
  media: 'relative block aspect-[3/4] bg-auction-bg p-5',
  tags: 'absolute top-4 left-4 z-10 flex flex-wrap gap-2',
  tag: 'h-auto rounded-full border-0 px-3 py-1 text-sm font-bold text-white italic',
  image: 'h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]',
  body: 'flex flex-col gap-1 p-5',
  title: 'm-0 text-[1.25rem] leading-tight font-extrabold tracking-[-0.03em]',
  titleLink: 'text-ink-strong no-underline hover:underline',
  meta: 'text-[0.95rem] font-medium text-slate no-underline hover:underline',
  priceRow: 'mt-3 flex items-end justify-between gap-3',
  price: 'text-[1.75rem] leading-none font-extrabold tracking-[-0.04em]',
  bid: 'flex flex-col text-right text-xs font-bold',
};

/**
 * ListingCard Component
 *
 * Card shown in the catalogue grid: tags, image, name, club, competition, match and
 * season, current bid and time left. Links to the item page and to the club page.
 */

interface ListingCardProps {
  listing: ListingSummary;
  now: number;
}

export function ListingCard({ listing, now }: ListingCardProps) {
  const competition = [listing.competition, listing.season].filter(Boolean).join(' ');
  const hasAuction = listing.currentBid !== null && listing.auctionEndsAt !== null;
  const msLeft = listing.auctionEndsAt ? new Date(listing.auctionEndsAt).getTime() - now : 0;

  return (
    <article className={styles.card}>
      <Link to={`/auction/${listing.id}`} className={styles.media}>
        <div className={styles.tags}>
          {listing.tags.map((tag) => (
            <Badge key={tag} variant="outline" className={cn(styles.tag, tag.toLowerCase() === 'worn' ? 'bg-teal' : 'bg-magenta')}>
              {tag}
            </Badge>
          ))}
        </div>
        <img className={styles.image} src={listing.images[0]} alt={listing.title} />
      </Link>

      <div className={styles.body}>
        <h2 className={styles.title}>
          <Link to={`/auction/${listing.id}`} className={styles.titleLink}>
            {listing.title}
          </Link>
        </h2>
        <Link to={`/club/${listing.club.slug}`} className={styles.meta}>
          {listing.club.name}
        </Link>
        <p className={cn(styles.meta, 'm-0')}>{competition}</p>
        {listing.match && <p className={cn(styles.meta, 'm-0')}>{listing.match}</p>}

        {hasAuction && (
          <div className={styles.priceRow}>
            <span className={styles.price}>{formatEuroSuffix(listing.currentBid!)}</span>
            <div className={styles.bid}>
              <span className="text-slate">current bid</span>
              <span className="text-live">{formatTimeLeft(msLeft)}</span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}