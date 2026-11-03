import { ITEM } from '../auction/data';

//Displays the list of chariable causes supported by this auction
export function CausesList() {
  return (
    <section className="mt-8 max-[620px]:mt-7">
      <h2 className="mb-[22px] text-[clamp(1.9rem,2.35vw,2.8rem)] font-extrabold tracking-[-0.04em]">Supported cause</h2>
      <ul className="m-0 flex list-none flex-col gap-7 p-0 max-[620px]:gap-5">
        {ITEM.causes.map((cause) => (
          <li key={cause.name} className="flex items-center gap-6 max-[620px]:items-start max-[620px]:gap-[14px]">
            <div className="flex size-[clamp(82px,8vw,112px)] shrink-0 items-center justify-center max-[620px]:size-[72px]">
              <img src={cause.logo} alt="" />
            </div>
            <div>
              <h3 className="mb-[3px] text-[clamp(1.2rem,1.7vw,2rem)] font-bold tracking-[-0.03em] max-[620px]:text-[1.1rem]">{cause.name}</h3>
              <p className="m-0 max-w-[760px] text-[clamp(1rem,1.45vw,1.65rem)] leading-[1.2] font-normal max-[620px]:text-[0.9rem]">{cause.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
