import type { AccountNav } from '../auction/types';
import { Navbar } from '../components/Navbar';
import { SportCard } from '../components/SportCard';
import { SPORTS } from './data';

const styles = {
  main: 'mx-auto w-[calc(100%_-_112px)] max-w-[1888px] py-[60px] pb-[70px] max-tablet:w-[calc(100%_-_64px)] max-mobile:w-[calc(100%_-_36px)] max-mobile:py-6',
  title: 'm-0 text-[clamp(2rem,3.2vw,3.4rem)] leading-none font-extrabold tracking-[-0.055em] text-ink-strong uppercase',
  subtitle: 'mt-3 mb-9 text-[clamp(1rem,1.15vw,1.3rem)] font-medium text-slate',
  grid: 'grid grid-cols-3 gap-6 max-tablet:grid-cols-2 max-mobile:grid-cols-1',
};

export function SportsView({ account }: { account: AccountNav }) {
  const liveAuctions = SPORTS.reduce((sum, sport) => sum + sport.liveAuctions, 0);

  return (
    <>
      <Navbar {...account} />

      <main className={styles.main}>
        <h1 className={styles.title}>Sports</h1>
        <p className={styles.subtitle}>
          {SPORTS.length} sports and {liveAuctions} auctions live right now.
        </p>

        <div className={styles.grid}>
          {SPORTS.map((sport) => (
            <SportCard key={sport.slug} sport={sport} />
          ))}
        </div>
      </main>
    </>
  );
}