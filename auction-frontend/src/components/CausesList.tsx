import { ITEM } from '../auction/data';

const styles = {
  section: 'mt-8 max-mobile:mt-7',
  title: 'mb-[22px] text-[clamp(1.9rem,2.35vw,2.8rem)] font-extrabold tracking-[-0.04em]',
  list: 'm-0 flex list-none flex-col gap-7 p-0 max-mobile:gap-5',
  row: 'flex items-center gap-6 max-mobile:items-start max-mobile:gap-[14px]',
  logo: 'flex size-[clamp(82px,8vw,112px)] shrink-0 items-center justify-center max-mobile:size-[72px]',
  causeName: 'mb-[3px] text-[clamp(1.2rem,1.7vw,2rem)] font-bold tracking-[-0.03em] max-mobile:text-[1.1rem]',
  description: 'm-0 max-w-[760px] text-[clamp(1rem,1.45vw,1.65rem)] leading-[1.2] font-normal max-mobile:text-[0.9rem]',
};

//Displays the list of chariable causes supported by this auction
export function CausesList() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Supported cause</h2>
      <ul className={styles.list}>
        {ITEM.causes.map((cause) => (
          <li key={cause.name} className={styles.row}>
            <div className={styles.logo}>
              <img src={cause.logo} alt="" />
            </div>
            <div>
              <h3 className={styles.causeName}>{cause.name}</h3>
              <p className={styles.description}>{cause.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
