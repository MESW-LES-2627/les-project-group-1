import { Link, useParams } from 'react-router-dom';
import AuctionApp from '@/auction/AuctionApp';
import { ItemContext } from '@/auction/ItemContext';
import type { AuctionItem } from '@/auction/types';
import { AuthenticityCard } from '@/components/AuthenticityCard';
import { useApi } from './api';
import type { ListingDetail } from './types';

/**
 * ItemPage
 *
 * Item detail page (/auction/:id). Renders the existing live auction page (bids,
 * countdown, winner and payment) for the auction of this item, with the listing data
 * passed through the item context. Below it, adds the item description and the
 * authenticity evidence with the digital certificate.
 */

const styles = {
  details: 'mx-auto w-[calc(100%_-_112px)] max-w-[1888px] pb-[70px] max-tablet:w-[calc(100%_-_64px)] max-mobile:w-[calc(100%_-_36px)]',
  title: 'mb-[14px] text-[clamp(1.9rem,2.35vw,2.8rem)] font-extrabold tracking-[-0.04em]',
  text: 'm-0 max-w-[760px] text-[clamp(1rem,1.3vw,1.4rem)] leading-[1.3] font-normal',
};

export function ItemPage() {
  const { id } = useParams();
  const { data: listing, loading, error } = useApi<ListingDetail>(`/api/listings/${id}`);

  if (loading) return <div className="p-8">Loading…</div>;
  if (error || !listing) {
    return (
      <main className="p-8">
        <p role="alert" className="mb-3 font-bold text-danger">{error || 'Item not found'}</p>
        <Link className="text-link underline" to="/">Back to the catalogue</Link>
      </main>
    );
  }

  const competition = [listing.competition, listing.match, listing.season].filter(Boolean).join(' · ');

  // Data of this item for the existing auction page components.
  // Causes stay empty until charities are linked to auctions (Sprint 2).
  const item: AuctionItem = {
    subtitle: [listing.club.name, competition].filter(Boolean).join(' · '),
    tags: listing.tags,
    images: listing.images,
    player: listing.player,
    club: { name: listing.club.name, logoUrl: listing.club.logoUrl },
    causes: [],
  };

  return (
    <ItemContext.Provider value={item}>
      <AuctionApp auctionId={String(listing.id)}>
        <section className={styles.details}>
          <h2 className={styles.title}>About this item</h2>
          <p className={styles.text}>{listing.description}</p>
          <AuthenticityCard listing={listing} />
        </section>
      </AuctionApp>
    </ItemContext.Provider>
  );
}