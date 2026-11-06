import { afterEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, screen, within } from '@testing-library/react';
import { SportsView } from '../src/sports/SportsView';
import { SPORTS } from '../src/sports/data';
import type { AccountNav } from '../src/auction/types';
import { renderWithRouter } from './setup/render';

afterEach(() => {
  cleanup();
});

const account = {
  isLoggedIn: false,
  onSignUpClick: mock(),
  onLoginClick: mock(),
  onLogout: mock(),
} as unknown as AccountNav;

describe('SportsView', () => {
  it('shows the page title', () => {
    renderWithRouter(<SportsView account={account} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Sports' })).toBeInTheDocument();
  });

  it('shows a card with an image for every sport', () => {
    renderWithRouter(<SportsView account={account} />);

    expect(screen.getAllByRole('article').length).toBe(SPORTS.length);
    for (const sport of SPORTS) {
      expect(screen.getByRole('heading', { name: sport.name })).toBeInTheDocument();
      expect(screen.getByAltText(`${sport.name} image`)).toHaveAttribute('src', sport.image);
    }
  });

  it('shows how many items and live auctions each sport has', () => {
    renderWithRouter(<SportsView account={account} />);

    const first = within(screen.getAllByRole('article')[0]);
    expect(first.getByText(String(SPORTS[0].items))).toBeInTheDocument();
    expect(first.getByText(String(SPORTS[0].liveAuctions))).toBeInTheDocument();
  });
});