import type { AccountNav } from '../auction/types';
import { Navbar } from '../components/Navbar';
import { MISSION, STEPS, VALUES } from './data';

const styles = {
  main: 'mx-auto w-[calc(100%_-_112px)] max-w-[1888px] py-[60px] pb-[70px] max-tablet:w-[calc(100%_-_64px)] max-mobile:w-[calc(100%_-_36px)] max-mobile:py-6',
  title: 'm-0 text-[clamp(2rem,3.2vw,3.4rem)] leading-none font-extrabold tracking-[-0.055em] text-ink-strong uppercase',
  subtitle: 'mt-3 mb-9 text-[clamp(1rem,1.15vw,1.3rem)] font-medium text-slate',
  section: 'mt-14 border-t-4 border-ink-line pt-8',
  heading: 'mb-6 text-2xl font-black text-ink-strong uppercase',
  mission: 'max-w-[900px] text-[clamp(1.1rem,1.3vw,1.5rem)] leading-relaxed font-medium',
  grid: 'grid grid-cols-3 gap-6 max-tablet:grid-cols-1',
  card: 'rounded-[22px] border-2 border-ink-strong p-6',
  cardTitle: 'text-xl font-black text-ink-strong uppercase',
  cardText: 'mt-2 text-lg font-medium',
  number: 'mb-4 flex size-12 items-center justify-center rounded-full bg-ink-strong text-xl font-black text-white',
};

export function AboutView({ account }: { account: AccountNav }) {
  return (
    <>
      <Navbar {...account} />

      <main className={styles.main}>
        <h1 className={styles.title}>About us</h1>
        <p className={styles.subtitle}>The auction house where every sale gives back.</p>

        <section className="max-w-[900px]">
          <h2 className={styles.heading}>Our mission</h2>
          <p className={styles.mission}>{MISSION}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>How it works</h2>
          <ol aria-label="How it works" className={styles.grid}>
            {STEPS.map((step, index) => (
              <li key={step.title} className={styles.card}>
                <span aria-hidden="true" className={styles.number}>
                  {index + 1}
                </span>
                <h3 className={styles.cardTitle}>{step.title}</h3>
                <p className={styles.cardText}>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>What we stand for</h2>
          <ul aria-label="What we stand for" className={styles.grid}>
            {VALUES.map((value) => (
              <li key={value.title} className={styles.card}>
                <h3 className={styles.cardTitle}>{value.title}</h3>
                <p className={styles.cardText}>{value.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}