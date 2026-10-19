import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';

/* ---------- Types ---------- */

interface Bid {
  bidder: string;
  amount: number;
  timestamp: number;
  country?: string; // ISO 3166-1 alpha-2, e.g. "PT" (optional)
}

interface AuctionState {
  itemName: string;
  currentBid: number;
  highestBidder: string | null;
  endTime: number;
  isActive: boolean;
  bidCount?: number; // optional: send from the backend if you have it
  bids?: Bid[]; // optional: latest bids, newest first
}

interface WinnerData {
  winner: string | null;
  winningBid: number;
}

/* ---------- Static item content (move to the backend later) ---------- */

const ITEM = {
  subtitle: 'The Urban Flare - The Ocean Surge',
  tags: ['worn', 'signed'],
  images: ['/jersey-front.png', '/jersey-back.png'],
  player: {
    name: 'VELOCITY',
    nickname: 'The Urban Flare',
    age: 30,
    position: 'Midfielder',
    number: 10,
    size: 'M',
    nationality: 'Canadian',
    placeOfBirth: 'Canada',
    preferredFoot: 'Right',
  },
  causes: [
    {
      name: 'Fundação Semear Futuro',
      description: '100% of proceeds support sports access for underpriveleged children.',
      logo: '/cause-semear-futuro.png',
    },
    {
      name: 'Play for All Foundation',
      description: 'Supporting youth sports and community programs.',
      logo: '/cause-play-for-all.png',
    },
  ],
};

const MIN_INCREMENT = 1;
const LATEST_BIDS_SHOWN = 5;

/* ---------- Helpers ---------- */

// autoConnect is off so we only connect AFTER the listeners are registered
// (see the useEffect below). Otherwise the server's first "auction_state"
// can arrive before anyone is listening and the page stays on "Connecting".
const socket: Socket = io('http://localhost:3000', { autoConnect: false });

const formatEuro = (n: number) => `€${new Intl.NumberFormat('de-DE').format(n)}`;
const formatEuroSuffix = (n: number) => `${new Intl.NumberFormat('de-DE').format(n)} €`;

const formatTimeLeft = (ms: number): string => {
  if (ms <= 0) return 'Ended';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const plural = (v: number, w: string) => `${v} ${w}${v === 1 ? '' : 's'}`;

  if (d > 0) return `${plural(d, 'day')} ${plural(h, 'hour')} left`;
  if (h > 0) return `${plural(h, 'hour')} ${m} min left`;
  if (m > 0) return `${m} min ${s}s left`;
  return `${s}s left`;
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${month} ${d.getDate()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const flagEmoji = (cc?: string) =>
  cc && cc.length === 2
    ? String.fromCodePoint(...cc.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0)))
    : '🏳️';

const shortId = (id: string | null) => (id ? id.slice(0, 6) : '—');

/* ---------- Component ---------- */

