import { afterEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// The real pages load data from the API. Only the routing is tested here, so each page is a stub.
mock.module('@/dashboard/pages/my-listings.tsx', () => ({ default: () => <h1>Club listings page</h1> }));
mock.module('@/dashboard/pages/admin-listings.tsx', () => ({ default: () => <h1>Admin listings page</h1> }));
mock.module('@/dashboard/pages/club-profile.tsx', () => ({ default: () => <h1>Club profile page</h1> }));
mock.module('@/dashboard/pages/clubs.tsx', () => ({ default: () => <h1>Clubs page</h1> }));

const { default: DashboardRoutes } = await import('../src/dashboard/DashboardRoutes');

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderDashboardAs(role: string, path: string) {
  localStorage.setItem(
    'auth',
    JSON.stringify({ token: 'test-token', user: { id: 1, username: 'test', email: 'test@feup.pt', country: 'PT', role } })
  );
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard/*" element={<DashboardRoutes />} />
        <Route path="/" element={<h1>Site home</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('/dashboard/listings', () => {
  // Regression: admin and club each had their own "listings" route, and only the first one ever
  // matched, so clubs were sent in a loop and never saw their drafts.
  it('shows a club its own listings', async () => {
    renderDashboardAs('CLUB', '/dashboard/listings');

    expect(await screen.findByRole('heading', { name: 'Club listings page' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Admin listings page' })).toBeNull();
  });

  it('shows an admin the listings of every club', async () => {
    renderDashboardAs('ADMIN', '/dashboard/listings');

    expect(await screen.findByRole('heading', { name: 'Admin listings page' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Club listings page' })).toBeNull();
  });

  it('sends a club from /dashboard straight to its listings', async () => {
    renderDashboardAs('CLUB', '/dashboard');

    expect(await screen.findByRole('heading', { name: 'Club listings page' })).toBeInTheDocument();
  });
});

describe('role-only dashboard pages', () => {
  it('keeps clubs out of the admin pages', async () => {
    renderDashboardAs('CLUB', '/dashboard/clubs');

    expect(await screen.findByRole('heading', { name: 'Club listings page' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Clubs page' })).toBeNull();
  });

  it('keeps admins out of the club profile page', async () => {
    renderDashboardAs('ADMIN', '/dashboard/club');

    expect(screen.queryByRole('heading', { name: 'Club profile page' })).toBeNull();
  });

  it('sends buyers back to the site', async () => {
    renderDashboardAs('BUYER', '/dashboard/listings');

    expect(await screen.findByRole('heading', { name: 'Site home' })).toBeInTheDocument();
  });
});
