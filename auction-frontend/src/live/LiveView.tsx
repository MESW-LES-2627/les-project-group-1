import { useState } from 'react';
import type { AccountNav } from '../auction/types';
import { useApi } from '../catalogue/api';
import type { Category, ListingSummary } from '../catalogue/types';
import { useNow } from '../catalogue/useNow';
import { CategoryFilter } from '../components/CategoryFilter';
import { ListingGrid } from '../components/ListingGrid';
import { Navbar } from '../components/Navbar';

const styles = {
  main: 'mx-auto w-[calc(100%_-_112px)] max-w-[1888px] py-[60px] pb-[70px] max-tablet:w-[calc(100%_-_64px)] max-mobile:w-[calc(100%_-_36px)] max-mobile:py-6',
  title: 'm-0 text-[clamp(2rem,3.2vw,3.4rem)] leading-none font-extrabold tracking-[-0.055em] text-ink-strong uppercase',
  subtitle: 'mt-3 mb-9 text-[clamp(1rem,1.15vw,1.3rem)] font-medium text-slate',
};

function endTime(listing: ListingSummary): number {
  return new Date(listing.auctionEndsAt as string).getTime();
}

export function LiveView({ account }: { account: AccountNav }) {
  const [category, setCategory] = useState('');
  const now = useNow();

  const params = new URLSearchParams();
  if (category) params.set('category', category);
  const query = params.toString();

  const categories = useApi<Category[]>('/api/categories');
  const listings = useApi<ListingSummary[]>(`/api/listings${query ? `?${query}` : ''}`);

  const live = (listings.data ?? [])
    .filter((listing) => listing.auctionEndsAt !== null && endTime(listing) > now)
    .sort((a, b) => endTime(a) - endTime(b));

  return (
    <>
      <Navbar {...account} />

      <main className={styles.main}>
        <h1 className={styles.title}>Now live</h1>
        <p className={styles.subtitle}>Auctions open for bidding right now, the ones ending first come first.</p>

        <CategoryFilter categories={categories.data ?? []} activeCategory={category} onCategoryChange={setCategory} />

        {listings.error && <p role="alert" className="font-bold text-danger">{listings.error}</p>}
        {!listings.data && listings.loading && <p className="font-medium text-slate">Loading…</p>}
        {listings.data && live.length === 0 && (
          <p className="text-lg font-medium text-slate">No auctions are live right now.</p>
        )}
        {listings.data && live.length > 0 && <ListingGrid listings={live} />}
      </main>
    </>
  );
}