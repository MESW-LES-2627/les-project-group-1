import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { API_URL } from '../lib/api';

const labelClass = 'mb-2 block text-sm font-bold tracking-wide text-ink-strong uppercase';
const inputClass =
  'h-auto rounded-2xl border-2 border-ink-strong bg-white px-5 py-3 text-lg font-semibold disabled:bg-surface disabled:opacity-70';

export interface ClubProfileData {
  name: string;
  description: string;
  logoUrl: string;
  slug: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface ClubProfileProps {
  token: string;
}

export function ClubProfile({ token }: ClubProfileProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Buscar os dados atuais do clube ao carregar a página
  useEffect(() => {
    if (!token) return;
    async function fetchClubProfile() {
      try {
        const res = await fetch(`${API_URL}/api/clubs/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 404) {
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error('Failed to load club profile.');
        const data: ClubProfileData = await res.json();
        setName(data.name || '');
        setDescription(data.description || '');
        setLogoUrl(data.logoUrl || '');
        setSlug(data.slug || '');
        setStatus(data.status ?? 'pending');
      } catch (err: any) {
        setError(err.message || 'Could not load club profile.');
      } finally {
        setLoading(false);
      }
    }
    fetchClubProfile();
  }, [token]);

  const initials = (name || 'Club')
    .replace(/[()]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch(`${API_URL}/api/clubs/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, logoUrl }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update club profile.');
      }

      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Could not save club profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const statusConfig = {
    approved: {
      label: 'Verified',
      className: 'bg-green-100 text-green-800 border-green-700',
      dot: 'bg-green-600',
    },
    pending: {
      label: 'Pending Approval',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-700',
      dot: 'bg-yellow-500',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-800 border-red-700',
      dot: 'bg-red-600',
    },
  }[status];

  if (loading) {
    return <p className="p-8 text-center font-medium text-slate">Loading club profile…</p>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-[clamp(18px,3vw,58px)] py-10">
      <h1 className="border-b-4 border-ink-line pb-6 text-center text-[clamp(2rem,5vw,3.5rem)] leading-tight font-black text-ink-strong uppercase">
        Club Management
      </h1>

      <div className="mt-10 grid grid-cols-2 items-start gap-10 max-tablet:grid-cols-1">
        <section className="flex flex-col items-center gap-4 px-4 text-center">
          <div className="flex size-[140px] items-center justify-center overflow-hidden rounded-full border-4 border-ink-strong bg-surface">
            {logoUrl ? (
              <img src={logoUrl} alt={`${name} logo`} className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-3xl font-black text-ink-strong" aria-hidden="true">
                {initials}
              </span>
            )}
          </div>
          <h2 className="max-w-full truncate text-[clamp(1.6rem,3vw,2.5rem)] leading-tight font-black text-ink-strong uppercase">
            {name || 'Unnamed Club'}
          </h2>
          <span
            className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-1 text-sm font-bold uppercase ${statusConfig.className}`}
          >
            <span className={`size-2 rounded-full ${statusConfig.dot}`} aria-hidden="true" />
            {statusConfig.label}
          </span>
          <p className="text-sm font-semibold text-ink-soft">Slug: /{slug}</p>
        </section>

        <section className="space-y-8 rounded-[22px] border-2 border-ink-strong p-8 max-mobile:p-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-black text-ink-strong uppercase">Edit club details</h2>

            {error && (
              <div role="alert" className="rounded-2xl bg-red-100 p-4 font-semibold text-red-700">
                {error}
              </div>
            )}
            {saved && (
              <div role="status" className="rounded-2xl bg-green-100 p-4 font-semibold text-green-700">
                Club profile saved successfully.
              </div>
            )}

            <div>
              <label htmlFor="club-name" className={labelClass}>
                Club Name
              </label>
              <Input
                id="club-name"
                className={inputClass}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setSaved(false);
                }}
                required
              />
            </div>

            <div>
              <label htmlFor="club-description" className={labelClass}>
                Description / Bio
              </label>
              <textarea
                id="club-description"
                className={`${inputClass} w-full resize-y min-h-[120px]`}
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setSaved(false);
                }}
                placeholder="Write a short description about the club..."
              />
            </div>

            <div>
              <label htmlFor="club-logo" className={labelClass}>
                Logo URL
              </label>
              <Input
                id="club-logo"
                type="text"
                className={inputClass}
                value={logoUrl}
                onChange={(event) => {
                  setLogoUrl(event.target.value);
                  setSaved(false);
                }}
                placeholder="https://example.com/logo.svg"
              />
            </div>

            <Button type="submit" variant="solid" size="form" disabled={saving}>
              {saving ? 'SAVING…' : 'SAVE CLUB PROFILE'}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}