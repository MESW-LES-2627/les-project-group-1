const baseUrl = (
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin)
).replace(/\/+$/, '');

export type ProfileUser = {
  username: string;
  email: string;
  country: string;
};

export type MyProfile = ProfileUser & {
  avatar: string | null;
};

export type ProfileInput = {
  username: string;
  country: string;
};

export type Purchase = {
  id: number;
  itemName: string;
  amount: number;
  paidAt: string | null;
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

async function request(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.error ?? 'unknown');
  return data;
}

export async function saveProfile(token: string, input: ProfileInput): Promise<ProfileUser> {
  const data = await request('/api/users/me', token, { method: 'PUT', body: JSON.stringify(input) });
  return data.user as ProfileUser;
}

export async function fetchPurchases(token: string): Promise<Purchase[]> {
  const data = await request('/api/users/me/purchases', token);
  return data.purchases as Purchase[];
}

export async function fetchMe(token: string): Promise<MyProfile> {
  const data = await request('/api/users/me', token);
  return { ...data.user, avatar: data.user?.avatar ?? null } as MyProfile;
}

export async function saveAvatar(token: string, image: string): Promise<void> {
  await request('/api/users/me/avatar', token, { method: 'PUT', body: JSON.stringify({ image }) });
}

export async function removeAvatar(token: string): Promise<void> {
  await request('/api/users/me/avatar', token, { method: 'DELETE' });
}