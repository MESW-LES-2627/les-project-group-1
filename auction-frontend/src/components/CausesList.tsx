import { ITEM } from '../auction/data';

export function CausesList() {
  return (
    <>
      <h2 className="mt-7 mb-[14px] text-2xl font-extrabold text-[#0a0a0a]">Supported cause</h2>
      <ul className="m-0 flex list-none flex-col gap-6 p-0">
        {ITEM.causes.map((cause) => (
          <li key={cause.name} className="flex items-center gap-6 max-[960px]:gap-[14px]">
            <div className="size-28 shrink-0 rounded-[14px] bg-card p-[10px] max-[960px]:size-24">
              <img className="h-full w-full object-contain" src={cause.logo} alt="" />
            </div>
            <div>
              <h3 className="mb-1.5 text-[1.4rem] font-extrabold">{cause.name}</h3>
              <p className="max-w-[460px] text-[1.05rem] leading-[1.25] font-normal max-[960px]:text-[1.1rem]">{cause.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
