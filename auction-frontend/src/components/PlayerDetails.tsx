import { ITEM } from '../auction/data';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * PlayerDetails components
 *
 * Splits the auctioned item into the visual gallery and the athlete profile so
 * each can be placed independently in the responsive layout.
 */

interface PlayerGalleryProps {
  itemName: string;
  activeImage: number;
  onImageChange: (index: number) => void;
  className?: string;
}

const styles = {
  gallery:
    'h-[clamp(420px,32.6vw,652px)] flex-row gap-0 rounded-[7px] bg-surface p-0 shadow-[4px_6px_8px_rgba(0,0,0,0.25)] ring-0 max-tablet:h-[min(78vw,650px)] max-mobile:h-[min(112vw,520px)] max-mobile:rounded-2xl',
  thumbnails:
    'flex basis-[30%] flex-col gap-[13%] border-r-[6px] border-line-strong px-[3.2%] py-[26px] max-tablet:basis-1/4 max-tablet:gap-[10%] max-tablet:px-[3%] max-tablet:py-[22px] max-mobile:basis-[24%] max-mobile:gap-[12%] max-mobile:border-r-[3px] max-mobile:py-[14px]',
  thumbnail:
    'aspect-[0.68] w-full cursor-pointer overflow-hidden rounded-xl border-0 bg-line-strong p-[10px] max-mobile:rounded-lg max-mobile:p-[5px]',
  selectedThumbnail: 'outline-2 outline-offset-1 outline-line-soft',
  mainImage: 'flex min-w-0 flex-1 items-center justify-center p-[22px] max-mobile:p-[10px]',
  profileCard:
    'mt-12 gap-0 rounded-[7px] bg-surface p-0 shadow-[4px_6px_8px_rgba(0,0,0,0.25)] ring-0 max-tablet:mt-0',
  profileHeader:
    'flex min-h-16 items-center justify-between gap-4 rounded-none bg-orange px-[22px] py-2 max-mobile:min-h-[54px] max-mobile:px-[14px]',
  profileName: 'text-[clamp(1.6rem,2.2vw,2.6rem)] font-extrabold text-ink-deep',
  nickname: 'text-[clamp(1rem,1.35vw,1.5rem)] font-bold text-brown',
  primaryStats: 'grid grid-cols-4 gap-3 px-4 py-[14px] max-mobile:gap-[7px] max-mobile:px-[7px] max-mobile:py-3',
  secondaryStats:
    'grid grid-cols-3 gap-3 border-t-2 border-panel-strong px-4 py-[14px] max-mobile:gap-[7px] max-mobile:px-[7px] max-mobile:py-3',
  statLabel: 'text-[clamp(0.75rem,1.05vw,1.2rem)] font-bold text-slate capitalize max-mobile:text-[0.68rem]',
  statValue: 'text-[clamp(0.8rem,1.1vw,1.25rem)] font-extrabold capitalize max-mobile:text-[0.75rem]',
};

export function PlayerGallery({ itemName, activeImage, onImageChange, className }: PlayerGalleryProps) {
  return (
    <Card className={cn(styles.gallery, className)}>
      <div className={styles.thumbnails}>
        {ITEM.images.map((src, index) => (
          <button
            key={src}
            type="button"
            className={cn(styles.thumbnail, index === activeImage && styles.selectedThumbnail)}
            onClick={() => onImageChange(index)}
            aria-label={`Show image ${index + 1}`}
          >
            <img className="block h-full w-full object-contain" src={src} alt="" />
          </button>
        ))}
      </div>
      <div className={styles.mainImage}>
        <img className="block h-full w-full object-contain" src={ITEM.images[activeImage]} alt={itemName} />
      </div>
    </Card>
  );
}

export function PlayerProfile({ className }: { className?: string }) {
  const { player } = ITEM;

  return (
    <Card className={cn(styles.profileCard, className)}>
      <CardHeader className={styles.profileHeader}>
        <CardTitle className={styles.profileName}>{player.name}</CardTitle>
        <span className={styles.nickname}>{player.nickname}</span>
      </CardHeader>
      <CardContent className={styles.primaryStats}>
        <Stat label="Age" value={String(player.age)} />
        <Stat label="Position" value={player.position} />
        <Stat label="Number" value={String(player.number)} />
        <Stat label="Size" value={player.size} />
      </CardContent>
      <CardContent className={styles.secondaryStats}>
        <Stat label="Nationality" value={player.nationality} />
        <Stat label="Place of birth" value={player.placeOfBirth} />
        <Stat label="Preferred foot" value={player.preferredFoot} />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-[3px] text-center">
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
    </div>
  );
}
