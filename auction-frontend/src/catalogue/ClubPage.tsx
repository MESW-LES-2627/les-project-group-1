import { Link, useParams } from 'react-router-dom';
import AuctionApp from '@/auction/AuctionApp';
import { ListingGrid } from '@/components/ListingGrid';
import { Navbar } from '@/components/Navbar';
import { useApi } from './api';
import type { ClubDetail } from './types';

/**
 * ClubPage
 *
 * Public club page (/club/:slug). Shows the club profile and the verified items it offers.
 */

const styles = {
  main: 'mx-auto w-[calc(100%_-_112px)] max-w-[1888px] py-[60px] pb-[70px] max-tablet:w-[calc(100%_-_64px)] max-mobile:w-[calc(100%_-_36px)] max-mobile:py-6',
  header: 'mb-9 flex items-center gap-7 max-mobile:flex-col max-mobile:items-start max-mobile:gap-4',
  logo: 'flex size-[clamp(96px,10vw,144px)] shrink-0 items-center justify-center',
  logoImage: 'h-full w-full object-contain',
  logoFallback: 'text-[clamp(1.5rem,2vw,2.1rem)] leading-none font-extrabold tracking-[-0.04em] text-ink-strong',
  title: 'm-0 text-[clamp(2rem,3.2vw,3.4rem)] leading-none font-extrabold tracking-[-0.055em] text-ink-strong uppercase',
  description: 'mt-3 max-w-[760px] text-[clamp(1rem,1.15vw,1.3rem)] font-medium text-slate',
  section: 'mb-5 text-[clamp(1.5rem,2vw,2.2rem)] font-extrabold tracking-[-0.04em]',
};

export function ClubPage() {
  const { slug } = useParams();
  const { data: club, loading, error } = useApi<ClubDetail>(`/api/clubs/${slug}`);
  const initials = (club?.name ?? '')
    .replace(/[()]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  // Rendered inside AuctionApp so the login and register screens work on this page too.
  return (
    <AuctionApp
      renderPage={(account) => (
        <>
          <Navbar {...account} />
          <main className={styles.main}>
            {loading && <p className="font-medium text-slate">Loading…</p>}
            {(error || (!loading && !club)) && (
              <>
                <p role="alert" className="mb-3 font-bold text-danger">{error || 'Club not found'}</p>
                <Link className="text-link underline" to="/">Back to the catalogue</Link>
              </>
            )}
            {club && (
              <>
                <div className={styles.header}>
                  <div className={styles.logo}>
                    {club.logoUrl ? (
                      <img className={styles.logoImage} src={club.logoUrl} alt={`${club.name} logo`} />
                    ) : (
                      <span className={styles.logoFallback} aria-hidden="true">{initials}</span>
                    )}
                  </div>
                  <div>
                    <h1 className={styles.title}>{club.name}</h1>
                    <p className={styles.description}>{club.description}</p>
                  </div>
                </div>
                <h2 className={styles.section}>Items offered</h2>
                <ListingGrid listings={club.listings} />
              </>
            )}
          </main>
        </>
      )}
    />
  );
}