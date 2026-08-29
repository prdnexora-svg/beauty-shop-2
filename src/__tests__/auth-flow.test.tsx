import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../App';

/**
 * The Supabase client is replaced with a controllable stub so the auth routing
 * rules can be exercised without a live backend. Everything else (paths,
 * constants, helpers) comes from the real module.
 */
const auth = vi.hoisted(() => ({
  isConfigured: false,
  authReady: true,
  session: null as null | { user: { id: string; user_metadata?: Record<string, unknown> } },
  user: null as null | { id: string; user_metadata?: Record<string, unknown> },
  locationSyncStatus: 'idle',
  signOut: vi.fn(async () => {}),
}));

const redirectToLogin = vi.hoisted(() => vi.fn());

vi.mock('../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/supabase')>();
  return {
    ...actual,
    SupabaseProvider: ({ children }: { children: React.ReactNode }) => children,
    redirectToLogin,
    useSupabase: () => ({
      ...auth,
      user: auth.user ?? auth.session?.user ?? null,
      signInWithEmailPassword: vi.fn(async () => ({ error: null })),
      signUpWithEmailPassword: vi.fn(async () => ({ error: null })),
      signInWithOtp: vi.fn(async () => ({ error: null })),
      verifyOtp: vi.fn(async () => ({ error: null })),
      signInWithGoogle: vi.fn(async () => {}),
      syncData: vi.fn(async () => {}),
    }),
  };
});

function setPath(path: string) {
  window.history.replaceState({}, '', path);
}

beforeEach(() => {
  auth.isConfigured = false;
  auth.authReady = true;
  auth.session = null;
  auth.user = null;
  redirectToLogin.mockReset();
  setPath('/');
});

afterEach(() => {
  setPath('/');
});

describe('auth routing', () => {
  it('sends an anonymous visitor from an owner screen to /auth/login', async () => {
    auth.isConfigured = true;

    render(<App initialScreen="buyer-dashboard" />);

    await waitFor(() => expect(redirectToLogin).toHaveBeenCalled());
    expect(screen.getByTestId('full-page-loader')).toBeInTheDocument();
    expect(screen.getByText(/Redirecting to secure sign-in/)).toBeInTheDocument();
  });

  it('renders the full-page sign-in screen on the /auth/login route', async () => {
    auth.isConfigured = true;
    setPath('/auth/login');

    render(<App />);

    // The AuthModal is code-split; it replaces the Suspense loader once loaded.
    expect(await screen.findByText(/Sign In to Nexora Luxe/i, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it('normalizes a completed /auth/callback back to the app root', async () => {
    auth.isConfigured = true;
    auth.session = { user: { id: 'user-1', user_metadata: { role: 'buyer' } } };
    auth.user = auth.session.user;
    setPath('/auth/callback?code=abc123&state=xyz');

    const replaceState = vi.spyOn(window.history, 'replaceState');

    render(<App />);

    await waitFor(() =>
      expect(replaceState).toHaveBeenCalledWith(expect.anything(), '', '/'),
    );
    // Landing page renders for the authenticated session.
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    replaceState.mockRestore();
  });

  it('keeps a signed-in buyer on the dashboard without redirecting', async () => {
    auth.isConfigured = true;
    auth.session = { user: { id: 'user-1', user_metadata: { role: 'buyer' } } };
    auth.user = auth.session.user;

    render(<App initialScreen="buyer-dashboard" />);

    await waitFor(() => expect(screen.queryByTestId('screen-fallback')).toBeNull(), {
      timeout: 8000,
    });
    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(screen.getAllByText('Buyer Dashboard').length).toBeGreaterThan(0);
  });

  it('opens the sign-in modal for guests who try to enter the workspace', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByText('Profile'));

    expect(
      await screen.findByText(/Sign In to Nexora Luxe/i, {}, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});
