import { describe, expect, it, mock } from 'bun:test';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BidPanel } from '../src/components/BidPanel';
import { ListingCard } from '../src/components/ListingCard';
import { formatDuration, formatTimeUntilStart } from '../src/auction/utils';
import { emptyForm, formToFields, toLocalInput } from '../src/dashboard/lib/listing-form';
import type { AuctionState } from '../src/auction/types';
import type { ListingSummary } from '../src/catalogue/types';
import { renderWithRouter } from './setup/render';

const NOW = Date.UTC(2026, 10, 20, 12);
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function auction(overrides: Partial<AuctionState> = {}): AuctionState {
  return {
    itemName: 'Signed shirt',
    currentBid: 100,
    highestBidder: null,
    endTime: NOW + HOUR,
    isActive: true,
    bidCount: 0,
    bids: [],
    status: 'active',
    startTime: NOW - HOUR,
    ...overrides,
  };
}

function renderPanel(state: AuctionState) {
  render(
    <BidPanel
      auction={state}
      bidCount={state.bidCount ?? 0}
      winnerData={null}
      paymentUrl=""
      bidAmount=""
      onBidAmountChange={mock()}
      onBid={mock()}
      error=""
      myId="me"
      now={NOW}
    />
  );
}

describe('formatDuration and formatTimeUntilStart', () => {
  it('formats durations the same way as the time left', () => {
    expect(formatDuration(26 * HOUR)).toBe('1 day 2 hours');
    expect(formatDuration(HOUR + 5 * MINUTE)).toBe('1 hour 5 min');
    expect(formatDuration(3 * MINUTE + 20_000)).toBe('3 min 20s');
    expect(formatDuration(9_000)).toBe('9s');
  });

  it('says how long until a scheduled auction opens', () => {
    expect(formatTimeUntilStart(2 * HOUR)).toBe('Opens in 2 hours 0 min');
    expect(formatTimeUntilStart(0)).toBe('Opening…');
  });
});

describe('BidPanel by auction status', () => {
  it('lets buyers bid on an active auction', () => {
    renderPanel(auction());

    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Current bid')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PLACE BID' })).toBeEnabled();
    expect(screen.getByText('1 hour 0 min left')).toBeInTheDocument();
  });

  it('shows a countdown to the opening of a scheduled auction, with bidding disabled', () => {
    renderPanel(auction({ status: 'scheduled', isActive: false, startTime: NOW + 2 * HOUR, endTime: NOW + 5 * HOUR }));

    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Starting bid')).toBeInTheDocument();
    expect(screen.getByText('Opens in 2 hours 0 min')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'NOT OPEN YET' })).toBeDisabled();
    expect(screen.getByRole('spinbutton')).toBeDisabled();
    expect(screen.getByText('Bidding opens when the countdown ends.')).toBeInTheDocument();
  });

  it('closes bidding on a completed auction', () => {
    renderPanel(auction({ status: 'completed', isActive: false, endTime: NOW - MINUTE }));

    expect(screen.getAllByText('Ended').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'BIDDING CLOSED' })).toBeDisabled();
  });

  it('says that a cancelled auction takes no more bids, with no bid form', () => {
    renderPanel(auction({ status: 'cancelled', isActive: false }));

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'This auction was cancelled' })).toBeInTheDocument();
    expect(screen.getByText('No more bids can be placed on it.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /bid/i })).toBeNull();
  });

  it('closes bidding the moment the countdown reaches zero, before the server says the auction ended', () => {
    // The server still reports it as active: only the browser clock has reached the end
    renderPanel(auction({ status: 'active', isActive: true, endTime: NOW }));

    expect(screen.getByRole('button', { name: 'BIDDING CLOSED' })).toBeDisabled();
    expect(screen.getByRole('spinbutton')).toBeDisabled();
    expect(screen.getAllByText('Ended').length).toBeGreaterThan(0);
  });

  it('still allows bidding one second before the end', () => {
    renderPanel(auction({ status: 'active', isActive: true, endTime: NOW + 1000 }));

    expect(screen.getByRole('button', { name: 'PLACE BID' })).toBeEnabled();
    expect(screen.getByText('1s left')).toBeInTheDocument();
  });

  it('works with a server that sends no status, using the active flag', () => {
    renderPanel(auction({ status: undefined, isActive: false, endTime: NOW - MINUTE }));

    expect(screen.getByRole('button', { name: 'BIDDING CLOSED' })).toBeDisabled();
  });
});

