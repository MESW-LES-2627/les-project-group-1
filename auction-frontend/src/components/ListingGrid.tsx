import type { ListingSummary } from '@/catalogue/types';
import { useNow } from '@/catalogue/useNow';
import { ListingCard } from './ListingCard';

/**
 * ListingGrid Component
 *
 * Responsive grid of listing cards, with an empty state when there are no results.
 */

interface ListingGridProps {
  listings: ListingSummary[];
}

export function ListingGrid({ listings }: ListingGridProps) {
  const now = useNow();

  if (listings.length === 0) {
    return <p className="text-lg font-medium text-slate">No items found.</p>;
  }

  return (
    <div className="grid grid-cols-4 gap-7 max-wide:grid-cols-3 max-tablet:grid-cols-2 max-mobile:grid-cols-1">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} now={now} />
      ))}
    </div>
  );
}