import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { io } from 'socket.io-client';
import { AuctionPage } from './AuctionPage';
//import { EmailGate } from '../components/EmailGate';
import { MIN_INCREMENT } from './data';
import type { AuctionState, Bid, WinnerData } from './types';
import { formatEuro } from './utils';
import { RegisterForm } from '../components/RegisterForm';

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
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [myId, setMyId] = useState(socket.id ?? '');
  const lastBidRef = useRef<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem('bidderEmail') ?? '');

  //Register
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerCountry, setRegisterCountry] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccessMessage, setRegisterSuccessMessage] = useState<string | null>(null);

  useEffect(() => {

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
    socket.on('auction_reset', () => {
      setWinnerData(null);
      setPaymentUrl('');
      setLocalBids([]);
      setBidAmount('');
      setError('');
      lastBidRef.current = 50;
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

    if (email) {
      socket.auth = { email };
    } else {
      socket.auth = {};
    }

    if (socket.connected) onConnect();
    else socket.connect();

    return () => {
      socket.off('auction_state');
      socket.off('auction_end');
      socket.off('auction_reset');
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

    if(!email){ // If email is not set, show the register form
      setShowRegisterForm(true);
      return;
    }

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

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const valueUsername = registerUsername.trim();
    const value = email.trim();
    if (!valueUsername ||!value || !registerPassword) return;

    setRegisterLoading(true);
    setRegisterError(null);
    setRegisterSuccessMessage(null);

    try {
      const backendUrl = socketUrl.replace(/\/+$/, '');
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: valueUsername,email: value, password: registerPassword, country: registerCountry }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Error registering user. Please try again.');
      }

      setRegisterSuccessMessage('Account created successfully! You can now place bids.');

      setTimeout(() => {
        localStorage.setItem('bidderUsername', valueUsername);
        localStorage.setItem('bidderEmail', value);
        setEmail(value);
        setShowRegisterForm(false);
        setRegisterSuccessMessage(null);
        setRegisterPassword('');
      }, 1200);

    } catch (err: any) {
      setRegisterError(err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setResetError('');
    try {
      const backendUrl = socketUrl.replace(/\/+$/, '');
      const response = await fetch(`${backendUrl}/api/auction/reset`, { method: 'POST' });
      if (!response.ok) throw new Error(`Reset failed with status ${response.status}`);
    } catch {
      setResetError('Reset failed. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  if (showRegisterForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <RegisterForm
            username={registerUsername}
            email={email}
            password={registerPassword}
            country={registerCountry}
            onUsernameChange={setRegisterUsername}
            onEmailChange={setEmail}
            onPasswordChange={setRegisterPassword}
            onCountryChange={setRegisterCountry}
            onSubmit={handleRegisterSubmit}
            loading={registerLoading}
            error={registerError}
            successMessage={registerSuccessMessage}
          />

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowRegisterForm(false)}
              className="text-sm text-gray-600 hover:underline font-medium cursor-pointer"
            >
              ← Back to auction
            </button>
          </div>
        </div>
      </div>
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
      onReset={handleReset}
      isResetting={isResetting}
      resetError={resetError}
    />
  );
}

export default AuctionApp;