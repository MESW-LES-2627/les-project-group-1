import { afterEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, screen, within } from '@testing-library/react';
import { CharitiesView } from '../src/charities/CharitiesView';
import type { Charity } from '../src/charities/data';
import type { AccountNav } from '../src/auction/types';
import { renderWithRouter } from './setup/render';

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const originalFetch = globalThis.fetch;

const CHARITIES: Charity[] = [
  {
    id: 1,
    name: 'Goal for Kids',
    description: 'Free coaching and kit for children from low-income neighbourhoods.',
    logoUrl: '/images/charities/goal-for-kids.svg',
    country: 'PT',
    verified: true,
    auctionCount: 8,
  },
  {
    id: 2,
    name: 'Second Half Foundation',
    description: 'Helps retired athletes recover from injury and return to everyday life.',
    logoUrl: '/images/charities/second-half-foundation.svg',
    country: 'GB',
    verified: true,
    auctionCount: 5,
  },
];

function respondWith(charities: Charity[]) {
  globalThis.fetch = mock(async () =>
    new Response(JSON.stringify(charities), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  ) as unknown as typeof fetch;
}

const account = {
  isLoggedIn: false,
  onSignUpClick: mock(),
  onLoginClick: mock(),
  onLogout: mock(),
} as unknown as AccountNav;

describe('CharitiesView', () => {
  it('shows the page title', () => {
    respondWith(CHARITIES);
    renderWithRouter(<CharitiesView account={account} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Charities' })).toBeInTheDocument();
  });

  it('shows a card for every verified charity returned by the API', async () => {
    respondWith(CHARITIES);
    renderWithRouter(<CharitiesView account={account} />);

    const cards = await screen.findAllByRole('article');
    expect(cards.length).toBe(CHARITIES.length);
    for (const charity of CHARITIES) {
      expect(screen.getByRole('heading', { name: charity.name })).toBeInTheDocument();
    }
  });

  it('shows the country and number of auctions for each charity', async () => {
    respondWith(CHARITIES);
    renderWithRouter(<CharitiesView account={account} />);

    const first = within((await screen.findAllByRole('article'))[0]);
    expect(first.getByText(/Portugal/)).toBeInTheDocument();
    expect(first.getByText(String(CHARITIES[0].auctionCount))).toBeInTheDocument();
  });

  it('shows a logo on every card', async () => {
    respondWith(CHARITIES);
    renderWithRouter(<CharitiesView account={account} />);

    await screen.findAllByRole('article');
    for (const charity of CHARITIES) {
      expect(screen.getByAltText(`${charity.name} logo`)).toHaveAttribute('src', charity.logoUrl!);
    }
  });

  it('shows an error when the charities cannot be loaded', async () => {
    globalThis.fetch = mock(async () => new Response('{}', { status: 500 })) as unknown as typeof fetch;
    renderWithRouter(<CharitiesView account={account} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed with status 500');
  });
});
