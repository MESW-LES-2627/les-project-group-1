import { useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  ['SPORTS', '/sports'],
  ['CHARITIES', '/charities'],
  ['ABOUT US', '#about'],
  ['SUPPORT', '#support'],
] as const;

const styles = {
  header:
    'relative flex min-h-[88px] items-center gap-[clamp(22px,3vw,58px)] border-b-4 border-ink-line px-[clamp(30px,3vw,58px)] py-2 max-wide:gap-[22px] max-tablet:min-h-[80px] max-mobile:min-h-[64px] max-mobile:flex-wrap max-mobile:gap-4 max-mobile:px-[18px] max-mobile:py-1.5',
  logoLink: 'block w-[clamp(105px,7.5vw,145px)] shrink-0 max-mobile:w-[96px]',
  search:
    'flex h-[52px] w-[clamp(260px,23vw,440px)] basis-[440px] items-center gap-3 rounded-[20px] border-[1.5px] border-ink-soft px-5 max-tablet:ml-auto max-mobile:order-3 max-mobile:h-[42px] max-mobile:w-full max-mobile:basis-full max-mobile:gap-[7px] max-mobile:rounded-[14px] max-mobile:px-[10px]',
  searchIcon: 'size-[26px] shrink-0 max-mobile:size-5',
  searchInput:
    'h-auto min-w-0 border-0 bg-transparent px-0 py-0 text-[clamp(0.95rem,1vw,1.25rem)] font-normal shadow-none outline-none placeholder:text-ink-soft focus-visible:border-0 focus-visible:ring-0 max-mobile:text-[0.85rem]',
  nav: 'flex flex-1 items-center justify-between gap-[clamp(12px,1.4vw,28px)] max-wide:gap-3 max-tablet:hidden',
  liveLink:
    'inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink-line px-2 py-px text-[clamp(0.9rem,1.05vw,1.3rem)] font-bold whitespace-nowrap text-ink-strong no-underline',
  navLink:
    'text-[clamp(0.9rem,1.05vw,1.3rem)] font-bold whitespace-nowrap text-ink-strong no-underline',
  account:
    'flex shrink-0 items-center gap-[14px] max-wide:gap-2 max-mobile:order-2 max-mobile:ml-auto max-mobile:gap-[6px]',
  menuButton:
    'inline-flex size-10 shrink-0 items-center justify-center rounded-[14px] border-2 border-ink-strong bg-white text-ink-strong tablet:hidden max-mobile:size-9',
  mobileMenu:
    'absolute inset-x-0 top-full z-30 flex flex-col gap-3 border-b-4 border-ink-line bg-white px-[18px] py-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] tablet:hidden',
  mobileLive:
    'inline-flex w-fit items-center gap-1.5 rounded-full border-[1.5px] border-ink-line px-2 py-px text-[clamp(0.9rem,1.05vw,1.3rem)] font-bold text-ink-strong no-underline',
  mobileLink:
    'text-[clamp(1rem,1.05vw,1.3rem)] font-bold text-ink-strong no-underline',
  mobileSignup:
    'inline-flex w-fit rounded-[22px] border-2 border-ink-strong bg-ink-strong px-5 py-2 text-[clamp(0.9rem,1.05vw,1.3rem)] font-bold text-white no-underline',
};

interface NavbarProps {
  onSignUpClick?: () => void;
  onLoginClick?: () => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

// Slim responsive site navigation, using the public brand mark and shadcn inputs/buttons.
export function Navbar({ onSignUpClick, onLoginClick, isLoggedIn, onLogout, searchValue, onSearchChange }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={styles.header}>
      <Link className={styles.logoLink} to="/" aria-label="Assist Club home">
        <img className="h-auto w-full" src="/ac_logo.svg" alt="Assist Club" />
      </Link>

      <label className={styles.search}>
        <Search className={styles.searchIcon} aria-hidden="true" />
        <Input className={styles.searchInput} type="search" placeholder="Search auctions" aria-label="Search auctions" value={searchValue} onChange={onSearchChange ? (event) => onSearchChange(event.target.value) : undefined} />
      </label>

      <nav className={styles.nav} aria-label="Main navigation">
        <a className={styles.liveLink} href="#live">
          <span className="size-[13px] rounded-full bg-live" />NOW LIVE
        </a>
        {NAV_LINKS.map(([label, href]) =>
          href.startsWith('/') ? (
            <Link key={href} className={styles.navLink} to={href}>
              {label}
            </Link>
          ) : (
            <a key={href} className={styles.navLink} href={href}>
              {label}
            </a>
          )
        )}
      </nav>

      <div className={styles.account}>
        {!isLoggedIn && (
          <>
            <Button variant="navbarPrimary" size="navbar" onClick={onSignUpClick}>
              <a href="#signup">SIGN UP</a>
            </Button>
            <Button variant="navbarOutline" size="navbar" onClick={onLoginClick}>
              <a href="#login">LOGIN</a>
            </Button>
          </>
        )}
        {isLoggedIn && (
          <>
            <Button variant="navbarPrimary" size="navbar">
              <Link to="/profile">PROFILE</Link>
            </Button>
            <Button variant="navbarOutline" size="navbar" onClick={onLogout}>
              <a href="#logout">LOGOUT</a>
            </Button>
          </>
        )}
        <button
          type="button"
          className={styles.menuButton}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <div id="mobile-menu" className={styles.mobileMenu}>
          <a className={styles.mobileLive} href="#live" onClick={closeMenu}>
            <span className="size-[13px] rounded-full bg-live" />NOW LIVE
          </a>
          {NAV_LINKS.map(([label, href]) =>
            href.startsWith('/') ? (
              <Link key={href} className={styles.mobileLink} to={href} onClick={closeMenu}>
                {label}
              </Link>
            ) : (
              <a key={href} className={styles.mobileLink} href={href} onClick={closeMenu}>
                {label}
              </a>
            )
          )}
          <a className={styles.mobileSignup} href="#signup" onClick={closeMenu}>
            SIGN UP
          </a>
        </div>
      )}
    </header>
  );
}