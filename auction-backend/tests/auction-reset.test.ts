// This test verifies the auction reset endpoint works.
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { AddressInfo } from 'node:net';
import { io, type Socket } from 'socket.io-client';

// Configure external integrations before importing the server.
process.env.STRIPE_SECRET_KEY = 'sk_test_auction_reset';
process.env.RESEND_API_KEY = 're_test_auction_reset';
process.env.FRONTEND_URL = 'http://localhost:5173';

const { httpServer } = await import('../index');

interface AuctionState {
  itemName: string;
  currentBid: number;
  highestBidder: string | null;
  endTime: number;
  isActive: boolean;
}

function waitForEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event, (data: T) => resolve(data));
  });
}

// This suite tests the auction reset functionality via the API and WebSocket events.
describe('POST /api/auction/reset', () => {
  let socket: Socket;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(0, '127.0.0.1', resolve);
    });

    const address = httpServer.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
    socket = io(baseUrl, {
      autoConnect: false,
      reconnection: false,
      auth: { email: 'reset-test@example.com' },
    });

    const connected = waitForEvent<void>(socket, 'connect');
    const initialState = waitForEvent<AuctionState>(socket, 'auction_state');
    socket.connect();
    await connected;
    await initialState;
  });

  afterAll(async () => {
    socket.disconnect();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  // The test itself verifies that placing a bid updates the auction state and that resetting the auction restores the initial state and broadcasts the reset to connected clients.
  test('restores the initial auction and broadcasts the reset to connected bidders', async () => {
    const bidUpdate = waitForEvent<AuctionState>(socket, 'auction_state');
    socket.emit('place_bid', 125);
    expect(await bidUpdate).toMatchObject({
      currentBid: 125,
      highestBidder: socket.id,
      isActive: true,
    });

    const resetState = waitForEvent<AuctionState>(socket, 'auction_state');
    const resetSignal = waitForEvent<void>(socket, 'auction_reset');
    const requestStartedAt = Date.now();
    const response = await fetch(`${baseUrl}/api/auction/reset`, { method: 'POST' });
    const body = (await response.json()) as { success: boolean; auction: AuctionState };
    const broadcastState = await resetState;
    await resetSignal;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.auction).toMatchObject({
      itemName: 'Velocity',
      currentBid: 50,
      highestBidder: null,
      isActive: true,
    });
    expect(body.auction.endTime).toBeGreaterThanOrEqual(requestStartedAt + 119_000);
    expect(body.auction.endTime).toBeLessThanOrEqual(Date.now() + 120_000);
    expect(broadcastState).toEqual(body.auction);
  });
});
