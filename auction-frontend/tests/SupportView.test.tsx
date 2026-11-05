import { afterEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, screen, within } from '@testing-library/react';
import { SupportView } from '../src/support/SupportView';
import { CONTACT_EMAIL, FAQS } from '../src/support/data';
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

describe('SupportView', () => {
  it('shows the page title', () => {
    renderWithRouter(<SupportView account={account} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Support' })).toBeInTheDocument();
  });

  it('lists every frequently asked question with its answer', () => {
    renderWithRouter(<SupportView account={account} />);

    const items = within(screen.getByRole('list', { name: 'Frequently asked questions' })).getAllByRole('listitem');
    expect(items.length).toBe(FAQS.length);
    for (const faq of FAQS) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
      expect(screen.getByText(faq.answer)).toBeInTheDocument();
    }
  });

  it('shows how to contact the support team', () => {
    renderWithRouter(<SupportView account={account} />);

    expect(screen.getByRole('heading', { name: 'Still need help?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
  });
});