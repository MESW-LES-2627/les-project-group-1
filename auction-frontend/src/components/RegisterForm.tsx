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
    accountType: 'BUYER' | 'CLUB';
    clubName?: string;            
    clubSlug?: string
    onUsernameChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onCountryChange: (value: string) => void;
    onAccountTypeChange: (value: 'BUYER' | 'CLUB') => void;
    onClubNameChange?: (value: string) => void;          
    onClubSlugChange?: (value: string) => void;
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
    accountType,
    clubName,
    clubSlug,
    onUsernameChange,
    onEmailChange,
    onPasswordChange,
    onCountryChange,
    onAccountTypeChange,
    onClubNameChange,
    onClubSlugChange,
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
          <label className={labelClass}>Account Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onAccountTypeChange('BUYER')}
              className={`rounded-2xl border-2 border-ink-strong p-3 text-center font-bold uppercase transition-all ${
                accountType === 'BUYER' ? 'bg-ink-strong text-white' : 'bg-white text-ink-strong'
              }`}
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={() => onAccountTypeChange('CLUB')}
              className={`rounded-2xl border-2 border-ink-strong p-3 text-center font-bold uppercase transition-all ${
                accountType === 'CLUB' ? 'bg-ink-strong text-white' : 'bg-white text-ink-strong'
              }`}
            >
              Club / Seller
            </button>
          </div>
        </div>

        {accountType === 'CLUB' && (
          <div className="space-y-4 rounded-2xl border-2 border-dashed border-ink-strong p-4 bg-gray-50">
            <p className="text-xs font-bold text-ink-strong uppercase">Club Details (Will be pending approval)</p>
            <div>
              <label htmlFor="register-clubname" className={labelClass}>
                Club Name
              </label>
              <Input
                id="register-clubname"
                type="text"
                value={clubName}
                onChange={(e) => onClubNameChange && onClubNameChange(e.target.value)}
                required={accountType === 'CLUB'}
                className={inputClass}
                placeholder="e.g. FC Barcelona"
              />
            </div>
            <div>
              <label htmlFor="register-clubslug" className={labelClass}>
                Club Slug (URL identifier)
              </label>
              <Input
                id="register-clubslug"
                type="text"
                value={clubSlug}
                onChange={(e) => onClubSlugChange && onClubSlugChange(e.target.value)}
                required={accountType === 'CLUB'}
                className={inputClass}
                placeholder="e.g. fc-barcelona"
              />
            </div>
          </div>
        )}

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
