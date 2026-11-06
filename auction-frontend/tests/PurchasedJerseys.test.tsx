import { afterEach, describe, expect, it } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { PurchasedJerseys } from '../src/components/PurchasedJerseys';

const originalFetch = globalThis.fetch;

function mockResponse(status: number, body: unknown) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch;
}

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe('PurchasedJerseys', () => {
  it('shows zero and an empty message when nothing was bought', async () => {
    mockResponse(200, { purchases: [] });
    render(<PurchasedJerseys token="abc" />);

    expect(await screen.findByText("You haven't bought any jerseys yet.")).toBeInTheDocument();
    expect(screen.getByLabelText('Jerseys bought')).toHaveTextContent('0');
  });

  it('shows the count and each purchased jersey', async () => {
    mockResponse(200, {
      purchases: [{ id: 1, itemName: 'Velocity', amount: 56, paidAt: '2026-11-05T01:30:00.000Z' }],
    });
    render(<PurchasedJerseys token="abc" />);

    expect(await screen.findByText('Velocity')).toBeInTheDocument();
    expect(screen.getByLabelText('Jerseys bought')).toHaveTextContent('1');
    expect(screen.getByText(/Paid on/)).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    mockResponse(500, { error: 'Internal server error.' });
    render(<PurchasedJerseys token="abc" />);

    expect(await screen.findByText('Could not load your jerseys.')).toBeInTheDocument();
  });

  it('shows zero without calling the server when there is no token', () => {
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response('{}');
    }) as unknown as typeof fetch;
    render(<PurchasedJerseys token="" />);

    expect(screen.getByLabelText('Jerseys bought')).toHaveTextContent('0');
    expect(called).toBe(false);
  });
});