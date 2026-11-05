import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountProfile } from '../src/components/AccountProfile';
import type { ProfileUser } from '../src/profile/api';

const originalFetch = globalThis.fetch;

let calls: { url: string; init?: RequestInit }[] = [];
let profileResponse: { status: number; body: unknown } = { status: 200, body: {} };

function installFetch() {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    const { status, body } = url.endsWith('/purchases')
      ? { status: 200, body: { purchases: [] } }
      : profileResponse;
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

beforeEach(() => {
  calls = [];
  profileResponse = { status: 200, body: {} };
  installFetch();
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

function renderProfile(token = 'abc', onSaved: (user: ProfileUser) => void = () => {}) {
  return render(
    <AccountProfile
      token={token}
      username="afonso"
      email="afonso@feup.pt"
      country="PT"
      onSaved={onSaved}
    />
  );
}

describe('AccountProfile', () => {
  it('shows the page title and the account summary', () => {
    renderProfile();

    expect(screen.getByRole('heading', { name: 'My account' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'afonso' })).toBeInTheDocument();
    expect(screen.getAllByText('afonso@feup.pt').length).toBeGreaterThan(0);
  });

  it('shows the editable fields filled in', () => {
    renderProfile();

    expect((screen.getByLabelText('Username') as HTMLInputElement).value).toBe('afonso');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('afonso@feup.pt');
    expect((screen.getByLabelText('Country') as HTMLInputElement).value).toBe('PT');
  });

  it('keeps the email read-only', () => {
    renderProfile();

    expect(screen.getByLabelText('Email')).toBeDisabled();
  });

  it('shows the jerseys section', async () => {
    renderProfile();

    expect(await screen.findByRole('heading', { name: 'My jerseys' })).toBeInTheDocument();
  });

  it('disables saving until something changes', async () => {
    const user = userEvent.setup();
    renderProfile();

    const save = screen.getByRole('button', { name: 'SAVE CHANGES' });
    expect(save).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Country'), 'ES');
    expect(save).toBeEnabled();
  });

  it('saves the changes sending the bearer token', async () => {
    profileResponse = {
      status: 200,
      body: { user: { username: 'novo', email: 'afonso@feup.pt', country: 'ES' } },
    };
    const user = userEvent.setup();
    let saved: ProfileUser | null = null;
    renderProfile('abc', (value) => {
      saved = value;
    });

    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'novo');
    await user.selectOptions(screen.getByLabelText('Country'), 'ES');
    await user.click(screen.getByRole('button', { name: 'SAVE CHANGES' }));

    expect(await screen.findByText('Profile saved.')).toBeInTheDocument();
    const put = calls.find((call) => call.init?.method === 'PUT');
    expect(put).toBeDefined();
    expect((put!.init!.headers as Record<string, string>).Authorization).toBe('Bearer abc');
    expect(JSON.parse(put!.init!.body as string)).toEqual({ username: 'novo', country: 'ES' });
    expect(saved).toEqual({ username: 'novo', email: 'afonso@feup.pt', country: 'ES' });
  });

  it('shows a friendly message when the username is taken', async () => {
    profileResponse = { status: 409, body: { error: 'username_taken' } };
    const user = userEvent.setup();
    renderProfile();

    await user.type(screen.getByLabelText('Username'), '2');
    await user.click(screen.getByRole('button', { name: 'SAVE CHANGES' }));

    expect(await screen.findByText('That username is already in use.')).toBeInTheDocument();
  });

  it('asks to log in again when the session has expired', async () => {
    profileResponse = { status: 401, body: { error: 'Invalid or expired session.' } };
    const user = userEvent.setup();
    renderProfile();

    await user.type(screen.getByLabelText('Username'), '2');
    await user.click(screen.getByRole('button', { name: 'SAVE CHANGES' }));

    expect(await screen.findByText('Your session has expired. Please log in again.')).toBeInTheDocument();
  });

  it('disables editing when there is no session token', () => {
    renderProfile('');

    expect(screen.getByText('Log in again to edit your profile.')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'SAVE CHANGES' })).toBeDisabled();
  });
});