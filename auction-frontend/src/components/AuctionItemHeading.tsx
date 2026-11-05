import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useItem } from '../auction/ItemContext';

const styles = {
  row: 'flex flex-wrap items-center gap-[14px] max-mobile:gap-2',
  title:
    'm-0 text-[clamp(2.8rem,4vw,4.5rem)] leading-none font-extrabold tracking-[-0.055em] text-ink-strong uppercase max-tablet:text-[clamp(2.8rem,7vw,4rem)] max-mobile:text-[clamp(2rem,10vw,3rem)]',
  tag: 'h-auto rounded-full border-0 px-[21px] py-3 text-[clamp(1.2rem,1.6vw,1.8rem)] font-bold text-white italic max-mobile:px-[13px] max-mobile:py-[7px] max-mobile:text-[1.1rem]',
  subtitle: 'mt-[7px] mb-[14px] ml-2 text-[clamp(1rem,1.15vw,1.4rem)] leading-[1.1] font-medium text-slate',
};

export function AuctionItemHeading({ itemName }: { itemName: string }) {
  const item = useItem();

  return (
    <>
      <div className={styles.row}>
        <h1 className={styles.title}>{itemName}</h1>
        {item.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={cn(styles.tag, tag.toLowerCase() === 'worn' ? 'bg-teal' : 'bg-magenta')}
          >
            {tag}
          </Badge>
        ))}
      </div>
      <p className={styles.subtitle}>{item.subtitle}</p>
    </>
  );
}
