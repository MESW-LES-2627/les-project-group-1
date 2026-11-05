import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileView } from '../src/profile/ProfileView';
import type { AccountNav } from '../src/auction/types';
import { renderWithRouter } from './setup/render';

const originalFetch = globalThis.fetch;

let calls: { url: string; init?: RequestInit }[] = [];

beforeEach(() => {
  calls = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    const body = url.endsWith('/purchases')
      ? { purchases: [] }
      : { user: { username: 'afonso', email: 'a@feup.pt', country: 'PT', avatar: null } };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

function makeAccount(overrides: Partial<AccountNav> = {}): AccountNav {
  return {
    isLoggedIn: true,
    email: 'a@feup.pt',
    username: 'afonso',
    country: 'PT',
    token: 'abc',
    onProfileSaved: mock(),
    onSignUpClick: mock(),
    onLoginClick: mock(),
    onLogout: mock(),
    ...overrides,
  };
}

describe('ProfileView', () => {
  it('asks the visitor to log in when there is no session', () => {
    renderWithRouter(<ProfileView account={makeAccount({ isLoggedIn: false, email: '', username: '', token: '' })} />);

    expect(screen.getByText('Log in to see your profile.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /my account/i })).toBeNull();
  });

  it('opens the login when the visitor clicks LOG IN', async () => {
    const user = userEvent.setup();
    const onLoginClick = mock();
    renderWithRouter(
      <ProfileView account={makeAccount({ isLoggedIn: false, email: '', username: '', token: '', onLoginClick })} />
    );

    await user.click(screen.getByRole('button', { name: 'LOG IN' }));

    expect(onLoginClick).toHaveBeenCalledTimes(1);
  });

  it('shows the account of the logged in user', async () => {
    renderWithRouter(<ProfileView account={makeAccount()} />);

    expect(screen.getByRole('heading', { name: /my account/i })).toBeInTheDocument();
    expect(screen.getAllByText('afonso').length).toBeGreaterThan(0);
    expect(screen.getAllByText('a@feup.pt').length).toBeGreaterThan(0);
    expect(await screen.findByText("You haven't bought any jerseys yet.")).toBeInTheDocument();
  });

  it('sends the session token when loading the account data', async () => {
    renderWithRouter(<ProfileView account={makeAccount()} />);

    await screen.findByText("You haven't bought any jerseys yet.");

    const purchases = calls.find((call) => call.url.endsWith('/api/users/me/purchases'));
    expect((purchases!.init!.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });
});