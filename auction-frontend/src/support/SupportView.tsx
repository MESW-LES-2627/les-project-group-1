import type { AccountNav } from '../auction/types';
import { Navbar } from '../components/Navbar';
import { CONTACT_EMAIL, CONTACT_HOURS, FAQS } from './data';

const styles = {
  main: 'mx-auto w-[calc(100%_-_112px)] max-w-[1888px] py-[60px] pb-[70px] max-tablet:w-[calc(100%_-_64px)] max-mobile:w-[calc(100%_-_36px)] max-mobile:py-6',
  title: 'm-0 text-[clamp(2rem,3.2vw,3.4rem)] leading-none font-extrabold tracking-[-0.055em] text-ink-strong uppercase',
  subtitle: 'mt-3 mb-9 text-[clamp(1rem,1.15vw,1.3rem)] font-medium text-slate',
  section: 'mt-14 border-t-4 border-ink-line pt-8',
  heading: 'mb-6 text-2xl font-black text-ink-strong uppercase',
  list: 'm-0 flex max-w-[900px] list-none flex-col gap-4 p-0',
  item: 'group rounded-[22px] border-2 border-ink-strong px-6 py-4',
  question:
    'flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black text-ink-strong [&::-webkit-details-marker]:hidden',
  icon: 'text-3xl leading-none transition-transform group-open:rotate-45',
  answer: 'mt-3 text-lg font-medium',
  contact: 'max-w-[900px] rounded-[22px] border-2 border-ink-strong p-6',
  contactText: 'text-lg font-medium',
  link: 'font-bold text-link underline',
};

export function SupportView({ account }: { account: AccountNav }) {
  return (
    <>
      <Navbar {...account} />

      <main className={styles.main}>
        <h1 className={styles.title}>Support</h1>
        <p className={styles.subtitle}>Answers to the most common questions, and how to reach us.</p>

        <section>
          <h2 className={styles.heading}>Frequently asked questions</h2>
          <ul aria-label="Frequently asked questions" className={styles.list}>
            {FAQS.map((faq) => (
              <li key={faq.question}>
                <details className={styles.item}>
                  <summary className={styles.question}>
                    {faq.question}
                    <span aria-hidden="true" className={styles.icon}>
                      +
                    </span>
                  </summary>
                  <p className={styles.answer}>{faq.answer}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Still need help?</h2>
          <div className={styles.contact}>
            <p className={styles.contactText}>
              Write to us at{' '}
              <a className={styles.link} href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <p className={`${styles.contactText} mt-2 text-ink-soft`}>{CONTACT_HOURS}</p>
          </div>
        </section>
      </main>
    </>
  );
}