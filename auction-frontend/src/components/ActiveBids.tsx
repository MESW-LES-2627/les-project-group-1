import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatEuro, formatTimeLeft } from '../auction/utils';
import { fetchActiveBids } from '../profile/api';
import type { ActiveBid } from '../profile/api';

interface ActiveBidsProps {
  token: string;
}

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; activeBids: ActiveBid[] };

/**
 * Profile section that lists active auctions in which the authenticated user has placed bids.
 * Displays each item's current highest bid, live countdown, highest-bidder badge, and auction link.
 */
export function ActiveBids({ token }: ActiveBidsProps) {
  const [state, setState] = useState<State>(
    token ? { status: 'loading' } : { status: 'ready', activeBids: [] }
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchActiveBids(token)
      .then((activeBids) => {
        if (active) setState({ status: 'ready', activeBids });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [token]);

  // Update countdown every second while there are active bids on screen
  useEffect(() => {
    if (state.status !== 'ready' || state.activeBids.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [state]);

  const activeBids = state.status === 'ready' ? state.activeBids.filter((item) => new Date(item.auctionEndsAt).getTime() > now) : [];

  return (
    <section className="mt-12 border-t-4 border-ink-line pt-8">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-black text-ink-strong uppercase">Active bids</h2>
        <span
          aria-label="Active bids count"
          className="flex size-12 items-center justify-center rounded-full bg-ink-strong text-xl font-black text-white"
        >
          {activeBids.length}
        </span>
      </div>

      {state.status === 'loading' && <p className="mt-6 text-ink-soft">Loading your active bids…</p>}
      {state.status === 'error' && <p className="mt-6 text-red-700">Could not load your active bids.</p>}
      {state.status === 'ready' && activeBids.length === 0 && (
        <p className="mt-6 text-lg text-ink-soft">You have no active bids at the moment.</p>
      )}
      {activeBids.length > 0 && (
        <ul className="mt-6 grid grid-cols-3 gap-6 max-tablet:grid-cols-2 max-mobile:grid-cols-1">
          {activeBids.map((item) => {
            const msLeft = new Date(item.auctionEndsAt).getTime() - now;
            return (
              <li
                key={item.listingId}
                className="flex flex-col justify-between rounded-[22px] border-2 border-ink-strong p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      title={item.clubName}
                      className="min-w-0 truncate text-xs font-bold tracking-wide text-ink-soft uppercase"
                    >
                      {item.clubName}
                    </span>
                    {item.isHighestBidder ? (
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800 uppercase">
                        Highest bidder
                      </span>
                    ) : (
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 uppercase">
                        Outbid
                      </span>
                    )}
                  </div>

                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="mt-3 h-36 w-full rounded-xl object-contain bg-surface p-2"
                    />
                  )}

                  <p className="mt-3 text-xl font-black text-ink-strong uppercase">{item.title}</p>

                  <div className="mt-3 space-y-1">
                    <p className="text-lg font-semibold">
                      Current bid: <span className="font-black">{formatEuro(item.currentHighestBid)}</span>
                    </p>
                    <p className="text-sm text-ink-soft">
                      Your highest bid: {formatEuro(item.userHighestBid)}
                    </p>
                    <p className="text-sm font-bold text-ink-strong">
                      Time left: {formatTimeLeft(msLeft)}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/auction/${item.listingId}`}
                  className="mt-5 inline-block rounded-2xl border-2 border-ink-strong px-4 py-2.5 text-center text-sm font-black text-ink-strong uppercase transition-colors hover:bg-ink-strong hover:text-white"
                >
                  View auction
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}