import { Badge } from '@/components/ui/badge';
import { ITEM } from '../auction/data';

export function AuctionItemHeading({ itemName }: { itemName: string }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-[14px] max-[620px]:gap-2">
        <h1 className="m-0 text-[clamp(2.8rem,4vw,4.5rem)] leading-none font-extrabold tracking-[-0.055em] text-[#050505] uppercase max-[1100px]:text-[clamp(2.8rem,7vw,4rem)] max-[620px]:text-[clamp(2rem,10vw,3rem)]">
          {itemName}
        </h1>
        {ITEM.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={`h-auto rounded-full border-0 px-[21px] py-3 text-[clamp(1.2rem,1.6vw,1.8rem)] font-bold text-white italic max-[620px]:px-[13px] max-[620px]:py-[7px] max-[620px]:text-[1.1rem] ${tag === 'Worn' ? 'bg-[#007d7d]' : 'bg-[#a50045]'}`}
          >
            {tag}
          </Badge>
        ))}
      </div>
      <p className="mt-[7px] mb-[14px] ml-2 text-[clamp(1rem,1.15vw,1.4rem)] leading-[1.1] font-medium text-[#666]">
        {ITEM.subtitle}
      </p>
    </>
  );
}
