import React from 'react';
import {flagEmoji} from '../auction/utils';
import {COUNTRIES} from '../auction/countries';

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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Assist Club - Create your account
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm font-medium">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm font-medium">
          {successMessage}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <span className="text-xl" title={country}>
              {flagEmoji(country)}
            </span>
          </div>
          <select
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password (min 8 characters)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="********"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}