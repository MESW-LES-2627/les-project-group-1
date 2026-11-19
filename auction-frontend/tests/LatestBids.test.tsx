import { afterEach, describe, expect, it } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LatestBids } from '../src/components/LatestBids';
import { LATEST_BIDS_SHOWN } from '../src/auction/data';
import { formatDate, formatEuroSuffix } from '../src/auction/utils';
import type { Bid } from '../src/auction/types';

afterEach(cleanup);

// Builds `count` bids, already ordered with the most recent first (like the backend sends them).
const makeBids = (count: number): Bid[] =>
  Array.from({ length: count }, (_, index) => ({
    bidder: `bidder${index}-xyz`,
    amount: 100 + (count - index) * 10, // highest amount first
    timestamp: 1_700_000_000_000 - index * 60_000, // most recent first
  }));

// The first row is the table header, so the bids start at index 1.
const getBidRows = () => screen.getAllByRole('row').slice(1);

describe('LatestBids', () => {
  it('shows a message when there are no bids', () => {
    render(<LatestBids bids={[]} myId="" />);

    expect(screen.getByText('No bids yet')).toBeInTheDocument();
  });

  it('shows the amount and the date/time of each bid', () => {
    const bids = makeBids(2);
    render(<LatestBids bids={bids} myId="" />);

    for (const bid of bids) {
      expect(screen.getByText(formatEuroSuffix(bid.amount))).toBeInTheDocument();
      expect(screen.getByText(formatDate(bid.timestamp))).toBeInTheDocument();
    }
  });

  it('lists the bids in the order received, most recent first', () => {
    const bids = makeBids(3);
    render(<LatestBids bids={bids} myId="" />);

    const rows = getBidRows();
    expect(rows).toHaveLength(3);
    bids.forEach((bid, index) => {
      expect(rows[index]).toHaveTextContent(formatEuroSuffix(bid.amount));
    });
  });

  it('shows only a shortened bidder id', () => {
    render(<LatestBids bids={[{ bidder: 'abcdefghij', amount: 120, timestamp: Date.now() }]} myId="" />);

    expect(screen.getByText('abcdef')).toBeInTheDocument();
    expect(screen.queryByText(/abcdefghij/)).not.toBeInTheDocument();
  });

  it('marks the bids of the current user with a "you" badge', () => {
    render(<LatestBids bids={[{ bidder: 'me-user', amount: 120, timestamp: Date.now() }]} myId="me-user" />);

    expect(screen.getByText('you')).toBeInTheDocument();
  });

  it('shows only the latest bids and lets the user see all of them', async () => {
    const user = userEvent.setup();
    const bids = makeBids(LATEST_BIDS_SHOWN + 2);
    render(<LatestBids bids={bids} myId="" />);

    expect(getBidRows()).toHaveLength(LATEST_BIDS_SHOWN);

    await user.click(screen.getByRole('button', { name: 'View all' }));
    expect(getBidRows()).toHaveLength(LATEST_BIDS_SHOWN + 2);

    await user.click(screen.getByRole('button', { name: 'Show less' }));
    expect(getBidRows()).toHaveLength(LATEST_BIDS_SHOWN);
  });

  it('does not offer "View all" when every bid is already visible', () => {
    render(<LatestBids bids={makeBids(LATEST_BIDS_SHOWN)} myId="" />);

    expect(screen.queryByRole('button', { name: 'View all' })).not.toBeInTheDocument();
  });

  it('shows a new bid at the top when the list is updated', () => {
    const bids = makeBids(2);
    const { rerender } = render(<LatestBids bids={bids} myId="" />);

    const newBid: Bid = { bidder: 'newcomer', amount: 999, timestamp: Date.now() };
    rerender(<LatestBids bids={[newBid, ...bids]} myId="" />);

    expect(getBidRows()[0]).toHaveTextContent(formatEuroSuffix(999));
  });
});