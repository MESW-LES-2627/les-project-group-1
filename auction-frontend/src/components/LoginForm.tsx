import React from 'react';

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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Assist Club - Login
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
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
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="********"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="flex justify-between items-center mt-4 text-sm">
        <button
          type="button"
          onClick={onBackToAuction}
          className="text-gray-600 hover:underline font-medium cursor-pointer"
        >
          ← Back to auction
        </button>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-blue-600 hover:underline font-medium cursor-pointer"
        >
          Create account
        </button>
      </div>
    </div>
  );
}