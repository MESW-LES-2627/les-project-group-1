// Tests for the bidding history: entry contents, ordering, live updates and reset.
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { AddressInfo } from 'node:net';
import { io, type Socket } from 'socket.io-client';
import type { AuctionRoom } from '../src/services/auction.service';

// Configure external integrations before importing the server.
process.env.STRIPE_SECRET_KEY = 'sk_test_bidding_history';
process.env.RESEND_API_KEY = 're_test_bidding_history';
process.env.FRONTEND_URL = 'http://localhost:5173';

const { httpServer } = await import('../src/app');
const { placeBid, resetRoom } = await import('../src/services/auction.service');

interface BidEntry {
  bidder: string;
  country?: string;
  amount: number;
  timestamp: number;
}

interface AuctionState {
  currentBid: number;
  bids: BidEntry[];
}

// Builds an isolated room, so these unit tests never touch the shared demo auction.
const makeRoom = (): AuctionRoom => ({
  startingPrice: 50,
  status: 'verified',
  startsAt: null,
  highestBidderEmail: null,
  state: {
    itemName: 'Test Jersey',
    currentBid: 50,
    highestBidder: null,
    endTime: Date.now() + 60_000,
    isActive: true,
    bidCount: 0,
    bids: [],
  },
});

const alice = { name: 'alice', email: 'alice@example.com', country: 'PT' };
const bob = { name: 'bob', email: 'bob@example.com' };

function waitForEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event, (data: T) => resolve(data));
  });
}

describe('placeBid: bidding history', () => {
  test('starts empty', () => {
    expect(makeRoom().state.bids).toEqual([]);
  });

  test('each entry has the amount, the bidder, the country and the submission time', () => {
    const room = makeRoom();
    const before = Date.now();

    placeBid(room, 80, alice);

    const after = Date.now();
    expect(room.state.bids).toHaveLength(1);
    expect(room.state.bids[0]).toMatchObject({ bidder: 'alice', country: 'PT', amount: 80 });
    expect(room.state.bids[0]!.timestamp).toBeGreaterThanOrEqual(before);
    expect(room.state.bids[0]!.timestamp).toBeLessThanOrEqual(after);
  });

  test('lists the most recent bid first', () => {
    const room = makeRoom();

    placeBid(room, 60, alice);
    placeBid(room, 90, bob);
    placeBid(room, 120, alice);

    expect(room.state.bids.map((bid) => bid.amount)).toEqual([120, 90, 60]);
    expect(room.state.bids.map((bid) => bid.bidder)).toEqual(['alice', 'bob', 'alice']);

    const timestamps = room.state.bids.map((bid) => bid.timestamp);
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a)); // never older entries first
  });

  test('does not add rejected bids to the history', () => {
    const room = makeRoom();
    placeBid(room, 100, alice);

    placeBid(room, 100, bob); // equal
    placeBid(room, 70, bob); // lower
    placeBid(room, NaN, bob); // invalid

    expect(room.state.bids).toHaveLength(1);
    expect(room.state.bids[0]!.amount).toBe(100);
  });

  test('the history length matches the bid count', () => {
    const room = makeRoom();

    placeBid(room, 60, alice);
    placeBid(room, 70, bob);

    expect(room.state.bids).toHaveLength(room.state.bidCount);
  });

  test('is cleared after a reset', () => {
    const room = makeRoom();
    placeBid(room, 60, alice);

    resetRoom(room);

    expect(room.state.bids).toEqual([]);
  });
});

describe('bidding history across users', () => {
  let baseUrl: string;
  let aliceSocket: Socket;
  let bobSocket: Socket;
  const extraSockets: Socket[] = [];

  // Connects a user without an email, so the server does not query the database for a profile.
  async function connectUser(username: string) {
    const socket = io(baseUrl, { autoConnect: false, reconnection: false, auth: { username } });
    const initialState = waitForEvent<AuctionState>(socket, 'auction_state');
    socket.connect();
    const state = await initialState;
    return { socket, state };
  }

  // Places a bid and waits until both connected users have received the update.
  async function bid(from: Socket, amount: number) {
    const updates = Promise.all([
      waitForEvent<AuctionState>(aliceSocket, 'auction_state'),
      waitForEvent<AuctionState>(bobSocket, 'auction_state'),
    ]);
    from.emit('place_bid', amount);
    return updates;
  }

  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;

    // Start from a clean demo auction, whatever other test files did before.
    await fetch(`${baseUrl}/api/auction/reset`, { method: 'POST' });

    aliceSocket = (await connectUser('alice')).socket;
    bobSocket = (await connectUser('bob')).socket;
  });

  afterAll(async () => {
    aliceSocket.disconnect();
    bobSocket.disconnect();
    for (const socket of extraSockets) socket.disconnect();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  // The tests below run in order and share the same auction.
  test('every user receives the history updated with the new bid, most recent first', async () => {
    await bid(aliceSocket, 80);
    const [aliceState, bobState] = await bid(bobSocket, 120);

    for (const state of [aliceState, bobState]) {
      expect(state.bids.map((entry) => entry.amount)).toEqual([120, 80]);
      expect(state.bids.map((entry) => entry.bidder)).toEqual(['bob', 'alice']);
    }
  });

  test('a user who joins later receives the existing history', async () => {
    const { socket, state } = await connectUser('carol');
    extraSockets.push(socket);

    expect(state.bids.map((entry) => entry.amount)).toEqual([120, 80]);
  });

  test('the history is cleared for everyone when the auction is reset', async () => {
    const resets = Promise.all([
      waitForEvent<AuctionState>(aliceSocket, 'auction_state'),
      waitForEvent<AuctionState>(bobSocket, 'auction_state'),
    ]);

    await fetch(`${baseUrl}/api/auction/reset`, { method: 'POST' });

    for (const state of await resets) {
      expect(state.bids).toEqual([]);
    }
  });
});