describe('ListingCard by auction status', () => {
  function listing(overrides: Partial<ListingSummary> = {}): ListingSummary {
    return {
      id: 1,
      title: 'Signed shirt',
      playerName: null,
      season: '2024/25',
      competition: 'Liga',
      match: null,
      tags: [],
      images: ['/shirt.png'],
      club: { slug: 'club', name: 'Club', logoUrl: null },
      category: { id: 1, slug: 'player-jerseys', name: 'Player jerseys' },
      currentBid: 100,
      auctionStartsAt: new Date(NOW - HOUR).toISOString(),
      auctionEndsAt: new Date(NOW + HOUR).toISOString(),
      auctionStatus: 'active',
      ...overrides,
    };
  }

  const card = () => within(screen.getByRole('article'));

  it('shows a live auction with the time left', () => {
    renderWithRouter(<ListingCard listing={listing()} now={NOW} />);

    expect(card().getByText('Live')).toBeInTheDocument();
    expect(card().getByText('current bid')).toBeInTheDocument();
    expect(card().getByText('1 hour 0 min left')).toBeInTheDocument();
  });

  it('shows a scheduled auction with a countdown to its opening', () => {
    renderWithRouter(
      <ListingCard
        listing={listing({
          auctionStatus: 'scheduled',
          auctionStartsAt: new Date(NOW + 30 * MINUTE).toISOString(),
          auctionEndsAt: new Date(NOW + 3 * HOUR).toISOString(),
        })}
        now={NOW}
      />
    );

    expect(card().getByText('Scheduled')).toBeInTheDocument();
    expect(card().getByText('starting bid')).toBeInTheDocument();
    expect(card().getByText('Opens in 30 min 0s')).toBeInTheDocument();
  });

  it('turns a scheduled auction live when the clock reaches its start, without reloading', () => {
    renderWithRouter(
      <ListingCard
        listing={listing({ auctionStatus: 'scheduled', auctionStartsAt: new Date(NOW - 1).toISOString() })}
        now={NOW}
      />
    );

    expect(card().getByText('Live')).toBeInTheDocument();
  });

  it('shows an auction as ended when the clock reaches its end, without reloading', () => {
    renderWithRouter(<ListingCard listing={listing({ auctionEndsAt: new Date(NOW).toISOString() })} now={NOW} />);

    expect(card().getAllByText('Ended').length).toBeGreaterThan(0);
  });

  it('shows a cancelled auction as cancelled', () => {
    renderWithRouter(<ListingCard listing={listing({ auctionStatus: 'cancelled' })} now={NOW} />);

    expect(card().getAllByText('Cancelled').length).toBeGreaterThan(0);
    expect(card().queryByText(/left$/)).toBeNull();
  });
});

describe('MyListingsTable: auction status and cancelling', async () => {
  const { MyListingsTable } = await import('../src/dashboard/components/dashboard/my-listings-table');

  function myListing(overrides: Record<string, unknown>) {
    return {
      id: 1,
      categoryId: 1,
      category: { slug: 'player-jerseys', name: 'Player jerseys' },
      title: 'Signed shirt',
      playerName: null,
      playerDetails: null,
      season: null,
      competition: null,
      match: null,
      tags: [],
      description: 'A shirt.',
      images: [],
      status: 'verified',
      authenticityNotes: null,
      evidenceImages: [],
      certificateCode: null,
      startingPrice: 100,
      auctionStartsAt: new Date(NOW + HOUR).toISOString(),
      auctionEndsAt: new Date(NOW + 2 * HOUR).toISOString(),
      cancelledAt: null,
      auctionStatus: 'scheduled',
      canCancel: true,
      editMode: 'auction',
      charitableOrganizationId: null,
      charitableOrganization: null,
      donationPercentage: null,
      createdAt: new Date(NOW).toISOString(),
      verifiedAt: new Date(NOW).toISOString(),
      ...overrides,
    } as any;
  }

  function renderTable(data: any[], onCancel = mock()) {
    render(
      <MyListingsTable
        data={data}
        busyId={null}
        onEdit={mock()}
        onDelete={mock()}
        onSubmit={mock()}
        onCancel={onCancel}
        onView={mock()}
      />
    );
    return onCancel;
  }

  it('shows the auction status of each listing', () => {
    renderTable([
      myListing({ id: 1, title: 'Scheduled one', auctionStatus: 'scheduled' }),
      myListing({ id: 2, title: 'Active one', auctionStatus: 'active', canCancel: false }),
    ]);

    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('lets the club cancel when the server says it can', async () => {
    const user = userEvent.setup();
    const listingToCancel = myListing({});
    const onCancel = renderTable([listingToCancel]);

    await user.click(screen.getByRole('button', { name: 'Cancel auction' }));

    expect(onCancel).toHaveBeenCalledWith(listingToCancel);
  });

  it('hides the cancel button once the auction has opened', () => {
    renderTable([myListing({ auctionStatus: 'active', canCancel: false })]);

    expect(screen.queryByRole('button', { name: 'Cancel auction' })).toBeNull();
  });

  it('hides editing and submitting for a cancelled draft', () => {
    renderTable([
      myListing({ status: 'draft', auctionStatus: 'cancelled', cancelledAt: new Date(NOW).toISOString(), canCancel: false, editMode: null }),
    ]);

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit listing' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Submit for verification' })).toBeNull();
  });

  it('says the auction opens when verified if no start date was chosen', () => {
    renderTable([myListing({ status: 'draft', auctionStartsAt: null, auctionStatus: null, editMode: 'full' })]);

    expect(screen.getByText('when verified')).toBeInTheDocument();
  });
});

