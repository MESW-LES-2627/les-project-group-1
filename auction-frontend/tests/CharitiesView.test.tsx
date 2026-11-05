import { afterEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, screen, within } from '@testing-library/react';
import { CharitiesView } from '../src/charities/CharitiesView';
import { CHARITIES } from '../src/charities/data';
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

describe('CharitiesView', () => {
  it('shows the page title', () => {
    renderWithRouter(<CharitiesView account={account} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Charities' })).toBeInTheDocument();
  });

  it('shows a card for every charity', () => {
    renderWithRouter(<CharitiesView account={account} />);

    const cards = screen.getAllByRole('article');
    expect(cards.length).toBe(CHARITIES.length);
    for (const charity of CHARITIES) {
      expect(screen.getByRole('heading', { name: charity.name })).toBeInTheDocument();
    }
  });

  it('shows what each charity raised and how many auctions supported it', () => {
    renderWithRouter(<CharitiesView account={account} />);

    const first = within(screen.getAllByRole('article')[0]);
    expect(first.getByText(CHARITIES[0].cause)).toBeInTheDocument();
    expect(first.getByText(String(CHARITIES[0].auctions))).toBeInTheDocument();
  });
});