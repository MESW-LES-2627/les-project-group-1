import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { io } from 'socket.io-client';
import { AuctionPage } from './AuctionPage';
import { EmailGate } from '../components/EmailGate';
import { MIN_INCREMENT } from './data';
import type { AuctionState, Bid, WinnerData } from './types';
import { formatEuro } from './utils';

// Register event listeners before connecting so the initial state is not missed.
const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
const socket = io(socketUrl, { autoConnect: false });
const INITIAL_NOW = Date.now();

function AuctionApp() {
  const [auction, setAuction] = useState<AuctionState | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [winnerData, setWinnerData] = useState<WinnerData | null>(null);
  const [now, setNow] = useState(INITIAL_NOW);
  const [activeImage, setActiveImage] = useState(0);
  const [localBids, setLocalBids] = useState<Bid[]>([]);
  const [error, setError] = useState('');
  const [myId, setMyId] = useState(socket.id ?? '');
  const lastBidRef = useRef<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState(() => localStorage.getItem('bidderEmail') ?? '');

  useEffect(() => {
    if (!email) return;

    socket.on('auction_state', (state: AuctionState) => {
      setAuction(state);

      if (!state.bids && lastBidRef.current !== null && state.currentBid > lastBidRef.current && state.highestBidder) {
        setLocalBids((previous) =>
          [{ bidder: state.highestBidder as string, amount: state.currentBid, timestamp: Date.now() }, ...previous].slice(
            0,
            50
          )
        );
      }
      lastBidRef.current = state.currentBid;
    });

    socket.on('auction_end', (data: WinnerData) => {
      setWinnerData(data);
      setAuction((previous) => (previous ? { ...previous, isActive: false } : null));
    });
    socket.on('payment_link', (url: string) => setPaymentUrl(url));

    const requestState = () => socket.emit('get_auction_state');
    const onConnect = () => {
      setMyId(socket.id ?? '');
      requestState();
    };
    const onError = (socketError: Error) => console.error('Socket connection error:', socketError.message);
    socket.on('connect', onConnect);
    socket.on('connect_error', onError);

    socket.auth = { email };
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
  }, [email]);

  useEffect(() => {
    if (!auction?.isActive) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [auction?.isActive]);

  const handleBid = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = emailInput.trim();
    if (!value) return;
    localStorage.setItem('bidderEmail', value);
    setEmail(value);
  };

  if (!email) {
    return (
      <EmailGate
        emailInput={emailInput}
        onEmailInputChange={setEmailInput}
        onSubmit={handleEmailSubmit}
      />
    );
  }

  if (!auction) return <div className="p-8">Connecting to live bid…</div>;

  return (
    <AuctionPage
      auction={auction}
      bids={auction.bids ?? localBids}
      bidAmount={bidAmount}
      onBidAmountChange={setBidAmount}
      onBid={handleBid}
      error={error}
      winnerData={winnerData}
      paymentUrl={paymentUrl}
      myId={myId}
      socketId={socket.id}
      activeImage={activeImage}
      onImageChange={setActiveImage}
      now={now}
      onChangeEmail={() => setEmail('')}
    />
  );
}

export default AuctionApp;
