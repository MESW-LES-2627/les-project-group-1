import { afterEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * The club managing its auctions in the dashboard: the actions in the list, the details view, and the
 * edit form limited to the auction settings once the item is verified.
 */

const NOW = Date.now();
const HOUR = 3_600_000;

// The hooks talk to the API; here they return fixed data and record what would be saved
let details: { data?: any; isPending: boolean; isError: boolean; error?: unknown } = { isPending: true, isError: false };
const updates: any[] = [];

mock.module('@/dashboard/hooks/use-my-listings', () => ({
  useMyListing: () => details,
  useCategories: () => ({ data: [{ id: 1, slug: 'player-jerseys', name: 'Player jerseys' }], isPending: false }),
  useSelectableCharities: () => ({ data: [{ id: 7, name: 'Play for All', country: 'PT' }], isPending: false }),
  useCreateMyListing: () => ({ mutate: mock(), isPending: false, isError: false }),
  useUpdateMyListing: () => ({
    mutate: (variables: any) => updates.push(variables),
    isPending: false,
    isError: false,
  }),
}));

const { MyListingsTable } = await import('../src/dashboard/components/dashboard/my-listings-table');
const { MyListingDetailsDialog } = await import('../src/dashboard/components/dashboard/my-listing-details-dialog');
const { ListingFormDialog } = await import('../src/dashboard/components/dashboard/listing-form-dialog');

afterEach(() => {
  cleanup();
  updates.length = 0;
  details = { isPending: true, isError: false };
});

function listing(overrides: Record<string, unknown> = {}) {
  return {
    id: 5,
    categoryId: 1,
    category: { slug: 'player-jerseys', name: 'Player jerseys' },
    title: 'Signed final shirt',
    playerName: 'Test Player',
    playerDetails: { size: 'L' },
    season: '2024/25',
    competition: 'Liga',
    match: null,
    tags: ['signed'],
    description: 'Worn in the final and signed afterwards.',
    images: ['/images/items/sl-benfica/squad-front.png'],
    status: 'verified',
    authenticityNotes: 'Certificate from the club.',
    evidenceImages: [],
    certificateCode: null,
    startingPrice: 100,
    auctionStartsAt: new Date(NOW + HOUR).toISOString(),
    auctionEndsAt: new Date(NOW + 3 * HOUR).toISOString(),
    cancelledAt: null,
    auctionStatus: 'scheduled',
    canCancel: true,
    editMode: 'auction',
    charitableOrganizationId: null,
    charitableOrganization: null,
    donationPercentage: null,
    createdAt: new Date(NOW - HOUR).toISOString(),
    verifiedAt: new Date(NOW - HOUR).toISOString(),
    ...overrides,
  } as any;
}

describe('MyListingsTable actions', () => {
  function renderTable(data: any[]) {
    const handlers = { onEdit: mock(), onDelete: mock(), onSubmit: mock(), onCancel: mock(), onView: mock() };
    render(<MyListingsTable data={data} busyId={null} {...handlers} />);
    return handlers;
  }

  it('lets the club open the details of any auction', async () => {
    const user = userEvent.setup();
    const active = listing({ auctionStatus: 'active', editMode: null, canCancel: false });
    const { onView } = renderTable([active]);

    await user.click(screen.getByRole('button', { name: 'View details' }));

    expect(onView).toHaveBeenCalledWith(active);
  });

  it('offers full editing and submitting for a draft', () => {
    renderTable([listing({ status: 'draft', auctionStatus: null, editMode: 'full' })]);

    expect(screen.getByRole('button', { name: 'Edit listing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit for verification' })).toBeInTheDocument();
  });

  it('offers editing the auction settings of a verified auction that has not opened', async () => {
    const user = userEvent.setup();
    const scheduled = listing();
    const { onEdit } = renderTable([scheduled]);

    await user.click(screen.getByRole('button', { name: 'Edit auction settings' }));

    expect(onEdit).toHaveBeenCalledWith(scheduled);
    expect(screen.queryByRole('button', { name: 'Edit listing' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Submit for verification' })).toBeNull();
  });

  it('offers no editing once the auction has opened', () => {
    renderTable([listing({ auctionStatus: 'active', editMode: null, canCancel: false })]);

    expect(screen.queryByRole('button', { name: /^Edit/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel auction' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete listing' })).toBeNull();
  });

  it('offers only viewing and deleting while the listing is under review', () => {
    renderTable([listing({ status: 'pending_verification', auctionStatus: null, editMode: null, canCancel: false })]);

    expect(screen.getByRole('button', { name: 'View details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete listing' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Edit/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel auction' })).toBeNull();
  });

  it('lets the club fix a rejected listing and submit it again, or delete it', () => {
    renderTable([listing({ status: 'rejected', auctionStatus: null, editMode: 'full', canCancel: false })]);

    expect(screen.getByRole('button', { name: 'View details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit listing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit for verification' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete listing' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel auction' })).toBeNull();
  });

  it('offers cancelling, not deleting, once the auction is approved', () => {
    renderTable([listing()]);

    expect(screen.getByRole('button', { name: 'Cancel auction' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete listing' })).toBeNull();
  });
});

describe('MyListingDetailsDialog', () => {
  it('shows the auction settings, the item and how the auction is going', () => {
    const shown = listing({
      auctionStatus: 'active',
      charitableOrganization: { id: 7, name: 'Play for All', description: '', logoUrl: null, country: 'PT', verified: true },
      donationPercentage: 15,
    });
    details = { data: { ...shown, bidCount: 3, highestBid: 180 }, isPending: false, isError: false };

    render(<MyListingDetailsDialog listing={shown} onOpenChange={mock()} />);

    expect(screen.getByRole('heading', { name: 'Signed final shirt' })).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('€100.00')).toBeInTheDocument();
    expect(screen.getByText('€180.00')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Play for All · 15%')).toBeInTheDocument();
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText('Worn in the final and signed afterwards.')).toBeInTheDocument();
    expect(screen.getByText('Certificate from the club.')).toBeInTheDocument();
  });

  it('links to the public auction page once the item is verified', () => {
    const shown = listing();
    details = { data: { ...shown, bidCount: 0, highestBid: null }, isPending: false, isError: false };

    render(<MyListingDetailsDialog listing={shown} onOpenChange={mock()} />);

    expect(screen.getByRole('link', { name: /Open the auction page/ })).toHaveAttribute('href', '/auction/5');
    expect(screen.getByText('No bids yet')).toBeInTheDocument();
  });

  it('has no public link for a draft, which nobody else can see', () => {
    const shown = listing({ status: 'draft', auctionStatus: null, editMode: 'full', auctionStartsAt: null });
    details = { data: { ...shown, bidCount: 0, highestBid: null }, isPending: false, isError: false };

    render(<MyListingDetailsDialog listing={shown} onOpenChange={mock()} />);

    expect(screen.queryByRole('link', { name: /Open the auction page/ })).toBeNull();
    expect(screen.getByText('When verified')).toBeInTheDocument();
  });
});

describe('ListingFormDialog for a verified auction that has not opened', () => {
  function renderForm(shown = listing()) {
    render(<ListingFormDialog open onOpenChange={mock()} listing={shown} />);
  }

  it('shows only the auction settings', () => {
    renderForm();

    expect(screen.getByRole('heading', { name: 'Edit auction settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Starting price (€)')).toBeInTheDocument();
    expect(screen.getByLabelText('Auction starts')).toBeRequired();
    expect(screen.getByLabelText('Auction ends')).toBeInTheDocument();
    expect(screen.getByLabelText('Support a charity (verified only)')).toBeInTheDocument();

    expect(screen.queryByLabelText('Title')).toBeNull();
    expect(screen.queryByLabelText('Description')).toBeNull();
    expect(screen.queryByLabelText('Authenticity notes')).toBeNull();
    expect(screen.queryByText('Player details')).toBeNull();
    expect(screen.queryByRole('button', { name: /submit for verification/i })).toBeNull();
  });

  it('sends only the auction settings that changed', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.clear(screen.getByLabelText('Starting price (€)'));
    await user.type(screen.getByLabelText('Starting price (€)'), '250');
    // happy-dom wrongly flags 250 as not matching step="0.01" (a rounding bug real browsers don't have),
    // which would block a click on the button, so the form is submitted directly
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveAttribute('type', 'submit');
    fireEvent.submit(screen.getByLabelText('Starting price (€)').closest('form')!);

    expect(updates).toHaveLength(1);
    expect(updates[0].id).toBe(5);
    expect(updates[0].payload.fields).toEqual({ startingPrice: '250' });
    expect(updates[0].payload.images).toEqual([]);
  });

  it('still shows the whole form for a draft', () => {
    renderForm(listing({ status: 'draft', auctionStatus: null, editMode: 'full' }));

    expect(screen.getByRole('heading', { name: 'Edit listing' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Auction starts (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit for verification/i })).toBeInTheDocument();
  });
});
