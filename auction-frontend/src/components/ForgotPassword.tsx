import React, {useState} from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ForgotPasswordProps {
    onBackToLogin: () => void;
}

const labelClass = 'mb-2 block text-sm font-bold tracking-wide text-ink-strong uppercase';
const inputClass = 'h-auto rounded-2xl border-2 border-ink-strong bg-white px-5 py-3 text-lg font-semibold';

export function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong.');

      setMessage(data.message); // "If the email exists, a reset link has been sent."
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-[22px] border-2 border-ink-strong bg-white p-8 max-mobile:p-5">
      <h2 className="mb-6 border-b-4 border-ink-line pb-4 text-center text-2xl font-black text-ink-strong uppercase">
        Assist Club - Forgot Password
      </h2>

      <p className="mb-5 text-center text-base font-semibold text-slate-strong">
        Enter your registered email address and we'll send you a link to reset your password.
      </p>

      {error && (
        <div role="alert" className="mb-5 rounded-2xl bg-red-100 p-4 font-semibold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="mb-5 rounded-2xl bg-green-100 p-4 font-semibold text-green-700">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="forgot-email" className={labelClass}>
            Email
          </label>
          <Input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>

        <Button type="submit" variant="solid" size="form" className="w-full" disabled={loading}>
          {loading ? "SENDING..." : "SEND RESET LINK"}
        </Button>
      </form>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="cursor-pointer text-sm font-bold text-ink-soft hover:underline"
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}
