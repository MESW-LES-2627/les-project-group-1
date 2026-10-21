import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ---------------------------------------------------------------------------
// 1. FAKE SOCKET
// Mock fake socket io
// ---------------------------------------------------------------------------
const handlers: Record<string, (...args: any[]) => void> = {};
const socket = {
  id: 'abc123def',
  connected: false,
  auth: {},
  on: mock((event: string, callback: (...args: any[]) => void) => {
    handlers[event] = callback; // remember the listener the app registered
  }),
  off: mock((event: string) => {
    delete handlers[event];
  }),
  emit: mock(),
  connect: mock(),
  disconnect: mock(),
};

mock.module('socket.io-client', () => ({ io: () => socket }));

// Import AFTER mock.module.
const { default: AuctionApp } = await import('../src/auction/AuctionApp');

// Pretend the server sent an event. act() tells React "state is about to change".
const serverSends = (event: string, data?: unknown) => {
  act(() => {
    handlers[event]?.(data);
  });
};

// ---------------------------------------------------------------------------
// 2. HELPERS
// ---------------------------------------------------------------------------
const makeAuction = (overrides = {}) => ({
  itemName: 'Test Jersey',
  currentBid: 100,
  highestBidder: null,
  endTime: Date.now() + 60_000, // ends in 1 minute
  isActive: true,
  ...overrides,
});

// Renders the app already past the email screen and with an auction loaded.
async function renderLoggedIn(auctionOverrides = {}) {
  localStorage.setItem('bidderEmail', 'me@test.com'); // pre-fills the email box
  render(<AuctionApp />);
  const user = userEvent.setup();
  await user.type(screen.getByRole('textbox'), '{Enter}'); // submit the gate
  serverSends('auction_state', makeAuction(auctionOverrides));
  return user;
}

// The bid field in BidPanel is <input type="number">, which has the "spinbutton" role.
const getBidInput = () => screen.getByRole('spinbutton');

// Fires the form's submit event directly, skipping the browser's min/required checks
// (BidPanel's input has `min` and `required`, which would block a normal submit).
const submitBidForm = () => fireEvent.submit(getBidInput().closest('form')!);

const originalFetch = globalThis.fetch;

beforeEach(() => {
  localStorage.clear();
  for (const fn of [socket.on, socket.off, socket.emit, socket.connect, socket.disconnect]) fn.mockClear();
  for (const key of Object.keys(handlers)) delete handlers[key];
});

afterEach(() => {
  globalThis.fetch = originalFetch; // undo any fake fetch
});

// ---------------------------------------------------------------------------
// 3. TESTS
// ---------------------------------------------------------------------------
describe('email gate', () => {
  it('shows the email form first, not the auction', () => {
    render(<AuctionApp />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByText('Connecting to live bid…')).not.toBeInTheDocument();
  });

  it('saves the email and moves on to "connecting"', async () => {
    const user = userEvent.setup();
    render(<AuctionApp />);

    await user.type(screen.getByRole('textbox'), 'me@test.com{Enter}');

    expect(localStorage.getItem('bidderEmail')).toBe('me@test.com');
    expect(screen.getByText('Connecting to live bid…')).toBeInTheDocument();
    expect(socket.connect).toHaveBeenCalled();
  });
});

describe('server events', () => {
  it('shows the auction when auction_state arrives', async () => {
    await renderLoggedIn();
    expect(screen.getAllByText('Test Jersey').length).toBeGreaterThan(0);
  });

  it('marks the auction as ended on auction_end', async () => {
    await renderLoggedIn();
    serverSends('auction_end', { winner: 'abc123def', winningBid: 150 });
    expect(screen.getByText(/ended/i)).toBeInTheDocument();
  });
});

describe('placing a bid', () => {
  it('rejects a bid that is too low and does not contact the server', async () => {
    const user = await renderLoggedIn({ currentBid: 100 });

    await user.type(getBidInput(), '50');
    submitBidForm();

    expect(screen.getByText('Your bid must be at least €101')).toBeInTheDocument();
    expect(socket.emit).not.toHaveBeenCalledWith('place_bid', expect.anything());
  });

  it('sends a valid bid to the server and clears the input', async () => {
    const user = await renderLoggedIn({ currentBid: 100 });

    await user.type(getBidInput(), '150{Enter}');

    expect(socket.emit).toHaveBeenCalledWith('place_bid', 150);
    expect(getBidInput()).toHaveValue(null); // number inputs report null when empty
  });

  it('disables bidding once the end time has passed', async () => {
    await renderLoggedIn({ endTime: Date.now() - 1000 });

    expect(getBidInput()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'BIDDING CLOSED' })).toBeDisabled();
  });

  it('refuses a bid submitted after the end time', async () => {
    await renderLoggedIn({ endTime: Date.now() - 1000 });

    submitBidForm();

    expect(screen.getByText('The auction has ended.')).toBeInTheDocument();
    expect(socket.emit).not.toHaveBeenCalledWith('place_bid', expect.anything());
  });
});

describe('reset button', () => {
  it('shows an error when the request fails', async () => {
    const user = await renderLoggedIn();
    globalThis.fetch = mock(async () => ({ ok: false, status: 500 })) as any;

    await user.click(screen.getByRole('button', { name: 'Reset auction' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Reset failed. Please try again.');
  });

  it('calls the reset endpoint with POST', async () => {
    const user = await renderLoggedIn();
    const fetchMock = mock(async () => ({ ok: true }));
    globalThis.fetch = fetchMock as any;

    await user.click(screen.getByRole('button', { name: 'Reset auction' }));

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/auction/reset'), { method: 'POST' });
  });
});
