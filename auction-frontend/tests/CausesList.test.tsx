import { afterEach, describe, expect, it } from 'bun:test';
import { cleanup, screen } from '@testing-library/react';
import { CausesList } from '../src/components/CausesList';
import { ItemContext } from '../src/auction/ItemContext';
import type { AuctionItem } from '../src/auction/types';
import { renderWithRouter } from './setup/render';

afterEach(() => {
  cleanup();
});

const item: AuctionItem = {
  subtitle: 'Club · Competition',
  tags: [],
  images: [],
  player: null,
  club: { name: 'Club', logoUrl: null },
  causes: [
    {
      name: 'Goal for Kids',
      description: 'Free coaching and kit for children from low-income neighbourhoods.',
      logo: '/images/charities/goal-for-kids.svg',
      country: 'PT',
      donationPercentage: 10,
    },
  ],
};

describe('CausesList', () => {
  it('shows the charity selected for the auction', () => {
    renderWithRouter(
      <ItemContext.Provider value={item}>
        <CausesList />
      </ItemContext.Provider>
    );

    expect(screen.getByRole('heading', { name: 'Goal for Kids' })).toBeInTheDocument();
    expect(screen.getByText(item.causes[0].description)).toBeInTheDocument();
  });

  it('shows the country and donation percentage', () => {
    renderWithRouter(
      <ItemContext.Provider value={item}>
        <CausesList />
      </ItemContext.Provider>
    );

    expect(screen.getByText(/Portugal/)).toBeInTheDocument();
    expect(screen.getByText('10% donation')).toBeInTheDocument();
  });

  it('renders nothing when the auction has no charity', () => {
    renderWithRouter(
      <ItemContext.Provider value={{ ...item, causes: [] }}>
        <CausesList />
      </ItemContext.Provider>
    );

    expect(screen.queryByRole('heading', { name: 'Supported cause' })).not.toBeInTheDocument();
  });
});
