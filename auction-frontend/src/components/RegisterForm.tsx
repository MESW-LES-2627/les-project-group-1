import React from 'react';
import {flagEmoji} from '../auction/utils';
import {COUNTRIES} from '../auction/countries';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface RegisterFormProps {
    username: string;
    email: string;
    password: string;
    country: string;
    onUsernameChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onCountryChange: (value: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    loading: boolean;
    error: string|null;
    successMessage: string|null;
}

const labelClass = 'mb-2 block text-sm font-bold tracking-wide text-ink-strong uppercase';
const inputClass = 'h-auto rounded-2xl border-2 border-ink-strong bg-white px-5 py-3 text-lg font-semibold';

export function RegisterForm({
    username,
    email,
    password,
    country,
    onUsernameChange,
    onEmailChange,
    onPasswordChange,
    onCountryChange,
    onSubmit,
    loading,
    error,
    successMessage
}: RegisterFormProps){
  return (
    <div className="w-full max-w-md rounded-[22px] border-2 border-ink-strong bg-white p-8 max-mobile:p-5">
      <h2 className="pb-2 text-center text-2xl font-black text-ink-strong uppercase">
        Assist Club
      </h2>
      <h3 className="mb-6 border-b-4 border-ink-line pb-4 text-center text-medium font-bold text-ink-strong uppercase">
        Register
      </h3>

      {error && (
        <div role="alert" className="mb-5 rounded-2xl bg-red-100 p-4 font-semibold text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div role="status" className="mb-5 rounded-2xl bg-green-100 p-4 font-semibold text-green-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="register-username" className={labelClass}>
            Username
          </label>
          <Input
            id="register-username"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            required
            className={inputClass}
            placeholder="Your username"
          />
        </div>

        <div>
          <label htmlFor="register-email" className={labelClass}>
            Email
          </label>
          <Input
            id="register-email"
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
            <label htmlFor="register-country" className="text-sm font-bold tracking-wide text-ink-strong uppercase">
              Country
            </label>
            <span className="text-xl" title={country}>
              {flagEmoji(country)}
            </span>
          </div>
          <select
            id="register-country"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            required
            className={`${inputClass} w-full border-solid`}
          >
            <option value="">Select your country...</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {flagEmoji(c.code)} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="register-password" className={labelClass}>
            Password (min 8 characters)
          </label>
          <Input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            minLength={8}
            className={inputClass}
            placeholder="********"
          />
        </div>

        <Button type="submit" variant="solid" size="form" className="w-full" disabled={loading}>
          {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
        </Button>
      </form>
    </div>
  );
}
