import { describe, expect, it } from 'bun:test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navbar } from '../src/components/Navbar';
import { renderWithRouter } from './setup/render';

describe('navbar account links', () => {
  it('links to the profile page when logged in', () => {
    renderWithRouter(<Navbar isLoggedIn />);

    expect(screen.getByRole('link', { name: 'PROFILE' })).toHaveAttribute('href', '/profile');
  });

  it('does not show the profile link when logged out', () => {
    renderWithRouter(<Navbar isLoggedIn={false} />);

    expect(screen.queryByRole('link', { name: 'PROFILE' })).toBeNull();
  });
});

describe('navbar page links', () => {
  it('links to the charities page', () => {
    renderWithRouter(<Navbar />);

    expect(screen.getByRole('link', { name: 'CHARITIES' })).toHaveAttribute('href', '/charities');
  });
  it('links to the sports page', () => {
    renderWithRouter(<Navbar />);

    expect(screen.getByRole('link', { name: 'SPORTS' })).toHaveAttribute('href', '/sports');
  });
});

describe('navbar mobile menu', () => {
  it('opens and closes the menu', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navbar />);

    expect(document.getElementById('mobile-menu')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(document.getElementById('mobile-menu')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(document.getElementById('mobile-menu')).toBeNull();
  });
});