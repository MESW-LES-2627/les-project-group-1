import { useEffect, useState } from 'react';
import AuctionApp from '@/auction/AuctionApp';
import type { AccountNav } from '@/auction/types';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ListingGrid } from '@/components/ListingGrid';
import { Navbar } from '@/components/Navbar';
import { useApi } from './api';
import type { Category, ListingSummary } from './types';

/**
 * CataloguePage
 *
 * Home page (/). Public memorabilia catalogue with verified listings only.
 * The search box in the navigation bar (item, club or player name) and the
 * category buttons are handled by the backend.
 */

const SEARCH_DELAY_MS = 300;

const styles = {
  main: 'mx-auto w-[calc(100%_-_112px)] max-w-[1888px] py-[60px] pb-[70px] max-tablet:w-[calc(100%_-_64px)] max-mobile:w-[calc(100%_-_36px)] max-mobile:py-6',
  title: 'm-0 text-[clamp(2rem,3.2vw,3.4rem)] leading-none font-extrabold tracking-[-0.055em] text-ink-strong uppercase',
  subtitle: 'mt-3 mb-9 text-[clamp(1rem,1.15vw,1.3rem)] font-medium text-slate',
};

function CatalogueHome({ account }: { account: AccountNav }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');

  // Wait for the user to stop typing before querying the backend.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  const params = new URLSearchParams();
  if (debouncedSearch) params.set('search', debouncedSearch);
  if (category) params.set('category', category);
  const query = params.toString();

  const categories = useApi<Category[]>('/api/categories');
  const listings = useApi<ListingSummary[]>(`/api/listings${query ? `?${query}` : ''}`);

  return (
    <>
      <Navbar {...account} searchValue={search} onSearchChange={setSearch} />

      <main className={styles.main}>
        <h1 className={styles.title}>Memorabilia</h1>
        <p className={styles.subtitle}>Verified sports memorabilia, with part of every sale going to charity.</p>

        <CategoryFilter categories={categories.data ?? []} activeCategory={category} onCategoryChange={setCategory} />

        {listings.error && <p role="alert" className="font-bold text-danger">{listings.error}</p>}
        {!listings.data && listings.loading && <p className="font-medium text-slate">Loading…</p>}
        {listings.data && <ListingGrid listings={listings.data} />}
      </main>
    </>
  );
}

// Rendered inside AuctionApp so the login and register screens work on this page too.
export function CataloguePage() {
  return <AuctionApp renderPage={(account) => <CatalogueHome account={account} />} />;
}