import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewListingView } from '../src/club/NewListingPage';
import type { AccountNav } from '../src/auction/types';
import { renderWithRouter } from './setup/render';

const CATEGORIES = [
  { id: 1, slug: 'player-jerseys', name: 'Player jerseys' },
  { id: 2, slug: 'team-jerseys', name: 'Team jerseys' },
  { id: 3, slug: 'special-editions', name: 'Special editions' },
];

const originalFetch = globalThis.fetch;

let posts: { url: string; init: RequestInit }[] = [];
// What POST /api/clubs/me/listings answers in the current test
let createResponse: { status: number; body: unknown } = { status: 201, body: { id: 1 } };

beforeEach(() => {
  posts = [];
  createResponse = { status: 201, body: { id: 1 } };
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (init?.method === 'POST') {
      posts.push({ url, init });
      return new Response(JSON.stringify(createResponse.body), {
        status: createResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(url.endsWith('/api/categories') ? CATEGORIES : {}), {
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
    email: 'club@feup.pt',
    username: 'club',
    country: 'PT',
    token: 'club-token',
    role: 'CLUB',
    onProfileSaved: mock(),
    onSignUpClick: mock(),
    onLoginClick: mock(),
    onLogout: mock(),
    ...overrides,
  };
}

async function renderForm() {
  const user = userEvent.setup();
  renderWithRouter(<NewListingView account={makeAccount()} />);
  await screen.findByRole('option', { name: 'Team jerseys' }); // categories loaded
  return user;
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>, category: string) {
  await user.selectOptions(screen.getByLabelText('Category *'), category);
  await user.type(screen.getByLabelText('Title *'), 'Signed home shirt');
  await user.type(screen.getByLabelText('Description *'), 'Signed by the whole squad after the final.');
}

function lastForm(): FormData {
  const post = posts.at(-1);
  if (!post) throw new Error('No POST was sent');
  return post.init.body as FormData;
}

describe('NewListingView: who sees the form', () => {
  it('asks visitors to log in', () => {
    renderWithRouter(<NewListingView account={makeAccount({ isLoggedIn: false, role: '' })} />);

    expect(screen.getByText('Log in with your club account to create auctions.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Title *')).toBeNull();
  });

  it('tells buyers that only clubs can create auctions', () => {
    renderWithRouter(<NewListingView account={makeAccount({ role: 'BUYER' })} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Only club accounts can create auctions.');
    expect(screen.queryByLabelText('Title *')).toBeNull();
  });

  it('shows the form to clubs, with the categories from the API', async () => {
    await renderForm();

    expect(screen.getByLabelText('Title *')).toBeInTheDocument();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Choose a category',
      'Player jerseys',
      'Team jerseys',
      'Special editions',
    ]);
  });
});

describe('NewListingView: player fields by category', () => {
  it('shows the player and the player details for player jerseys', async () => {
    const user = await renderForm();
    await user.selectOptions(screen.getByLabelText('Category *'), 'Player jerseys');

    expect(screen.getByLabelText('Player')).toBeInTheDocument();
    expect(screen.getByText('Player details')).toBeInTheDocument();
    expect(screen.getByLabelText('Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Size')).toBeInTheDocument();
  });

  it('hides the player fields for team jerseys but keeps the size', async () => {
    const user = await renderForm();
    await user.selectOptions(screen.getByLabelText('Category *'), 'Team jerseys');

    expect(screen.queryByLabelText('Player')).toBeNull();
    expect(screen.queryByText('Player details')).toBeNull();
    expect(screen.queryByLabelText('Age')).toBeNull();
    expect(screen.getByLabelText('Size')).toBeInTheDocument();
  });

  it('shows the player fields for special editions', async () => {
    const user = await renderForm();
    await user.selectOptions(screen.getByLabelText('Category *'), 'Special editions');

    expect(screen.getByLabelText('Player')).toBeInTheDocument();
    expect(screen.getByText('Player details')).toBeInTheDocument();
  });
});

describe('NewListingView: saving', () => {
  it('sends a draft with the club token and the player details as JSON', async () => {
    const user = await renderForm();
    await fillRequired(user, 'Player jerseys');
    await user.type(screen.getByLabelText('Player'), 'Test Player');
    await user.type(screen.getByLabelText('Age'), '30');
    await user.type(screen.getByLabelText('Size'), 'L');

    await user.click(screen.getByRole('button', { name: 'SAVE AS DRAFT' }));

    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0].url).toEndWith('/api/clubs/me/listings');
    expect((posts[0].init.headers as Record<string, string>).Authorization).toBe('Bearer club-token');
    const form = lastForm();
    expect(form.get('status')).toBe('draft');
    expect(form.get('categoryId')).toBe('1');
    expect(form.get('title')).toBe('Signed home shirt');
    expect(form.get('playerName')).toBe('Test Player');
    expect(JSON.parse(String(form.get('playerDetails')))).toEqual({ age: 30, size: 'L' });
  });

  it('does not send player data typed before switching to team jerseys', async () => {
    const user = await renderForm();
    await fillRequired(user, 'Player jerseys');
    await user.type(screen.getByLabelText('Player'), 'Test Player');
    await user.type(screen.getByLabelText('Age'), '30');
    await user.type(screen.getByLabelText('Size'), 'XL');
    await user.selectOptions(screen.getByLabelText('Category *'), 'Team jerseys');

    await user.click(screen.getByRole('button', { name: 'SAVE AS DRAFT' }));

    await waitFor(() => expect(posts).toHaveLength(1));
    const form = lastForm();
    expect(form.get('categoryId')).toBe('2');
    expect(form.get('playerName')).toBe('');
    expect(JSON.parse(String(form.get('playerDetails')))).toEqual({ size: 'XL' });
  });

  it('sends no player details when none are filled in', async () => {
    const user = await renderForm();
    await fillRequired(user, 'Team jerseys');

    await user.click(screen.getByRole('button', { name: 'SAVE AS DRAFT' }));

    await waitFor(() => expect(posts).toHaveLength(1));
    expect(lastForm().get('playerDetails')).toBe('');
  });

  it('confirms that the draft was saved', async () => {
    const user = await renderForm();
    await fillRequired(user, 'Player jerseys');

    await user.click(screen.getByRole('button', { name: 'SAVE AS DRAFT' }));

    expect(await screen.findByText('"Signed home shirt" was saved as a draft.')).toBeInTheDocument();
  });

  it('sends the listing for verification with the other button', async () => {
    const user = await renderForm();
    await fillRequired(user, 'Player jerseys');

    await user.click(screen.getByRole('button', { name: 'SUBMIT FOR VERIFICATION' }));

    await waitFor(() => expect(posts).toHaveLength(1));
    expect(lastForm().get('status')).toBe('pending_verification');
    expect(await screen.findByText(/was sent for verification/)).toBeInTheDocument();
  });
});

describe('NewListingView: errors from the server', () => {
  it('explains that the club is not approved yet', async () => {
    createResponse = { status: 403, body: { error: 'club_not_approved' } };
    const user = await renderForm();
    await fillRequired(user, 'Player jerseys');

    await user.click(screen.getByRole('button', { name: 'SAVE AS DRAFT' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your club has not been approved yet, so it cannot create auctions.'
    );
  });

  it('lists what is missing before it can be sent for verification', async () => {
    createResponse = { status: 400, body: { error: 'incomplete_listing', missing: ['startingPrice', 'images'] } };
    const user = await renderForm();
    await fillRequired(user, 'Player jerseys');

    await user.click(screen.getByRole('button', { name: 'SUBMIT FOR VERIFICATION' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'To submit for verification, add: starting price, at least one jersey photo. Or save it as a draft.'
    );
  });

  it('says when the title is already taken', async () => {
    createResponse = { status: 409, body: { error: 'title_taken' } };
    const user = await renderForm();
    await fillRequired(user, 'Player jerseys');

    await user.click(screen.getByRole('button', { name: 'SAVE AS DRAFT' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('There is already a listing with this title.');
  });

  it('asks to log in again when the session expired', async () => {
    createResponse = { status: 401, body: { error: 'Authentication required.' } };
    const user = await renderForm();
    await fillRequired(user, 'Player jerseys');

    await user.click(screen.getByRole('button', { name: 'SAVE AS DRAFT' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your session has expired. Log in again.');
  });
});
