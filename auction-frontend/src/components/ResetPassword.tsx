import React, {useState} from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { API_URL } from '../lib/api';

interface ResetPasswordProps {
    onSuccessfulReset: () => void;
}

const labelClass = 'mb-2 block text-sm font-bold tracking-wide text-ink-strong uppercase';
const inputClass = 'h-auto rounded-2xl border-2 border-ink-strong bg-white px-5 py-3 text-lg font-semibold';

export function ResetPassword({ onSuccessfulReset }: ResetPasswordProps) {
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reset password.');

      setMessage('Password successfully reset! Redirecting to login...');
      setTimeout(() => {
        onSuccessfulReset();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-[22px] border-2 border-ink-strong bg-white p-8 text-center max-mobile:p-5">
        <p role="alert" className="rounded-2xl bg-red-100 p-4 font-semibold text-red-700">
          Invalid or missing reset token in URL.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-[22px] border-2 border-ink-strong bg-white p-8 max-mobile:p-5">
      <h2 className="mb-6 border-b-4 border-ink-line pb-4 text-center text-2xl font-black text-ink-strong uppercase">
        Assist Club - Reset Password
      </h2>

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
          <label htmlFor="reset-new-password" className={labelClass}>
            New Password
          </label>
          <Input
            id="reset-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className={inputClass}
            placeholder="********"
          />
        </div>

        <div>
          <label htmlFor="reset-confirm-password" className={labelClass}>
            Confirm Password
          </label>
          <Input
            id="reset-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={inputClass}
            placeholder="********"
          />
        </div>

        <Button type="submit" variant="solid" size="form" className="w-full" disabled={loading}>
          {loading ? "RESETTING..." : "UPDATE PASSWORD"}
        </Button>
      </form>
    </div>
  );
}
