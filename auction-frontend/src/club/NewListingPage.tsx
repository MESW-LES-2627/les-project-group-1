import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuctionApp from '@/auction/AuctionApp';
import type { AccountNav } from '@/auction/types';
import { useApi } from '@/catalogue/api';
import type { Category } from '@/catalogue/types';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_URL } from '@/lib/api';
import { JERSEY_DETAIL_FIELDS, PLAYER_ONLY_FIELDS, buildDetails, categoryHasPlayer, withoutPlayerFields } from '@/dashboard/lib/listing-form';

/**
 * NewListingPage
 *
 * Page (/listings/new) where a club creates a new auction for a jersey.
 * Sends the form to POST /api/clubs/me/listings as multipart/form-data (fields + images).
 * The listing can be saved as a draft or sent straight to verification; it only shows up
 * in the public catalogue after an admin verifies it.
 */

const labelClass = 'mb-2 block text-sm font-bold tracking-wide text-ink-strong uppercase';
const inputClass =
  'h-auto rounded-2xl border-2 border-ink-strong bg-white px-5 py-3 text-lg font-semibold disabled:bg-surface disabled:opacity-70';
const hintClass = 'mt-1 text-sm font-medium text-slate';

// Backend error codes shown as readable messages.
const ERROR_MESSAGES: Record<string, string> = {
  invalid_category: 'Choose a category.',
  invalid_title: 'The title must have between 3 and 120 characters.',
  title_taken: 'There is already a listing with this title. Choose a different one.',
  invalid_description: 'The description must have between 10 and 2000 characters.',
  invalid_player_name: 'The player name can have up to 80 characters.',
  invalid_player_details: 'Check the player details: each value can have up to 100 characters.',
  invalid_season: 'The season can have up to 20 characters.',
  invalid_competition: 'The competition can have up to 100 characters.',
  invalid_match: 'The match can have up to 100 characters.',
  invalid_authenticity_notes: 'The authenticity notes can have up to 1000 characters.',
  invalid_tags: 'Use up to 10 tags, each up to 30 characters.',
  invalid_starting_price: 'The starting price must be between €0.01 and €1,000,000.',
  invalid_auction_ends_at: 'The auction end must be in the future.',
  invalid_image: 'Images must be PNG, JPEG or WebP files.',
  unknown_category: 'This category no longer exists.',
  club_not_approved: 'Your club has not been approved yet, so it cannot create auctions.',
  no_club: 'This account is not linked to a club.',
};

const MISSING_LABELS: Record<string, string> = {
  startingPrice: 'starting price',
  auctionEndsAt: 'auction end date',
  images: 'at least one jersey photo',
};

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type Submission = 'draft' | 'pending_verification';

function checkImages(files: File[], label: string): string | null {
  if (files.length > MAX_IMAGES) return `${label}: up to ${MAX_IMAGES} images.`;
  if (files.some((file) => file.size > MAX_IMAGE_BYTES)) return `${label}: each image must be 2 MB or less.`;
  return null;
}