describe('AdminListingsTable: auction status and cancelling', async () => {
  const { AdminListingsTable } = await import('../src/dashboard/components/dashboard/admin-listings-table');

  function adminListing(overrides: Record<string, unknown>) {
    return {
      id: 1,
      categoryId: 1,
      category: { slug: 'player-jerseys', name: 'Player jerseys' },
      title: 'Signed shirt',
      playerName: null,
      playerDetails: null,
      season: null,
      competition: null,
      match: null,
      tags: [],
      description: 'A shirt.',
      images: [],
      status: 'verified',
      authenticityNotes: null,
      evidenceImages: [],
      certificateCode: null,
      startingPrice: 100,
      auctionStartsAt: new Date(NOW - HOUR).toISOString(),
      auctionEndsAt: new Date(NOW + HOUR).toISOString(),
      cancelledAt: null,
      auctionStatus: 'active',
      canCancel: true,
      createdAt: new Date(NOW).toISOString(),
      verifiedAt: new Date(NOW).toISOString(),
      ...overrides,
    } as any;
  }

  function renderTable(data: any[], onCancel = mock()) {
    render(<AdminListingsTable data={data} busyId={null} onChangeStatus={mock()} onView={mock()} onCancel={onCancel} />);
    return onCancel;
  }

  it('lets the admin cancel an active auction', async () => {
    const user = userEvent.setup();
    const active = adminListing({});
    const onCancel = renderTable([active]);

    expect(screen.getByText('Active')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledWith(active);
  });

  it('shows when a scheduled auction opens', () => {
    const opens = new Date(NOW + HOUR);
    renderTable([adminListing({ auctionStatus: 'scheduled', auctionStartsAt: opens.toISOString() })]);

    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText(`Opens ${opens.toLocaleString()}`)).toBeInTheDocument();
  });

  it('offers no cancel or verification actions for a cancelled auction', () => {
    renderTable([
      adminListing({ status: 'pending_verification', auctionStatus: 'cancelled', cancelledAt: new Date(NOW).toISOString(), canCancel: false }),
    ]);

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /verify/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /set pending/i })).toBeNull();
  });

  it('offers verify or reject for a listing under review, but no cancel', async () => {
    const user = userEvent.setup();
    const onChangeStatus = mock();
    const pending = adminListing({ status: 'pending_verification', auctionStatus: null, canCancel: false });
    render(<AdminListingsTable data={[pending]} busyId={null} onChangeStatus={onChangeStatus} onView={mock()} onCancel={mock()} />);

    await user.click(screen.getByRole('button', { name: /reject/i }));
    expect(onChangeStatus).toHaveBeenCalledWith(pending, 'rejected');
    await user.click(screen.getByRole('button', { name: /verify/i }));
    expect(onChangeStatus).toHaveBeenCalledWith(pending, 'verified');
    expect(screen.queryByRole('button', { name: /cancel/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /set pending/i })).toBeNull();
  });

  it('only lets the admin view a rejected listing, which is now up to the club', () => {
    renderTable([adminListing({ status: 'rejected', auctionStatus: null, canCancel: false })]);

    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
    for (const name of [/reject/i, /verify/i, /set pending/i, /cancel/i]) {
      expect(screen.queryByRole('button', { name })).toBeNull();
    }
  });

  it('offers set pending and cancel for a verified auction, but not reject', () => {
    renderTable([adminListing({})]);

    expect(screen.getByRole('button', { name: /set pending/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).toBeNull();
  });

  it('offers no cancel action for a completed auction', () => {
    renderTable([adminListing({ auctionStatus: 'completed', canCancel: false })]);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).toBeNull();
  });
});

