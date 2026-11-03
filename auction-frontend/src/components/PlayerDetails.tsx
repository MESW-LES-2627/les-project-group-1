import { ITEM } from '../auction/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * PlayerDetails Component
 * 
 * Displays the visual gallery and athlete biography for the auctioned item.
 */

interface PlayerDetailsProps {
  itemName: string;
  activeImage: number;
  onImageChange: (index: number) => void;
}

export function PlayerDetails({ itemName, activeImage, onImageChange }: PlayerDetailsProps) {
  const { player } = ITEM;

  return (
    <section>
      <Card className="h-[clamp(420px,32.6vw,652px)] flex-row gap-0 rounded-[7px] bg-[#f4f4f4] p-0 shadow-[4px_6px_8px_rgba(0,0,0,0.25)] ring-0 max-[1100px]:h-[min(78vw,650px)] max-[620px]:h-[min(112vw,520px)] max-[620px]:rounded-2xl">
        <div className="flex basis-[30%] flex-col gap-[13%] border-r-[6px] border-[#dedede] px-[3.2%] py-[26px] max-[1100px]:basis-1/4 max-[1100px]:gap-[10%] max-[1100px]:px-[3%] max-[1100px]:py-[22px] max-[620px]:basis-[24%] max-[620px]:gap-[12%] max-[620px]:border-r-[3px] max-[620px]:py-[14px]">
          {ITEM.images.map((src, index) => (
            <button
              key={src}
              type="button"
              className={`aspect-[0.68] w-full cursor-pointer overflow-hidden rounded-xl border-0 bg-[#dedede] p-[10px] max-[620px]:rounded-lg max-[620px]:p-[5px] ${index === activeImage ? 'outline-2 outline-offset-1 outline-[#c8c8c8]' : ''}`}
              onClick={() => onImageChange(index)}
              aria-label={`Show image ${index + 1}`}
            >
              <img className="block h-full w-full object-contain" src={src} alt="" />
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center p-[22px] max-[620px]:p-[10px]">
          <img className="block h-full w-full object-contain" src={ITEM.images[activeImage]} alt={itemName} />
        </div>
      </Card>

      <Card className="mt-12 gap-0 rounded-[7px] bg-[#f4f4f4] p-0 shadow-[4px_6px_8px_rgba(0,0,0,0.25)] ring-0 max-[620px]:mt-7">
        <CardHeader className="flex min-h-16 items-center justify-between gap-4 rounded-none bg-orange px-[22px] py-2 max-[620px]:min-h-[54px] max-[620px]:px-[14px]">
          <CardTitle className="text-[clamp(1.6rem,2.2vw,2.6rem)] font-extrabold text-[#080808]">{player.name}</CardTitle>
          <span className="text-[clamp(1rem,1.35vw,1.5rem)] font-bold text-[#51280b]">{player.nickname}</span>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-3 px-4 py-[14px] max-[620px]:gap-[7px] max-[620px]:px-[7px] max-[620px]:py-3">
          <Stat label="Age" value={String(player.age)} />
          <Stat label="Position" value={player.position} />
          <Stat label="Number" value={String(player.number)} />
          <Stat label="Size" value={player.size} />
        </CardContent>
        <CardContent className="grid grid-cols-3 gap-3 border-t-2 border-[#d9d9d9] px-4 py-[14px] max-[620px]:gap-[7px] max-[620px]:px-[7px] max-[620px]:py-3">
          <Stat label="Nationality" value={player.nationality} />
          <Stat label="Place of birth" value={player.placeOfBirth} />
          <Stat label="Preferred foot" value={player.preferredFoot} />
        </CardContent>
      </Card>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-[3px] text-center">
      <span className="text-[clamp(0.75rem,1.05vw,1.2rem)] font-bold text-[#666] capitalize max-[620px]:text-[0.68rem]">{label}</span>
      <strong className="text-[clamp(0.8rem,1.1vw,1.25rem)] font-extrabold capitalize max-[620px]:text-[0.75rem]">{value}</strong>
    </div>
  );
}
