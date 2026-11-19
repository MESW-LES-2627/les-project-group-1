// Tests for the highest bid rules: bid calculation in placeBid and consistency across users.
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { AddressInfo } from 'node:net';
import { io, type Socket } from 'socket.io-client';
import type { AuctionRoom } from '../src/services/auction.service';

// Configure external integrations before importing the server.
process.env.STRIPE_SECRET_KEY = 'sk_test_highest_bid';
process.env.RESEND_API_KEY = 're_test_highest_bid';
process.env.FRONTEND_URL = 'http://localhost:5173';

const { httpServer } = await import('../src/app');
const { placeBid, resetRoom } = await import('../src/services/auction.service');

interface AuctionState {
  currentBid: number;
  highestBidder: string | null;
}

// Builds an isolated room, so these unit tests never touch the shared demo auction.
const makeRoom = (overrides: Partial<AuctionRoom['state']> = {}): AuctionRoom => ({
  startingPrice: 50,
  highestBidderEmail: null,
  state: {
    itemName: 'Test Jersey',
    currentBid: 50,
    highestBidder: null,
    endTime: Date.now() + 60_000,
    isActive: true,
    bidCount: 0,
    bids: [],
    ...overrides,
  },
});

const alice = { name: 'alice', email: 'alice@example.com' };
const bob = { name: 'bob', email: 'bob@example.com' };

function waitForEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event, (data: T) => resolve(data));
  });
}

describe('placeBid: highest bid calculation', () => {
  test('accepts a higher bid and updates the highest bid', () => {
    const room = makeRoom();

    expect(placeBid(room, 80, alice)).toBe(true);

    expect(room.state.currentBid).toBe(80);
    expect(room.state.highestBidder).toBe('alice');
    expect(room.state.bidCount).toBe(1);
    expect(room.highestBidderEmail).toBe('alice@example.com');
  });

  test('rejects equal and lower bids without changing the auction', () => {
    const room = makeRoom({ currentBid: 100, highestBidder: 'bob' });

    expect(placeBid(room, 100, alice)).toBe(false);
    expect(placeBid(room, 99, alice)).toBe(false);

    expect(room.state.currentBid).toBe(100);
    expect(room.state.highestBidder).toBe('bob');
    expect(room.state.bidCount).toBe(0);
  });

  test('keeps the highest of several bids', () => {
    const room = makeRoom();

    placeBid(room, 60, alice);
    placeBid(room, 90, bob);
    expect(placeBid(room, 70, alice)).toBe(false); // lower than the current highest
    placeBid(room, 95, alice);

    expect(room.state.currentBid).toBe(95);
    expect(room.state.highestBidder).toBe('alice');
    expect(room.state.bidCount).toBe(3);
  });

  test('ignores amounts that are not valid numbers', () => {
    const room = makeRoom();

    expect(placeBid(room, NaN, alice)).toBe(false);
    expect(placeBid(room, Infinity, alice)).toBe(false);
    expect(placeBid(room, '200' as unknown as number, alice)).toBe(false);

    expect(room.state.currentBid).toBe(50);
  });

  test('rejects bids once the auction has ended', () => {
    const expired = makeRoom({ endTime: Date.now() - 1000 });
    const inactive = makeRoom({ isActive: false });

    expect(placeBid(expired, 80, alice)).toBe(false);
    expect(placeBid(inactive, 80, alice)).toBe(false);
    expect(expired.state.currentBid).toBe(50);
  });

  test('goes back to the starting bid after a reset', () => {
    const room = makeRoom();
    placeBid(room, 80, alice);

    resetRoom(room);

    expect(room.state.currentBid).toBe(50);
    expect(room.state.highestBidder).toBeNull();
  });
});

describe('highest bid across users', () => {
  let baseUrl: string;
  let aliceSocket: Socket;
  let bobSocket: Socket;

  // Connects a user without an email, so the server does not query the database for a profile.
  async function connectUser(username: string) {
    const socket = io(baseUrl, { autoConnect: false, reconnection: false, auth: { username } });
    const initialState = waitForEvent<AuctionState>(socket, 'auction_state');
    socket.connect();
    await initialState;
    return socket;
  }

  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;

    // Start from a clean demo auction, whatever other test files did before.
    await fetch(`${baseUrl}/api/auction/reset`, { method: 'POST' });

    aliceSocket = await connectUser('alice');
    bobSocket = await connectUser('bob');
  });

  afterAll(async () => {
    aliceSocket.disconnect();
    bobSocket.disconnect();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  // The tests below run in order and share the same auction, so each one only uses higher amounts.
  test('every user sees the same highest bid after an accepted bid', async () => {
    const aliceSees = waitForEvent<AuctionState>(aliceSocket, 'auction_state');
    const bobSees = waitForEvent<AuctionState>(bobSocket, 'auction_state');

    aliceSocket.emit('place_bid', 80);

    expect(await aliceSees).toMatchObject({ currentBid: 80, highestBidder: 'alice' });
    expect(await bobSees).toMatchObject({ currentBid: 80, highestBidder: 'alice' });
  });

  test('a rejected bid is not broadcast and the highest bid does not change', async () => {
    const aliceSees = waitForEvent<AuctionState>(aliceSocket, 'auction_state');
    const bobSees = waitForEvent<AuctionState>(bobSocket, 'auction_state');

    // Messages are handled in order: if 70 were accepted, the next state would show 70, not 150.
    bobSocket.emit('place_bid', 70);
    bobSocket.emit('place_bid', 150);

    expect(await aliceSees).toMatchObject({ currentBid: 150, highestBidder: 'bob' });
    expect(await bobSees).toMatchObject({ currentBid: 150, highestBidder: 'bob' });
  });
});