function App() {
  const [auction, setAuction] = useState<AuctionState | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [winnerData, setWinnerData] = useState<WinnerData | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [activeImage, setActiveImage] = useState<number>(0);
  const [localBids, setLocalBids] = useState<Bid[]>([]);
  const [error, setError] = useState<string>('');
  const [myId, setMyId] = useState<string>(socket.id ?? '');
  const lastBidRef = useRef<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string>('');

  useEffect(() => {
    socket.on('auction_state', (state: AuctionState) => {
      setAuction(state);

      // If the backend doesn't send a bid history, build one from state changes
      if (!state.bids && lastBidRef.current !== null && state.currentBid > lastBidRef.current && state.highestBidder) {
        setLocalBids((prev) =>
          [{ bidder: state.highestBidder as string, amount: state.currentBid, timestamp: Date.now() }, ...prev].slice(
            0,
            50
          )
        );
      }
      lastBidRef.current = state.currentBid;
    });

    socket.on('auction_end', (data: WinnerData) => {
      setWinnerData(data);
      setAuction((prev) => (prev ? { ...prev, isActive: false } : null));
    });
    socket.on('payment_link', (url: string) => setPaymentUrl(url));

    // The server's initial "auction_state" can arrive before these listeners
    // exist (the socket connects at import time, effects run after render).
    // So ask for the state explicitly once we are listening, and again on
    // every (re)connect.
    const requestState = () => socket.emit('get_auction_state');
    const onConnect = () => {
      setMyId(socket.id ?? '');
      requestState();
    };
    const onError = (err: Error) => console.error('Socket connection error:', err.message);
    socket.on('connect', onConnect);
    socket.on('connect_error', onError);

    // Connect only now that every listener is in place
    if (socket.connected) onConnect();
    else socket.connect();

    return () => {
      socket.off('auction_state');
      socket.off('auction_end');
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      socket.off('payment_link');
      socket.disconnect();
    };
  }, []);

  // Tick every second for the countdown
  useEffect(() => {
    if (!auction?.isActive) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [auction?.isActive]);

  const handleBid = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auction) return;
    if (!auction.isActive || Date.now() >= auction.endTime) {
      setError('The auction has ended.');
      return;
    }
    const amount = Number(bidAmount);

    if (amount >= auction.currentBid + MIN_INCREMENT) {
      socket.emit('place_bid', amount);
      setBidAmount('');
      setError('');
    } else {
      setError(`Your bid must be at least ${formatEuro(auction.currentBid + MIN_INCREMENT)}`);
    }
  };

  if (!auction) return <div className="loading">Connecting to live bid…</div>;

  const minBid = auction.currentBid + MIN_INCREMENT;
  const msLeft = auction.endTime - now;
  const ended = !auction.isActive || msLeft <= 0;
  const urgent = !ended && msLeft <= 10 * 60 * 1000;
  const bids = auction.bids ?? localBids;
  const bidCount = auction.bidCount ?? bids.length;
  const { player } = ITEM;

  return (
    <main className="page">
      {/* ---------- LEFT COLUMN ---------- */}
      <section className="left">
        <div className="gallery">
          <div className="thumbs">
            {ITEM.images.map((src, i) => (
              <button
                key={src}
                type="button"
                className={`thumb ${i === activeImage ? 'active' : ''}`}
                onClick={() => setActiveImage(i)}
                aria-label={`Show image ${i + 1}`}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
          <div className="main-image">
            <img src={ITEM.images[activeImage]} alt={auction.itemName} />
          </div>
        </div>

        <h2 className="section-title">THE PLAYER</h2>
        <div className="player-card">
          <div className="player-head">
            <span className="player-name">{player.name}</span>
            <span className="player-nick">{player.nickname}</span>
          </div>
          <div className="stats-row">
            <Stat label="Age" value={String(player.age)} />
            <Stat label="Position" value={player.position} />
            <Stat label="Number" value={String(player.number)} />
            <Stat label="Size" value={player.size} />
          </div>
          <div className="stats-row bordered">
            <Stat label="Nationality" value={player.nationality} />
            <Stat label="Place of birth" value={player.placeOfBirth} />
            <Stat label="Preferred foot" value={player.preferredFoot} />
          </div>
        </div>
      </section>

      {/* ---------- RIGHT COLUMN ---------- */}
      <section className="right">
        <div className="me">
          <span className="me-dot" />
          You are bidder <strong>{shortId(myId)}</strong>
        </div>
        <div className="title-row">
          <h1>{auction.itemName}</h1>
          {ITEM.tags.map((tag) => (
            <span key={tag} className={`tag tag-${tag}`}>
              {tag}
            </span>
          ))}
        </div>
        <p className="subtitle">{ITEM.subtitle}</p>

        {!winnerData ? (
          <>
            <div className="bid-box">
              <div>
                <div className="bid-label">Current bid:</div>
                <div className="bid-value">{formatEuro(auction.currentBid)}</div>
              </div>
              <form className="bid-form" onSubmit={handleBid}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={minBid}
                  disabled={ended}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`${new Intl.NumberFormat('de-DE').format(minBid)}€`}
                  required
                />
                <button type="submit" className="bid-btn" disabled={ended}>
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                    <path d="M3 11.5 21 3l-8.5 18-2.2-7.3L3 11.5z" fill="currentColor" />
                  </svg>
                  {ended ? 'BIDDING CLOSED' : 'PLACE BID'}
                </button>
              </form>
            </div>
            {error && <p className="error">{error}</p>}

            <div className="bid-meta">
              <span>
                {bidCount} bid{bidCount === 1 ? '' : 's'}
              </span>
              <span className={urgent ? 'time urgent' : 'time'}>{formatTimeLeft(msLeft)}</span>
            </div>
            <p className="you">
              {auction.highestBidder === socket.id
                ? "You're the highest bidder!"
                : auction.highestBidder
                  ? `Highest bidder: ${shortId(auction.highestBidder)}`
                  : 'No bids yet — be the first!'}
            </p>
          </>
        ) : (
          <div className="winner-box">
            <h2>Auction ended!</h2>
            <p>
              Winner: <strong>{winnerData.winner === socket.id ? 'You!' : winnerData.winner ? shortId(winnerData.winner) : 'No one'}</strong>
            </p>
            <p>
              Winning bid: <strong>{formatEuro(winnerData.winningBid)}</strong>
            </p>
            {paymentUrl && (
              <p>
                <a href={paymentUrl}>Pay now</a>
              </p>
            )}
          </div>
        )}

        <h2 className="section-title">Supported cause</h2>
        <ul className="causes">
          {ITEM.causes.map((c) => (
            <li key={c.name}>
              <div className="cause-logo">
                <img src={c.logo} alt="" />
              </div>
              <div>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <hr />

        <div className="latest-bids">
          <div className="lb-head">
            <h3>LATEST BIDS</h3>
            <a href="#all-bids">VIEW ALL</a>
          </div>
          <table>
            <thead>
              <tr>
                <th>BIDDER</th>
                <th>DATE</th>
                <th>BID</th>
              </tr>
            </thead>
            <tbody>
              {bids.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty">
                    No bids yet
                  </td>
                </tr>
              ) : (
                bids.slice(0, LATEST_BIDS_SHOWN).map((b, i) => (
                  <tr key={`${b.timestamp}-${i}`}>
                    <td>
                      <span className="flag">{flagEmoji(b.country)}</span>
                      {shortId(b.bidder)}
                      {b.bidder === myId && <span className="you-tag">you</span>}
                    </td>
                    <td>{formatDate(b.timestamp)}</td>
                    <td>{formatEuroSuffix(b.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

export default App;