function NewListingForm({ token }: { token: string }) {
  const categories = useApi<Category[]>('/api/categories');

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerDetails, setPlayerDetails] = useState<Record<string, string>>({});
  const [season, setSeason] = useState('');
  const [competition, setCompetition] = useState('');
  const [match, setMatch] = useState('');
  const [tags, setTags] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [auctionEndsAt, setAuctionEndsAt] = useState('');
  const [authenticityNotes, setAuthenticityNotes] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [evidenceImages, setEvidenceImages] = useState<File[]>([]);

  const [saving, setSaving] = useState<Submission | null>(null);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ title: string; status: Submission } | null>(null);

  const categorySlug = categories.data?.find((category) => String(category.id) === categoryId)?.slug;
  const hasPlayer = categoryHasPlayer(categorySlug);

  const submit = async (status: Submission) => {
    setError('');

    const imageError = checkImages(images, 'Jersey photos') ?? checkImages(evidenceImages, 'Authenticity evidence');
    if (imageError) {
      setError(imageError);
      return;
    }

    // Team jerseys have no player: drop anything typed before the category was changed
    const player = hasPlayer ? { playerName, playerDetails } : withoutPlayerFields({ playerName, playerDetails });
    const details = buildDetails(player.playerDetails, null);

    const form = new FormData();
    form.append('categoryId', categoryId);
    form.append('title', title);
    form.append('description', description);
    form.append('playerName', player.playerName);
    form.append('playerDetails', details ? JSON.stringify(details) : '');
    form.append('season', season);
    form.append('competition', competition);
    form.append('match', match);
    form.append('authenticityNotes', authenticityNotes);
    form.append('tags', tags);
    form.append('startingPrice', startingPrice);
    // datetime-local has no timezone; convert it to an ISO date in the user's timezone.
    form.append('auctionEndsAt', auctionEndsAt ? new Date(auctionEndsAt).toISOString() : '');
    form.append('status', status);
    images.forEach((file) => form.append('images', file));
    evidenceImages.forEach((file) => form.append('evidenceImages', file));

    setSaving(status);
    try {
      const response = await fetch(`${API_URL}/api/clubs/me/listings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; missing?: string[] };

      if (!response.ok) {
        if (data.error === 'incomplete_listing' && data.missing?.length) {
          const missing = data.missing.map((field) => MISSING_LABELS[field] ?? field).join(', ');
          throw new Error(`To submit for verification, add: ${missing}. Or save it as a draft.`);
        }
        if (response.status === 401) throw new Error('Your session has expired. Log in again.');
        if (response.status === 413) throw new Error('The images are too large. Each image must be 2 MB or less.');
        throw new Error(ERROR_MESSAGES[data.error ?? ''] ?? data.error ?? 'Could not create the auction. Please try again.');
      }

      setCreated({ title: title.trim(), status });
    } catch (err) {
      setError((err as Error).message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(null);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    void submit(submitter?.value === 'draft' ? 'draft' : 'pending_verification');
  };

  const resetForm = () => {
    setCategoryId('');
    setTitle('');
    setDescription('');
    setPlayerName('');
    setPlayerDetails({});
    setSeason('');
    setCompetition('');
    setMatch('');
    setTags('');
    setStartingPrice('');
    setAuctionEndsAt('');
    setAuthenticityNotes('');
    setImages([]);
    setEvidenceImages([]);
    setCreated(null);
  };

  if (created) {
    return (
      <section className="space-y-5 rounded-[22px] border-2 border-ink-strong p-8 text-center max-mobile:p-5">
        <h2 className="text-2xl font-black text-ink-strong uppercase">Auction created</h2>
        <p className="text-lg font-semibold text-slate-strong">
          {created.status === 'draft'
            ? `"${created.title}" was saved as a draft.`
            : `"${created.title}" was sent for verification. It will appear in the catalogue once an admin verifies it.`}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" variant="solid" size="form" onClick={resetForm}>
            CREATE ANOTHER
          </Button>
          <Button asChild variant="outline" size="form" className="border-2 border-ink-strong bg-white font-bold text-ink-strong uppercase hover:bg-surface">
            <Link to="/">Back to the catalogue</Link>
          </Button>
        </div>
      </section>
    );
  }

  const minEnd = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div role="alert" className="rounded-2xl bg-red-100 p-4 font-semibold text-red-700">
          {error}
        </div>
      )}

      <section className="space-y-6 rounded-[22px] border-2 border-ink-strong p-8 max-mobile:p-5">
        <h2 className="text-2xl font-black text-ink-strong uppercase">Jersey</h2>

        <div>
          <label htmlFor="listing-category" className={labelClass}>Category *</label>
          <select
            id="listing-category"
            className={`${inputClass} w-full`}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            required
          >
            <option value="" disabled>
              {categories.loading ? 'Loading…' : 'Choose a category'}
            </option>
            {(categories.data ?? []).map((category) => (
              <option key={category.slug} value={category.id}>{category.name}</option>
            ))}
          </select>
          {categories.error && <p className="mt-1 text-sm font-bold text-danger">Could not load the categories.</p>}
        </div>

        <div>
          <label htmlFor="listing-title" className={labelClass}>Title *</label>
          <Input
            id="listing-title"
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={3}
            maxLength={120}
            placeholder="e.g. Match-worn home jersey, 2023/24 final"
            required
          />
        </div>

        <div>
          <label htmlFor="listing-description" className={labelClass}>Description *</label>
          <textarea
            id="listing-description"
            className={`${inputClass} min-h-[140px] w-full resize-y`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={10}
            maxLength={2000}
            placeholder="Condition, size, signatures, story behind the jersey…"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-6 max-tablet:grid-cols-1">
          {hasPlayer && (
            <div>
              <label htmlFor="listing-player" className={labelClass}>Player</label>
              <Input id="listing-player" className={inputClass} value={playerName} onChange={(event) => setPlayerName(event.target.value)} maxLength={80} />
            </div>
          )}
          <div>
            <label htmlFor="listing-season" className={labelClass}>Season</label>
            <Input id="listing-season" className={inputClass} value={season} onChange={(event) => setSeason(event.target.value)} maxLength={20} placeholder="2024/25" />
          </div>
          <div>
            <label htmlFor="listing-competition" className={labelClass}>Competition</label>
            <Input id="listing-competition" className={inputClass} value={competition} onChange={(event) => setCompetition(event.target.value)} maxLength={100} />
          </div>
          <div>
            <label htmlFor="listing-match" className={labelClass}>Match</label>
            <Input id="listing-match" className={inputClass} value={match} onChange={(event) => setMatch(event.target.value)} maxLength={100} placeholder="Home vs Away, date" />
          </div>
          {JERSEY_DETAIL_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={`detail-${key}`} className={labelClass}>{label}</label>
              <Input
                id={`detail-${key}`}
                className={inputClass}
                value={playerDetails[key] ?? ''}
                onChange={(event) => setPlayerDetails((current) => ({ ...current, [key]: event.target.value }))}
                maxLength={100}
              />
            </div>
          ))}
        </div>

        {hasPlayer && (
        <fieldset className="space-y-4">
          <legend className={labelClass}>Player details</legend>
          <div className="grid grid-cols-2 gap-6 max-tablet:grid-cols-1">
            {PLAYER_ONLY_FIELDS.map(({ key, label, numeric }) => (
              <div key={key}>
                <label htmlFor={`detail-${key}`} className={labelClass}>{label}</label>
                <Input
                  id={`detail-${key}`}
                  type={numeric ? 'number' : 'text'}
                  className={inputClass}
                  value={playerDetails[key] ?? ''}
                  onChange={(event) => setPlayerDetails((current) => ({ ...current, [key]: event.target.value }))}
                  maxLength={numeric ? undefined : 100}
                />
              </div>
            ))}
          </div>
        </fieldset>
        )}

        <div>
          <label htmlFor="listing-tags" className={labelClass}>Tags</label>
          <Input id="listing-tags" className={inputClass} value={tags} onChange={(event) => setTags(event.target.value)} placeholder="signed, match-worn" />
          <p className={hintClass}>Separate with commas. Up to 10 tags.</p>
        </div>

        <div>
          <label htmlFor="listing-images" className={labelClass}>Jersey photos</label>
          <Input
            id="listing-images"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className={`${inputClass} text-base`}
            onChange={(event) => setImages(Array.from(event.target.files ?? []))}
          />
          <p className={hintClass}>PNG, JPEG or WebP, up to 2 MB each and {MAX_IMAGES} photos. The first photo is the cover.</p>
        </div>
      </section>

      <section className="space-y-6 rounded-[22px] border-2 border-ink-strong p-8 max-mobile:p-5">
        <h2 className="text-2xl font-black text-ink-strong uppercase">Auction</h2>

        <div className="grid grid-cols-2 gap-6 max-tablet:grid-cols-1">
          <div>
            <label htmlFor="listing-price" className={labelClass}>Starting price (€)</label>
            <Input
              id="listing-price"
              type="number"
              inputMode="decimal"
              min="0.01"
              max="1000000"
              step="0.01"
              className={inputClass}
              value={startingPrice}
              onChange={(event) => setStartingPrice(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="listing-ends" className={labelClass}>Auction ends</label>
            <Input
              id="listing-ends"
              type="datetime-local"
              min={minEnd}
              className={inputClass}
              value={auctionEndsAt}
              onChange={(event) => setAuctionEndsAt(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-[22px] border-2 border-ink-strong p-8 max-mobile:p-5">
        <h2 className="text-2xl font-black text-ink-strong uppercase">Authenticity</h2>

        <div>
          <label htmlFor="listing-notes" className={labelClass}>Authenticity notes</label>
          <textarea
            id="listing-notes"
            className={`${inputClass} min-h-[100px] w-full resize-y`}
            value={authenticityNotes}
            onChange={(event) => setAuthenticityNotes(event.target.value)}
            maxLength={1000}
            placeholder="How the jersey was obtained, certificates, photo-matching…"
          />
        </div>

        <div>
          <label htmlFor="listing-evidence" className={labelClass}>Evidence images</label>
          <Input
            id="listing-evidence"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className={`${inputClass} text-base`}
            onChange={(event) => setEvidenceImages(Array.from(event.target.files ?? []))}
          />
          <p className={hintClass}>Certificates, match photos, labels. Up to {MAX_IMAGES} images.</p>
        </div>
      </section>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate">
          To submit for verification you need a starting price, an end date and at least one photo. Drafts only need the fields marked with *.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" value="pending_verification" variant="solid" size="form" disabled={saving !== null}>
            {saving === 'pending_verification' ? 'SUBMITTING…' : 'SUBMIT FOR VERIFICATION'}
          </Button>
          <Button
            type="submit"
            value="draft"
            variant="outline"
            size="form"
            className="border-2 border-ink-strong bg-white font-bold text-ink-strong uppercase hover:bg-surface"
            disabled={saving !== null}
          >
            {saving === 'draft' ? 'SAVING…' : 'SAVE AS DRAFT'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function NewListingView({ account }: { account: AccountNav }) {
  const isClub = account.role === 'CLUB';

  return (
    <>
      <Navbar {...account} />
      <main className="mx-auto w-full max-w-4xl px-[clamp(18px,3vw,58px)] py-10">
        <Link to="/" className="text-sm font-bold text-ink-soft hover:underline">← Back to the catalogue</Link>
        <h1 className="mt-4 mb-8 text-[clamp(2rem,3.2vw,3.4rem)] leading-none font-extrabold tracking-[-0.055em] text-ink-strong uppercase">
          New auction
        </h1>

        {!account.isLoggedIn ? (
          <div className="space-y-4">
            <p className="font-semibold text-slate">Log in with your club account to create auctions.</p>
            <Button variant="solid" size="form" onClick={account.onLoginClick}>LOG IN</Button>
          </div>
        ) : !isClub ? (
          <p role="alert" className="font-bold text-danger">Only club accounts can create auctions.</p>
        ) : (
          <NewListingForm token={account.token} />
        )}
      </main>
    </>
  );
}

// Rendered inside AuctionApp so the login screen works on this page too.
export function NewListingPage() {
  return <AuctionApp renderPage={(account) => <NewListingView account={account} />} />;
}
