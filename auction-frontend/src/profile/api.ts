const baseUrl = (
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin)
).replace(/\/+$/, '');

export type ProfileUser = {
  username: string;
  email: string;
  country: string;
};

export type ProfileInput = {
  username: string;
  country: string;
};

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export async function saveProfile(token: string, input: ProfileInput): Promise<ProfileUser> {
  const response = await fetch(`${baseUrl}/api/users/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.error ?? 'unknown');
  return data.user as ProfileUser;
}