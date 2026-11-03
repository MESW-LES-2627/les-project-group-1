import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const NAV_LINKS = [
  ['SPORTS', '#sports'],
  ['CHARITIES', '#charities'],
  ['ABOUT US', '#about'],
  ['SUPPORT', '#support'],
] as const;

// Slim responsive site navigation, using the public brand mark and shadcn inputs/buttons.
export function Navbar() {
  return (
    <header className="flex min-h-[88px] items-center gap-[clamp(22px,3vw,58px)] border-b-4 border-[#090909] px-[clamp(30px,3vw,58px)] py-2 max-[1450px]:gap-[22px] max-[1100px]:min-h-[80px] max-[620px]:min-h-[64px] max-[620px]:gap-4 max-[620px]:px-[18px] max-[620px]:py-1.5">
      <a
        className="block w-[clamp(105px,7.5vw,145px)] shrink-0 max-[620px]:w-[96px]"
        href="#top"
        aria-label="Assist Club home"
      >
        <img className="h-auto w-full" src="/ac_logo.svg" alt="Assist Club" />
      </a>

      <label className="flex h-[52px] w-[clamp(260px,23vw,440px)] basis-[440px] items-center gap-3 rounded-[20px] border-[1.5px] border-[#111] px-5 max-[1100px]:ml-auto max-[620px]:h-[42px] max-[620px]:w-auto max-[620px]:basis-auto max-[620px]:flex-1 max-[620px]:gap-[7px] max-[620px]:rounded-[14px] max-[620px]:px-[10px]">
        <Search className="size-[26px] shrink-0 max-[620px]:size-5" aria-hidden="true" />
        <Input
          className="h-auto min-w-0 border-0 bg-transparent px-0 py-0 text-[clamp(0.95rem,1vw,1.25rem)] font-normal shadow-none outline-none placeholder:text-[#111] focus-visible:border-0 focus-visible:ring-0 max-[620px]:text-[0.85rem]"
          type="search"
          placeholder="Search for a club, player, leagues..."
          aria-label="Search auctions"
        />
      </label>

      <nav className="flex flex-1 items-center justify-between gap-[clamp(12px,1.4vw,28px)] max-[1450px]:gap-3 max-[1100px]:hidden" aria-label="Main navigation">
        <a className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#090909] px-2 py-px text-[clamp(0.9rem,1.05vw,1.3rem)] font-bold whitespace-nowrap text-[#050505] no-underline" href="#live">
          <span className="size-[13px] rounded-full bg-[#d3262d]" />NOW LIVE
        </a>
        {NAV_LINKS.map(([label, href]) => (
          <a key={href} className="text-[clamp(0.9rem,1.05vw,1.3rem)] font-bold whitespace-nowrap text-[#050505] no-underline" href={href}>
            {label}
          </a>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-[14px] max-[1450px]:gap-2 max-[620px]:gap-[6px]">
        <Button asChild className="h-auto min-w-[150px] rounded-[22px] border-2 border-[#050505] bg-[#050505] px-[22px] py-[9px] text-[clamp(0.9rem,1.05vw,1.3rem)] font-bold hover:bg-[#222] max-[1450px]:min-w-[110px] max-[1450px]:px-[14px] max-[620px]:hidden">
          <a href="#signup">SIGN UP</a>
        </Button>
        <Button asChild variant="outline" className="h-auto min-w-[150px] rounded-[22px] border-2 border-[#050505] bg-white px-[22px] py-[9px] text-[clamp(0.9rem,1.05vw,1.3rem)] font-bold text-[#050505] hover:bg-[#f4f4f4] max-[1450px]:min-w-[110px] max-[1450px]:px-[14px] max-[620px]:min-w-0 max-[620px]:rounded-[14px] max-[620px]:px-[10px] max-[620px]:py-[7px] max-[620px]:text-[0.75rem]">
          <a href="#login">LOGIN</a>
        </Button>
      </div>
    </header>
  );
}
