import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuctionApp from '@/auction/AuctionApp';
import type { AccountNav } from '@/auction/types';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ListingGrid } from '@/components/ListingGrid';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
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
  header: 'flex items-start justify-between gap-6 max-mobile:flex-col max-mobile:gap-0',
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
        <div className="relative mb-10 hidden sm:block">
          <img
            src="/images/hero.svg"
            alt="Assist Club memorabilia"
            className="h-auto w-full rounded-[22px] object-cover"
          />

          <div className="pointer-events-none absolute inset-0 [container-type:inline-size]">
            <div className="pointer-events-auto absolute top-[58%] left-1/2 flex w-[28cqw] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[0.65cqw] text-center text-white">
              <div className="flex items-center justify-center gap-[1.1cqw]">
                <img
                  src="/images/clubs/sc-farense.svg"
                  alt="SC Farense"
                  className="h-[6.6cqw] w-auto"
                />
                <img
                  src="/images/clubs/santos-fc.svg"
                  alt="Santos FC"
                  className="h-[6.6cqw] w-auto"
                />
              </div>

              <p className="m-0 text-[1.65cqw] leading-[1.06] font-black uppercase">
                Assist Club
                <br />
                Premium Partners
              </p>

              <div className="flex items-center justify-center gap-[0.55cqw]">
                <Link
                  to="/club/sc-farense"
                  className="rounded-full bg-white px-[0.8cqw] py-[0.3cqw] text-[0.62cqw] font-black whitespace-nowrap text-black uppercase"
                >
                  Shop SC Farense
                </Link>
                <Link
                  to="/club/santos-fc"
                  className="rounded-full bg-white px-[0.8cqw] py-[0.3cqw] text-[0.62cqw] font-black whitespace-nowrap text-black uppercase"
                >
                  Shop Santos FC
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Memorabilia</h1>
            <p className={styles.subtitle}>Verified sports memorabilia, with part of every sale going to charity.</p>
          </div>
          {account.isLoggedIn && account.role === 'CLUB' && (
            <Button asChild variant="solid" size="form">
              <Link to="/listings/new">+ NEW AUCTION</Link>
            </Button>
          )}
        </div>

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