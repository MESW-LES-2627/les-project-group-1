import { ITEM } from '../auction/data';

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
      <div className="flex min-h-[420px] overflow-hidden rounded-[28px] bg-card shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-[18px] border-r-2 border-[#e3e3e3] px-[18px] py-[22px]">
          {ITEM.images.map((src, index) => (
            <button
              key={src}
              type="button"
              className={`aspect-[3/4] w-[88px] cursor-pointer overflow-hidden rounded-[14px] border-[3px] bg-[#ebebeb] p-0 max-[960px]:w-16 ${index === activeImage ? 'border-ink' : 'border-transparent'}`}
              onClick={() => onImageChange(index)}
              aria-label={`Show image ${index + 1}`}
            >
              <img className="h-full w-full object-contain" src={src} alt="" />
            </button>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <img className="h-full w-full object-contain" src={ITEM.images[activeImage]} alt={itemName} />
        </div>
      </div>

      <h2 className="mt-7 mb-[14px] text-2xl font-extrabold text-[#0a0a0a] uppercase">THE PLAYER</h2>
      <div className="overflow-hidden rounded-2xl bg-card shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-baseline gap-6 bg-orange px-6 py-[14px] text-white">
          <span className="text-2xl font-extrabold">{player.name}</span>
          <span className="text-[1.1rem] font-bold text-[#f1d3b9]">{player.nickname}</span>
        </div>
        <div className="flex justify-around gap-3 px-4 py-[14px]">
          <Stat label="Age" value={String(player.age)} />
          <Stat label="Position" value={player.position} />
          <Stat label="Number" value={String(player.number)} />
          <Stat label="Size" value={player.size} />
        </div>
        <div className="flex justify-around gap-3 border-t-2 border-[#e3e3e3] px-4 py-[14px]">
          <Stat label="Nationality" value={player.nationality} />
          <Stat label="Place of birth" value={player.placeOfBirth} />
          <Stat label="Preferred foot" value={player.preferredFoot} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-[0.95rem] font-bold text-[#555] uppercase">{label}</span>
      <span className="text-[1.05rem] font-extrabold uppercase">{value}</span>
    </div>
  );
}
