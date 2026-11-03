import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { io } from 'socket.io-client';
import { AuctionPage } from './AuctionPage';
//import { EmailGate } from '../components/EmailGate';
import { MIN_INCREMENT } from './data';
import type { AuctionState, Bid, WinnerData } from './types';
import { formatEuro } from './utils';
import { RegisterForm } from '../components/RegisterForm';
import { LoginForm } from '../components/LoginForm';

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
  //const [] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem('bidderEmail') ?? '');
  const [username, setUsername] = useState(() => localStorage.getItem('bidderUsername') ?? '');

  //Register
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccessMessage, setRegisterSuccessMessage] = useState<string | null>(null);

  //Login
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  //Login vs Register
  const [showAuthChoice, setShowAuthChoice] = useState(false);

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
      socket.auth = {email, username};
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
  }, [email, username]);

  useEffect(() => {
    if (!auction?.isActive) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [auction?.isActive]);

  const handleBid = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if(!email){ // If email is not set, show the register form
      setShowAuthChoice(true);
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

  // Register form submission handler
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
        body: JSON.stringify({ username: valueUsername,email: value, password: registerPassword }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Error registering user. Please try again.');
      }

      setRegisterSuccessMessage('Account created successfully! You can now place bids.');

      setTimeout(() => {
        localStorage.setItem('bidderUsername', valueUsername);
        localStorage.setItem('bidderEmail', value);
        setUsername(valueUsername);
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

  //Login form submission handler
  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const valueEmail = loginEmail.trim();
    if (!valueEmail || !loginPassword) return;

    setLoginLoading(true);
    setLoginError(null);

    try {
      const backendUrl = socketUrl.replace(/\/+$/, '');
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: valueEmail, password: loginPassword }),
      });

      const data = (await response.json()) as { error?: string; user?: { username: string; email: string } };
      if (!response.ok) throw new Error(data.error || 'Error logging in. Please try again.');
      

      const loggedUsername = data.user?.username || '';
      localStorage.setItem('bidderEmail', data.user?.email || valueEmail);
      if (loggedUsername) {
        localStorage.setItem('bidderUsername', loggedUsername);
        setUsername(loggedUsername);
      }
      
      setEmail(data.user?.email || valueEmail);
      setShowLoginForm(false);
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
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

  //Login vs Register choice 
  if (showAuthChoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md border border-gray-200 text-center space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Authentication needed</h3>
          <p className="text-sm text-gray-600">
            To place a bid, you need to have an account and log in.
          </p>

          <div className="flex flex-col space-y-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAuthChoice(false);
                setShowLoginForm(true);
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium transition cursor-pointer"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAuthChoice(false);
                setShowRegisterForm(true);
              }}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 font-medium transition border border-gray-300 cursor-pointer"
            >
              Create Account (Register)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAuthChoice(false)}
            className="text-sm text-gray-500 hover:underline pt-2 inline-block cursor-pointer"
          >
            ← Back to auction
          </button>
        </div>
      </div>
    );
  }

  //Register form
  if (showRegisterForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <RegisterForm
            username={registerUsername}
            email={email}
            password={registerPassword}
            onUsernameChange={setRegisterUsername}
            onEmailChange={setEmail}
            onPasswordChange={setRegisterPassword}
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

  //Login form
  if (showLoginForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <LoginForm
            email={loginEmail}
            password={loginPassword}
            onEmailChange={setLoginEmail}
            onPasswordChange={setLoginPassword}
            onSubmit={handleLoginSubmit}
            loading={loginLoading}
            error={loginError}
            onSwitchToRegister={() => {
              setShowLoginForm(false);
              setShowRegisterForm(true);
            }}
            onBackToAuction={() => setShowLoginForm(false)}
          />
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
      myId={email ? username : ''}
      socketId={socket.id}
      activeImage={activeImage}
      onImageChange={setActiveImage}
      now={now}
      onChangeEmail={() => {setEmail(''); setUsername(''); localStorage.removeItem('bidderEmail'); localStorage.removeItem('bidderUsername'); setShowAuthChoice(true);}}
      onReset={handleReset}
      isResetting={isResetting}
      resetError={resetError}
    />
  );
}

export default AuctionApp;