import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LiveView } from '../src/live/LiveView';
import type { ListingSummary } from '../src/catalogue/types';
import type { AccountNav } from '../src/auction/types';
import { renderWithRouter } from './setup/render';

const originalFetch = globalThis.fetch;

const HOUR = 60 * 60 * 1000;

function makeListing(id: number, title: string, auctionEndsAt: string | null): ListingSummary {
  return {
    id,
    title,
    playerName: null,
    season: '2025',
    competition: 'League',
    match: null,
    tags: ['Worn'],
    images: ['/jersey.png'],
    club: { slug: 'club', name: 'Club', logoUrl: null },
    category: { slug: 'jerseys', name: 'Jerseys' },
    currentBid: 100,
    auctionEndsAt,
  };
}

const CATEGORIES = [
  { slug: 'player-jerseys', name: 'Player jerseys' },
  { slug: 'team-jerseys', name: 'Team jerseys' },
];

let calls: string[] = [];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function respondWith(listings: unknown, status = 200) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.includes('/api/categories')) return json(CATEGORIES);
    return json(listings, status);
  }) as unknown as typeof fetch;
}

const account = {
  isLoggedIn: false,
  onSignUpClick: mock(),
  onLoginClick: mock(),
  onLogout: mock(),
} as unknown as AccountNav;

beforeEach(() => {
  calls = [];
  respondWith([]);
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe('LiveView', () => {
  it('shows the page title', async () => {
    renderWithRouter(<LiveView account={account} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Now live' })).toBeInTheDocument();
    await screen.findByText('No auctions are live right now.');
  });

  it('shows only the listings whose auction is still open', async () => {
    respondWith([
      makeListing(1, 'Open Jersey', new Date(Date.now() + 2 * HOUR).toISOString()),
      makeListing(2, 'Ended Jersey', new Date(Date.now() - HOUR).toISOString()),
      makeListing(3, 'No Auction Jersey', null),
    ]);
    renderWithRouter(<LiveView account={account} />);

    expect(await screen.findByRole('heading', { name: 'Open Jersey' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ended Jersey' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'No Auction Jersey' })).toBeNull();
  });

  it('lists the auctions that end first at the top', async () => {
    respondWith([
      makeListing(1, 'Ends Later', new Date(Date.now() + 5 * HOUR).toISOString()),
      makeListing(2, 'Ends Soon', new Date(Date.now() + HOUR).toISOString()),
    ]);
    renderWithRouter(<LiveView account={account} />);

    await screen.findByRole('heading', { name: 'Ends Soon' });
    const titles = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(titles).toEqual(['Ends Soon', 'Ends Later']);
  });

  it('tells the visitor when no auction is live', async () => {
    respondWith([makeListing(1, 'Ended Jersey', new Date(Date.now() - HOUR).toISOString())]);
    renderWithRouter(<LiveView account={account} />);

    expect(await screen.findByText('No auctions are live right now.')).toBeInTheDocument();
  });

  it('shows an error when the listings cannot be loaded', async () => {
    respondWith({}, 500);
    renderWithRouter(<LiveView account={account} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed with status 500');
  });

  it('shows the category filter and asks for the chosen category', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LiveView account={account} />);

    await user.click(await screen.findByText('Player jerseys'));

    await screen.findByText('No auctions are live right now.');
    expect(calls.some((url) => url.includes('/api/listings?category=player-jerseys'))).toBe(true);
  });
});