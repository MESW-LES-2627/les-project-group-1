import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PurchasedJerseys } from './PurchasedJerseys';
import { flagEmoji } from '../auction/utils';
import { COUNTRIES } from '../auction/countries';
import { ApiError, saveProfile } from '../profile/api';
import type { ProfileUser } from '../profile/api';

const errorMessages: Record<string, string> = {
  invalid_username: 'The username must have between 3 and 30 characters.',
  invalid_country: 'Please select your country.',
  username_taken: 'That username is already in use.',
};

const labelClass = 'mb-2 block text-sm font-bold tracking-wide text-ink-strong uppercase';
const inputClass =
  'h-auto rounded-2xl border-2 border-ink-strong bg-white px-5 py-3 text-lg font-semibold disabled:bg-surface disabled:opacity-70';

interface AccountProfileProps {
  token: string;
  username: string;
  email: string;
  country: string;
  onSaved: (user: ProfileUser) => void;
}

export function AccountProfile({ token, username, email, country, onSaved }: AccountProfileProps) {
  const [usernameInput, setUsernameInput] = useState(username);
  const [countryInput, setCountryInput] = useState(country);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const canEdit = Boolean(token);
  const changed = usernameInput.trim() !== username || countryInput.trim() !== country;
  const initial = (username || email || '?').charAt(0).toUpperCase();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const user = await saveProfile(token, { username: usernameInput, country: countryInput });
      setUsernameInput(user.username);
      setCountryInput(user.country);
      onSaved(user);
      setSaved(true);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        const code = caught instanceof ApiError ? caught.code : '';
        setError(errorMessages[code] ?? 'Could not save your profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-[clamp(18px,3vw,58px)] py-10">
      <h1 className="border-b-4 border-ink-line pb-6 text-center text-[clamp(2rem,5vw,3.5rem)] leading-tight font-black text-ink-strong uppercase">
        My account
      </h1>

      <div className="mt-10 grid grid-cols-2 items-start gap-10 max-tablet:grid-cols-1">
        <section className="flex flex-col items-center gap-4 px-4 text-center">
          <div
            aria-hidden="true"
            className="flex size-40 items-center justify-center rounded-full bg-ink-strong text-7xl font-black text-white max-mobile:size-28 max-mobile:text-5xl"
          >
            {initial}
          </div>
          <h2 className="max-w-full truncate text-[clamp(1.6rem,3vw,2.5rem)] leading-tight font-black text-ink-strong uppercase">
            {username}
          </h2>
          <p className="max-w-full truncate text-lg text-ink-soft">{email}</p>
        </section>

        <section className="space-y-8 rounded-[22px] border-2 border-ink-strong p-8 max-mobile:p-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-black text-ink-strong uppercase">Edit profile</h2>

            {!canEdit && (
              <div role="alert" className="rounded-2xl bg-surface p-4 font-semibold text-ink-strong">
                Log in again to edit your profile.
              </div>
            )}
            {error && (
              <div role="alert" className="rounded-2xl bg-red-100 p-4 font-semibold text-red-700">
                {error}
              </div>
            )}
            {saved && (
              <div role="status" className="rounded-2xl bg-green-100 p-4 font-semibold text-green-700">
                Profile saved.
              </div>
            )}

            <div>
              <label htmlFor="profile-username" className={labelClass}>
                Username
              </label>
              <Input
                id="profile-username"
                className={inputClass}
                value={usernameInput}
                onChange={(event) => {
                  setUsernameInput(event.target.value);
                  setSaved(false);
                }}
                disabled={!canEdit}
              />
            </div>

            <div>
              <label htmlFor="profile-email" className={labelClass}>
                Email
              </label>
              <Input id="profile-email" className={inputClass} value={email} disabled readOnly />
              <p className="mt-2 text-sm text-ink-soft">Your email identifies your account and cannot be changed.</p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="profile-country" className="text-sm font-bold tracking-wide text-ink-strong uppercase">
                  Country
                </label>
                <span className="text-xl" title={countryInput}>
                  {flagEmoji(countryInput)}
                </span>
              </div>
              <select
                id="profile-country"
                className={`${inputClass} w-full border-solid disabled:cursor-not-allowed`}
                value={countryInput}
                onChange={(event) => {
                  setCountryInput(event.target.value);
                  setSaved(false);
                }}
                disabled={!canEdit}
              >
                <option value="">Select your country...</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {flagEmoji(c.code)} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" variant="solid" size="form" disabled={!canEdit || !changed || saving}>
              {saving ? 'SAVING…' : 'SAVE CHANGES'}
            </Button>
          </form>
        </section>
      </div>

      <PurchasedJerseys token={token} />
    </main>
  );
}