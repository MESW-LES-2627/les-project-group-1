import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LoginFormProps {
    email: string;
    password: string;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    loading: boolean;
    error: string|null;
    onSwitchToRegister: () => void;
    onBackToAuction: () => void;
    onSwitchToForgotPassword: () => void;
}

const labelClass = 'mb-2 block text-sm font-bold tracking-wide text-ink-strong uppercase';
const inputClass = 'h-auto rounded-2xl border-2 border-ink-strong bg-white px-5 py-3 text-lg font-semibold';

export function LoginForm({
    email,
    password,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    loading,
    error,
    onSwitchToRegister,
    onBackToAuction,
    onSwitchToForgotPassword,
}: LoginFormProps){
  return (
    <div className="w-full max-w-md rounded-[22px] border-2 border-ink-strong bg-white p-8 max-mobile:p-5">
      <h2 className="pb-2 text-center text-2xl font-black text-ink-strong uppercase">
        Assist Club
      </h2>
      <h3 className="mb-6 border-b-4 border-ink-line pb-4 text-center text-medium font-bold text-ink-strong uppercase">
        Login
      </h3>


      {error && (
        <div role="alert" className="mb-5 rounded-2xl bg-red-100 p-4 font-semibold text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className={labelClass}>
            Email
          </label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-bold tracking-wide text-ink-strong uppercase">
              Password
            </label>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="cursor-pointer text-sm font-bold text-link hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            className={inputClass}
            placeholder="********"
          />
        </div>

        <Button type="submit" variant="solid" size="form" className="w-full" disabled={loading}>
          {loading ? "LOGGING IN..." : "LOGIN"}
        </Button>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBackToAuction}
          className="cursor-pointer font-bold text-ink-soft hover:underline"
        >
          ← Back to auction
        </button>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="cursor-pointer font-bold text-link hover:underline"
        >
          Create account
        </button>
      </div>
    </div>
  );
}
