import { afterEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, screen, within } from '@testing-library/react';
import { AboutView } from '../src/about/AboutView';
import { MISSION, STEPS, VALUES } from '../src/about/data';
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

describe('AboutView', () => {
  it('shows the page title and the mission', () => {
    renderWithRouter(<AboutView account={account} />);

    expect(screen.getByRole('heading', { level: 1, name: 'About us' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Our mission' })).toBeInTheDocument();
    expect(screen.getByText(MISSION)).toBeInTheDocument();
  });

  it('explains how it works step by step', () => {
    renderWithRouter(<AboutView account={account} />);

    const steps = within(screen.getByRole('list', { name: 'How it works' })).getAllByRole('listitem');
    expect(steps.length).toBe(STEPS.length);
    for (const step of STEPS) {
      expect(screen.getByRole('heading', { name: step.title })).toBeInTheDocument();
      expect(screen.getByText(step.description)).toBeInTheDocument();
    }
  });

  it('shows what the platform stands for', () => {
    renderWithRouter(<AboutView account={account} />);

    const values = within(screen.getByRole('list', { name: 'What we stand for' })).getAllByRole('listitem');
    expect(values.length).toBe(VALUES.length);
    for (const value of VALUES) {
      expect(screen.getByRole('heading', { name: value.title })).toBeInTheDocument();
    }
  });
});