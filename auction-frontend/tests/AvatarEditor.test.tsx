import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvatarEditor } from '../src/components/AvatarEditor';

const originalFetch = globalThis.fetch;
const photo = 'data:image/jpeg;base64,/9j/AAAA';

let calls: { url: string; init?: RequestInit }[] = [];
let currentAvatar: string | null = null;
let writeStatus = 200;
let writeBody: unknown = {};

beforeEach(() => {
  calls = [];
  currentAvatar = null;
  writeStatus = 200;
  writeBody = {};
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const method = init?.method ?? 'GET';
    const body =
      method === 'GET'
        ? { user: { username: 'afonso', email: 'a@feup.pt', country: 'PT', avatar: currentAvatar } }
        : writeBody;
    const status = method === 'GET' ? 200 : writeStatus;
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const fakeResize = async () => photo;
const pngFile = () => new File(['x'], 'photo.png', { type: 'image/png' });

describe('AvatarEditor', () => {
  it('shows the initial when there is no photo', async () => {
    render(<AvatarEditor token="abc" initial="A" resize={fakeResize} />);

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'REMOVE PHOTO' })).toBeNull();
  });

  it('shows the saved photo', async () => {
    currentAvatar = photo;
    render(<AvatarEditor token="abc" initial="A" resize={fakeResize} />);

    expect(await screen.findByAltText('Profile photo')).toHaveAttribute('src', photo);
    expect(screen.getByRole('button', { name: 'REMOVE PHOTO' })).toBeInTheDocument();
  });

  it('uploads a new photo sending the bearer token', async () => {
    const user = userEvent.setup();
    render(<AvatarEditor token="abc" initial="A" resize={fakeResize} />);

    await user.upload(screen.getByLabelText('Upload profile photo'), pngFile());

    expect(await screen.findByAltText('Profile photo')).toHaveAttribute('src', photo);
    const put = calls.find((call) => call.init?.method === 'PUT');
    expect(put?.url.endsWith('/api/users/me/avatar')).toBe(true);
    expect((put!.init!.headers as Record<string, string>).Authorization).toBe('Bearer abc');
    expect(JSON.parse(put!.init!.body as string)).toEqual({ image: photo });
  });

  it('removes the photo', async () => {
    currentAvatar = photo;
    const user = userEvent.setup();
    render(<AvatarEditor token="abc" initial="A" resize={fakeResize} />);

    await user.click(await screen.findByRole('button', { name: 'REMOVE PHOTO' }));

    expect(await screen.findByText('A')).toBeInTheDocument();
    expect(screen.queryByAltText('Profile photo')).toBeNull();
    expect(calls.some((call) => call.init?.method === 'DELETE')).toBe(true);
  });

  it('shows a friendly message when the server rejects the image', async () => {
    writeStatus = 400;
    writeBody = { error: 'invalid_image' };
    const user = userEvent.setup();
    render(<AvatarEditor token="abc" initial="A" resize={fakeResize} />);

    await user.upload(screen.getByLabelText('Upload profile photo'), pngFile());

    expect(await screen.findByText('Please choose a valid image.')).toBeInTheDocument();
    expect(screen.queryByAltText('Profile photo')).toBeNull();
  });

  it('shows a message when the image cannot be processed', async () => {
    const user = userEvent.setup();
    const failingResize = async () => {
      throw new Error('canvas_unavailable');
    };
    render(<AvatarEditor token="abc" initial="A" resize={failingResize} />);

    await user.upload(screen.getByLabelText('Upload profile photo'), pngFile());

    expect(await screen.findByText('Could not update your photo. Please try again.')).toBeInTheDocument();
  });

  it('disables the controls when there is no session token', () => {
    render(<AvatarEditor token="" initial="A" resize={fakeResize} />);

    expect(screen.getByRole('button', { name: 'CHANGE PHOTO' })).toBeDisabled();
    expect(screen.getByLabelText('Upload profile photo')).toBeDisabled();
  });
});