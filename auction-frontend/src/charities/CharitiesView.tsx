import type { AccountNav } from '../auction/types';
import { useApi } from '../catalogue/api';
import { CharityCard } from '../components/CharityCard';
import { Navbar } from '../components/Navbar';
import type { Charity } from './data';

const styles = {
  main: 'mx-auto w-[calc(100%_-_112px)] max-w-[1888px] py-[60px] pb-[70px] max-tablet:w-[calc(100%_-_64px)] max-mobile:w-[calc(100%_-_36px)] max-mobile:py-6',
  title: 'm-0 text-[clamp(2rem,3.2vw,3.4rem)] leading-none font-extrabold tracking-[-0.055em] text-ink-strong uppercase',
  subtitle: 'mt-3 mb-9 text-[clamp(1rem,1.15vw,1.3rem)] font-medium text-slate',
  grid: 'grid grid-cols-3 gap-6 max-tablet:grid-cols-2 max-mobile:grid-cols-1',
};

export function CharitiesView({ account }: { account: AccountNav }) {
  const { data: charities, loading, error } = useApi<Charity[]>('/api/charities');
  const list = charities ?? [];
  const totalAuctions = list.reduce((sum, charity) => sum + charity.auctionCount, 0);

  return (
    <>
      <Navbar {...account} />

      <main className={styles.main}>
        <h1 className={styles.title}>Charities</h1>
        <p className={styles.subtitle}>
          {list.length} verified {list.length === 1 ? 'charity' : 'charities'} supported by our auctions
          {totalAuctions > 0 ? `, across ${totalAuctions} ${totalAuctions === 1 ? 'auction' : 'auctions'}` : ''}.
        </p>

        {loading && <p className="text-lg font-medium text-slate">Loading charities…</p>}
        {error && (
          <p role="alert" className="text-lg font-medium text-danger">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className={styles.grid}>
            {list.map((charity) => (
              <CharityCard key={charity.id} charity={charity} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}