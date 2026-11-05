import { useEffect, useState } from 'react';
import { formatEuro } from '../auction/utils';
import { fetchPurchases } from '../profile/api';
import type { Purchase } from '../profile/api';

interface PurchasedJerseysProps {
  token: string;
}

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; purchases: Purchase[] };

function formatDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PurchasedJerseys({ token }: PurchasedJerseysProps) {
  const [state, setState] = useState<State>(
    token ? { status: 'loading' } : { status: 'ready', purchases: [] }
  );

  useEffect(() => {
    if (!token) return;
    let active = true;
    setState({ status: 'loading' });
    fetchPurchases(token)
      .then((purchases) => {
        if (active) setState({ status: 'ready', purchases });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [token]);

  const purchases = state.status === 'ready' ? state.purchases : [];

  return (
    <section className="mt-12 border-t-4 border-ink-line pt-8">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-black text-ink-strong uppercase">My jerseys</h2>
        <span
          aria-label="Jerseys bought"
          className="flex size-12 items-center justify-center rounded-full bg-ink-strong text-xl font-black text-white"
        >
          {purchases.length}
        </span>
      </div>

      {state.status === 'loading' && <p className="mt-6 text-ink-soft">Loading your jerseys…</p>}
      {state.status === 'error' && <p className="mt-6 text-red-700">Could not load your jerseys.</p>}
      {state.status === 'ready' && purchases.length === 0 && (
        <p className="mt-6 text-lg text-ink-soft">You haven't bought any jerseys yet.</p>
      )}
      {purchases.length > 0 && (
        <ul className="mt-6 grid grid-cols-3 gap-6 max-tablet:grid-cols-2 max-mobile:grid-cols-1">
          {purchases.map((purchase) => (
            <li key={purchase.id} className="rounded-[22px] border-2 border-ink-strong p-5">
              <p className="text-xl font-black text-ink-strong uppercase">{purchase.itemName}</p>
              <p className="mt-2 text-lg font-semibold">{formatEuro(purchase.amount)}</p>
              {purchase.paidAt && <p className="text-sm text-ink-soft">Paid on {formatDate(purchase.paidAt)}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}