describe('countdown and time zones', () => {
  // Runs fn as if the computer were in another time zone (Bun applies TZ changes straight away)
  function inTimeZone<T>(zone: string, fn: () => T): T {
    const previous = process.env.TZ;
    process.env.TZ = zone;
    try {
      return fn();
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  }

  function cardText(auctionEndsAt: string) {
    const { unmount } = renderWithRouter(
      <ListingCard
        listing={{
          id: 1,
          title: 'Signed shirt',
          playerName: null,
          season: null,
          competition: null,
          match: null,
          tags: [],
          images: ['/shirt.png'],
          club: { slug: 'club', name: 'Club', logoUrl: null },
          category: { id: 1, slug: 'player-jerseys', name: 'Player jerseys' },
          currentBid: 100,
          auctionStartsAt: new Date(NOW - HOUR).toISOString(),
          auctionEndsAt,
          auctionStatus: 'active',
        }}
        now={NOW}
      />
    );
    const text = screen.getByRole('article').textContent;
    unmount();
    return text;
  }

  it('shows the same time left for the same moment, whatever time zone it is written in', () => {
    // NOW is 12:00 UTC; the auction ends two hours later, at 14:00 UTC
    const utc = cardText('2026-11-20T14:00:00.000Z');
    const lisbonWinter = cardText('2026-11-20T14:00:00+00:00');
    const madrid = cardText('2026-11-20T15:00:00+01:00');
    const saoPaulo = cardText('2026-11-20T11:00:00-03:00');

    expect(utc).toContain('2 hours 0 min left');
    expect(lisbonWinter).toBe(utc);
    expect(madrid).toBe(utc);
    expect(saoPaulo).toBe(utc);
  });

  it('shows the same time left to buyers in different time zones', () => {
    const endsAt = new Date(NOW + 2 * HOUR).toISOString();

    const inLisbon = inTimeZone('Europe/Lisbon', () => cardText(endsAt));
    const inTokyo = inTimeZone('Asia/Tokyo', () => cardText(endsAt));
    const inSaoPaulo = inTimeZone('America/Sao_Paulo', () => cardText(endsAt));

    expect(inLisbon).toContain('2 hours 0 min left');
    expect(inTokyo).toBe(inLisbon);
    expect(inSaoPaulo).toBe(inLisbon);
  });

  it("saves the date the club typed in its own time zone as the right moment", () => {
    // A club in Lisbon and one in São Paulo both type 18:30: those are different moments
    const fromLisbon = inTimeZone('Europe/Lisbon', () =>
      formToFields({ ...emptyForm(), auctionEndsAt: '2030-05-01T18:30' }, emptyForm())
    );
    const fromSaoPaulo = inTimeZone('America/Sao_Paulo', () =>
      formToFields({ ...emptyForm(), auctionEndsAt: '2030-05-01T18:30' }, emptyForm())
    );

    expect(fromLisbon.auctionEndsAt).toBe('2030-05-01T17:30:00.000Z'); // Lisbon is UTC+1 in May
    expect(fromSaoPaulo.auctionEndsAt).toBe('2030-05-01T21:30:00.000Z'); // São Paulo is UTC-3
  });

  it('shows a saved date in the viewer\'s own time zone when editing', () => {
    const saved = '2030-05-01T17:30:00.000Z';

    expect(inTimeZone('Europe/Lisbon', () => toLocalInput(saved))).toBe('2030-05-01T18:30');
    expect(inTimeZone('America/Sao_Paulo', () => toLocalInput(saved))).toBe('2030-05-01T14:30');
  });

  it('keeps the same moment when a date is loaded into the form and saved again', () => {
    for (const zone of ['Europe/Lisbon', 'Asia/Tokyo', 'America/Sao_Paulo']) {
      const saved = '2030-05-01T17:30:00.000Z';
      const fields = inTimeZone(zone, () =>
        formToFields({ ...emptyForm(), auctionEndsAt: toLocalInput(saved) }, emptyForm())
      );
      expect(fields.auctionEndsAt).toBe(saved);
    }
  });
});
