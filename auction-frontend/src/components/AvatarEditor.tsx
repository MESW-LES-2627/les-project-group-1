import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button } from './ui/button';
import { ApiError, fetchMe, removeAvatar, saveAvatar } from '../profile/api';
import { resizeToAvatar } from '../profile/image';

const errorMessages: Record<string, string> = {
  invalid_image: 'Please choose a valid image.',
  image_too_large: 'That image is too large. Please choose a smaller one.',
};

interface AvatarEditorProps {
  token: string;
  initial: string;
  resize?: (file: File) => Promise<string>;
}

export function AvatarEditor({ token, initial, resize = resizeToAvatar }: AvatarEditorProps) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchMe(token)
      .then((me) => {
        if (active) setAvatar(me.avatar);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token]);

  const describe = (caught: unknown) => {
    if (caught instanceof ApiError && caught.status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    const code = caught instanceof ApiError ? caught.code : '';
    return errorMessages[code] ?? 'Could not update your photo. Please try again.';
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const image = await resize(file);
      await saveAvatar(token, image);
      setAvatar(image);
    } catch (caught) {
      setError(describe(caught));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError('');
    try {
      await removeAvatar(token);
      setAvatar(null);
    } catch (caught) {
      setError(describe(caught));
    } finally {
      setBusy(false);
    }
  };

  const disabled = !token || busy;

  return (
    <div className="flex flex-col items-center gap-4">
      {avatar ? (
        <img
          src={avatar}
          alt="Profile photo"
          className="size-40 rounded-full border-4 border-ink-strong object-cover max-mobile:size-28"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex size-40 items-center justify-center rounded-full bg-ink-strong text-7xl font-black text-white max-mobile:size-28 max-mobile:text-5xl"
        >
          {initial}
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        aria-label="Upload profile photo"
        className="sr-only"
        onChange={handleFile}
        disabled={disabled}
      />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          variant="navbarOutline"
          size="navbar"
          disabled={disabled}
          onClick={() => fileInput.current?.click()}
        >
          {busy ? 'SAVING…' : 'CHANGE PHOTO'}
        </Button>
        {avatar && (
          <Button type="button" variant="navbarOutline" size="navbar" disabled={disabled} onClick={handleRemove}>
            REMOVE PHOTO
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="max-w-xs rounded-2xl bg-red-100 p-3 text-center text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}