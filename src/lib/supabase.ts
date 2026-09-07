import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { DatabaseState } from '../db/database';
import { useLocationSync, LocationSyncStatus } from '../hooks/useLocationSync';

// ============================================================================
// NEXORA LUXE — SIMPLE EMAIL + PASSWORD AUTH
// No mobile number, no OTP. Only Gmail/Email + Password + Google OAuth.
// ============================================================================

const DEFAULT_STORAGE_KEY = 'nexora.auth.qwaehqsmodekbgvnaavz';
// Storage key is env-overridable so multiple Supabase projects (staging/prod)
// can share a browser without clobbering each other's session.
const SUPABASE_STORAGE_KEY = readEnv('VITE_SUPABASE_STORAGE_KEY') || DEFAULT_STORAGE_KEY;
export const AUTH_LOGIN_PATH = '/auth/login';
export const AUTH_CALLBACK_PATH = '/auth/callback';
export const AUTH_CALLBACK_PREFIX = '/auth/';
const AUTH_REDIRECT_THROTTLE_MS = 3000;
let lastAuthRedirectAt = 0;

// `import.meta.env` is injected by Vite and is undefined under plain Node
// (unit tests), so every read goes through this guard.
function readEnv(key: string): string {
  const env = (import.meta as any)?.env;
  const value = env ? env[key] : undefined;
  return typeof value === 'string' ? value : '';
}

const supabaseUrl = readEnv('VITE_SUPABASE_URL') || 'https://mock-nexora-project.supabase.co';
const supabaseAnonKey = readEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stbmV4b3JhLXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDA0MDAwMCwiZXhwIjoyMDE1NjE2MDAwfQ.mock_key_nexora';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: SUPABASE_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export function isSupabaseConfigured(): boolean {
  const url = readEnv('VITE_SUPABASE_URL');
  const key = readEnv('VITE_SUPABASE_ANON_KEY');
  return Boolean(
    url &&
    key &&
    !url.includes('mock-nexora-project') &&
    !url.includes('your-project') &&
    !url.includes('your-project.supabase.co') &&
    !key.includes('your-anon') &&
    !key.includes('your-project'),
  );
}

export function getSupabaseConfigInfo() {
  return {
    url: readEnv('VITE_SUPABASE_URL'),
    storageKey: SUPABASE_STORAGE_KEY,
    isConfigured: isSupabaseConfigured(),
    anonKeyTruncated: readEnv('VITE_SUPABASE_ANON_KEY')
      ? `${readEnv('VITE_SUPABASE_ANON_KEY').slice(0, 10)}...${readEnv('VITE_SUPABASE_ANON_KEY').slice(-6)}`
      : 'Not set'
  };
}

export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string; details?: any; latencyMs?: number }> {
  const start = performance.now();
  try {
    if (!isSupabaseConfigured()) {
      return {
        connected: false,
        message: 'Supabase credentials are not yet configured in environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Currently running with local demo mode.',
      };
    }
    const { data, error } = await supabase.from('products').select('id', { count: 'exact', head: true });
    const latencyMs = Math.round(performance.now() - start);
    if (error) {
      return {
        connected: false,
        message: `Supabase connected, table query note: ${error.message}. (Ensure schema migration is run)`,
        latencyMs,
      };
    }
    return {
      connected: true,
      message: `Successfully connected to Supabase! (${latencyMs}ms)`,
      details: data,
      latencyMs,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Error connecting to Supabase.',
    };
  }
}

export async function syncAllDataToSupabase(state: DatabaseState): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      syncedCount: 0,
      errors: ['Supabase credentials not set.']
    };
  }
  const errors: string[] = [];
  let syncedCount = 0;
  try {
    // `users` is deliberately NOT synced. It is a mirror of auth.users owned by
    // the on_auth_user_created trigger (migration 0006), and the local seed ids
    // ('usr-buyer-priya', ...) are not UUIDs and have no auth.users parent — an
    // upsert would fail the UUID cast and the new FK, or create orphan rows.
    if (state.profiles_buyer?.length) {
      const { error } = await supabase.from('profiles_buyer').upsert(state.profiles_buyer);
      if (error) errors.push(`profiles_buyer: ${error.message}`);
      else syncedCount += state.profiles_buyer.length;
    }
    if (state.profiles_supplier?.length) {
      const { error } = await supabase.from('profiles_supplier').upsert(state.profiles_supplier);
      if (error) errors.push(`profiles_supplier: ${error.message}`);
      else syncedCount += state.profiles_supplier.length;
    }
    if (state.products?.length) {
      const { error } = await supabase.from('products').upsert(state.products);
      if (error) errors.push(`products: ${error.message}`);
      else syncedCount += state.products.length;
    }
    if (state.rfqs_enquiries?.length) {
      const { error } = await supabase.from('rfqs_enquiries').upsert(state.rfqs_enquiries);
      if (error) errors.push(`rfqs_enquiries: ${error.message}`);
      else syncedCount += state.rfqs_enquiries.length;
    }
    if (state.quotes?.length) {
      const { error } = await supabase.from('quotes').upsert(state.quotes);
      if (error) errors.push(`quotes: ${error.message}`);
      else syncedCount += state.quotes.length;
    }
    if (state.messages?.length) {
      const { error } = await supabase.from('messages').upsert(state.messages);
      if (error) errors.push(`messages: ${error.message}`);
      else syncedCount += state.messages.length;
    }
    return { success: errors.length === 0, syncedCount, errors };
  } catch (err: any) {
    return { success: false, syncedCount, errors: [err.message || 'Unexpected error.'] };
  }
}

// Auth helpers
export function hasAuthCallbackParams(): boolean {
  if (typeof window === 'undefined') return false;
  const url = new URL(window.location.href);
  return url.searchParams.has('code') || url.searchParams.has('state');
}

export function getAuthCallbackCode(): string | null {
  if (typeof window === 'undefined') return null;
  return new URL(window.location.href).searchParams.get('code');
}

export function isAuthPath(pathname: string): boolean {
  return pathname === AUTH_LOGIN_PATH || pathname.startsWith(AUTH_CALLBACK_PREFIX);
}

export function stripAuthCallbackParams(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  let changed = false;
  const transientParams = ['code','state','error','error_description','error_code','token_type','access_token','refresh_token','expires_in','expires_at','scope'];
  for (const key of transientParams) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) return;
  const cleaned = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', cleaned);
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === AUTH_LOGIN_PATH) return;
  const now = Date.now();
  if (now - lastAuthRedirectAt < AUTH_REDIRECT_THROTTLE_MS) return;
  lastAuthRedirectAt = now;
  window.location.replace(AUTH_LOGIN_PATH);
}

function isAuthenticationInvalidatingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const authError = error as { name?: string; code?: string; status?: number; message?: string; };
  const code = (authError.code || '').toLowerCase();
  const message = (authError.message || '').toLowerCase();
  return authError.name === 'AuthSessionMissingError'
    || authError.name === 'AuthInvalidTokenResponseError'
    || authError.name === 'SyntaxError'
    || authError.status === 401
    || authError.status === 403
    || ['refresh_token_not_found','refresh_token_already_used','session_not_found','bad_jwt'].includes(code)
    || message.includes('invalid refresh token')
    || message.includes('refresh token not found')
    || message.includes('jwt expired');
}

// Simple AuthFailure for UI compatibility
export type AuthFailureKind =
  | 'invalid_email'
  | 'credentials'
  | 'duplicate_email'
  | 'weak_password'
  | 'email_not_confirmed'
  | 'rate_limited'
  | 'network'
  | 'unknown';
export interface AuthFailure {
  kind: AuthFailureKind;
  title: string;
  message: string;
  hint?: string;
}

export type AuthRole = 'buyer' | 'supplier';

// ----------------------------------------------------------------------------
// Local demo auth (only used when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// are not configured). The public marketplace is otherwise guest-browsable, but
// the demo still needs a working sign-in path so the protected buyer/supplier
// portals can be evaluated without a live Supabase project. This is stored in a
// clearly namespaced browser-local session and is never treated as a real
// production identity.
// ----------------------------------------------------------------------------
const DEMO_AUTH_KEY = 'nexora_demo_auth_session';

export interface DemoAuthSession {
  role: AuthRole;
  email: string;
  businessName?: string;
  createdAt: string;
}

export function readDemoAuthSession(): DemoAuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DEMO_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoAuthSession>;
    const role = parsed.role === 'buyer' || parsed.role === 'supplier' ? parsed.role : null;
    const email = typeof parsed.email === 'string' ? parsed.email.trim() : '';
    if (!role || !email) return null;
    return {
      role,
      email,
      businessName: typeof parsed.businessName === 'string' ? parsed.businessName : undefined,
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeDemoAuthSession(session: DemoAuthSession): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(session));
  } catch {
    /* storage disabled / quota exceeded — demo login stays in-memory */
  }
}

export function clearDemoAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(DEMO_AUTH_KEY);
  } catch {
    /* storage disabled */
  }
}

/**
 * Single source of truth for credential validation, shared by the AuthModal and
 * authApi so the two paths cannot drift apart (they previously disagreed: 6 vs 8).
 */
export const MIN_PASSWORD_LENGTH = 6;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Role chosen before a redirect-based OAuth handshake. Google never carries our
// app role through the provider, so it is stashed here and re-applied once the
// PKCE callback resolves into a session.
const PENDING_ROLE_KEY = 'nexora_pending_role';

export function setPendingAuthRole(role: AuthRole): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(PENDING_ROLE_KEY, role); } catch { /* storage disabled */ }
}

export function readPendingAuthRole(): AuthRole | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(PENDING_ROLE_KEY);
    return value === 'buyer' || value === 'supplier' ? value : null;
  } catch { return null; }
}

export function clearPendingAuthRole(): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(PENDING_ROLE_KEY); } catch { /* storage disabled */ }
}

/** Single source of truth for a signed-in user's app role. */
export function resolveUserRole(user: User | null | undefined): AuthRole | null {
  const raw = (user?.user_metadata?.role ?? user?.app_metadata?.role) as string | undefined;
  return raw === 'buyer' || raw === 'supplier' ? raw : null;
}

/** Absolute URL for email-link redirects (confirm / recovery / invite). */
export function buildAuthRedirect(path: string = AUTH_CALLBACK_PATH): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${path}`;
}

/**
 * True when the account was created within `windowMs` (default 10 minutes).
 * Used to route first-time OAuth users into onboarding — Google never tells us
 * "new user" directly, but a session on a seconds-old account is one.
 * Pure and unit-tested; `nowMs` exists only for tests.
 */
export const NEW_USER_WINDOW_MS = 10 * 60 * 1000;

export function isNewAuthUser(
  user: { created_at?: string } | null | undefined,
  windowMs: number = NEW_USER_WINDOW_MS,
  nowMs: number = Date.now(),
): boolean {
  if (!user?.created_at) return false;
  const createdMs = Date.parse(user.created_at);
  if (!Number.isFinite(createdMs)) return false;
  return nowMs - createdMs >= 0 && nowMs - createdMs <= windowMs;
}

function classifySimpleError(error: any): AuthFailure {
  const msg = (error?.message || '').toLowerCase();
  const code = (error?.code || '').toLowerCase();
  if (code === 'user_already_exists' || msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already exists')) {
    return {
      kind: 'duplicate_email',
      title: 'Email already registered',
      message: 'An account with this email already exists. Please sign in instead.',
      hint: 'Switch to the Sign In tab, or reset your password if you have forgotten it.',
    };
  }
  if (code === 'weak_password' || msg.includes('password should be') || msg.includes('password is too weak')) {
    return { kind: 'weak_password', title: 'Password too weak', message: error?.message || 'Please choose a longer password (at least 6 characters).' };
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return {
      kind: 'email_not_confirmed',
      title: 'Email not confirmed',
      message: 'Please open the confirmation link we emailed you, then sign in again.',
    };
  }
  if (msg.includes('invalid login credentials') || msg.includes('incorrect password')) {
    return { kind: 'credentials', title: 'Incorrect email or password', message: 'Please check your Gmail ID and password and try again.' };
  }
  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('only request this after') || code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit') {
    return { kind: 'rate_limited', title: 'Too many attempts', message: 'Please wait a minute before trying again.' };
  }
  if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
    return { kind: 'invalid_email', title: 'Invalid email', message: 'Please enter a valid Gmail / Email address.' };
  }
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('fetch')) {
    return { kind: 'network', title: 'Network error', message: 'Could not reach the server. Check your internet connection and try again.' };
  }
  return { kind: 'unknown', title: 'Something went wrong', message: error?.message || 'Please try again.' };
}

// Context types - simplified, no phone/OTP
export type AuthenticationStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface SignupProfile {
  businessName?: string;
  contactName?: string;
}

export interface SupabaseContextType {
  supabase: SupabaseClient;
  isConfigured: boolean;
  authReady: boolean;
  authenticationStatus: AuthenticationStatus;
  session: Session | null;
  user: User | null;
  lastAuthEvent: AuthChangeEvent | null;
  /**
   * True after the user lands back from a password-recovery email link. The
   * app must show the set-new-password screen instead of normal content.
   */
  passwordRecovery: boolean;
  clearPasswordRecovery: () => void;
  locationSyncStatus: LocationSyncStatus;
  testConnection: () => Promise<{ connected: boolean; message: string; details?: any; latencyMs?: number }>;
  syncData: (state: DatabaseState) => Promise<{ success: boolean; syncedCount: number; errors: string[] }>;
  signInWithEmailPassword: (email: string, password: string) => Promise<{ error?: Error | null; failure?: AuthFailure | null; role?: AuthRole | null }>;
  signUpWithEmailPassword: (email: string, password: string, role: AuthRole, profile?: SignupProfile) => Promise<{ error?: Error | null; needsEmailConfirmation?: boolean; failure?: AuthFailure | null; role?: AuthRole | null }>;
  signInWithGoogle: (role: AuthRole) => Promise<{ error?: Error | null; failure?: AuthFailure | null }>;
  /** Sends the "reset your password" email. Never reveals if the email exists. */
  sendPasswordResetEmail: (email: string) => Promise<{ error?: Error | null; failure?: AuthFailure | null }>;
  /** Re-sends the signup confirmation email (lost / expired / spam-filtered). */
  resendSignupConfirmation: (email: string) => Promise<{ error?: Error | null; failure?: AuthFailure | null }>;
  /** Sets a new password (used by the recovery screen and account settings). */
  updatePassword: (newPassword: string) => Promise<{ error?: Error | null; failure?: AuthFailure | null }>;
  signOut: (opts?: { redirectToLogin?: boolean }) => Promise<void>;
}

const defaultContext: SupabaseContextType = {
  supabase,
  isConfigured: false,
  authReady: false,
  authenticationStatus: 'loading',
  session: null,
  user: null,
  lastAuthEvent: null,
  passwordRecovery: false,
  clearPasswordRecovery: () => {},
  locationSyncStatus: 'idle',
  testConnection: testSupabaseConnection,
  syncData: syncAllDataToSupabase,
  signInWithEmailPassword: async () => ({ error: null, failure: null, role: null }),
  signUpWithEmailPassword: async () => ({ error: null, needsEmailConfirmation: false, failure: null, role: null }),
  signInWithGoogle: async () => ({ error: null, failure: null }),
  sendPasswordResetEmail: async () => ({ error: null, failure: null }),
  resendSignupConfirmation: async () => ({ error: null, failure: null }),
  updatePassword: async () => ({ error: null, failure: null }),
  signOut: async () => {},
};

export const SupabaseContext = createContext<SupabaseContextType>(defaultContext);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured();
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authenticationStatus, setAuthenticationStatus] = useState<AuthenticationStatus>('loading');
  const [lastAuthEvent, setLastAuthEvent] = useState<AuthChangeEvent | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const hadSessionRef = useRef(false);

  const locationSyncStatus = useLocationSync({
    supabase,
    userId: session?.user?.id || null,
    enabled: isConfigured && Boolean(session?.user),
  });

  useEffect(() => {
    let mounted = true;
    if (!isConfigured) {
      setAuthenticationStatus('unauthenticated');
      setAuthReady(true);
      return () => { mounted = false; };
    }

    const hadPersistedAuthAtStartup = typeof window !== 'undefined' && Boolean(window.localStorage.getItem(SUPABASE_STORAGE_KEY));

    const applyAuthEvent = (event: AuthChangeEvent, nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setLastAuthEvent(event);
      setAuthenticationStatus(nextSession ? 'authenticated' : 'unauthenticated');
      setAuthReady(true);
      if (event === 'PASSWORD_RECOVERY') {
        // Recovery link opened: force the set-new-password screen.
        setPasswordRecovery(true);
        stripAuthCallbackParams();
      }
      if (nextSession) {
        hadSessionRef.current = true;
        lastAuthRedirectAt = 0;
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          stripAuthCallbackParams();
        }
      } else if (event === 'SIGNED_OUT') {
        hadSessionRef.current = false;
        setPasswordRecovery(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applyAuthEvent(event, nextSession);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setSession(null);
        setAuthenticationStatus('unauthenticated');
        setAuthReady(true);
        if (hadPersistedAuthAtStartup && isAuthenticationInvalidatingError(error)) {
          hadSessionRef.current = false;
          redirectToLogin();
        }
        return;
      }
      const nextSession = data?.session ?? null;
      setSession(nextSession);
      setAuthenticationStatus(nextSession ? 'authenticated' : 'unauthenticated');
      setAuthReady(true);
      if (nextSession) {
        hadSessionRef.current = true;
        lastAuthRedirectAt = 0;
        stripAuthCallbackParams();
      } else if (hadPersistedAuthAtStartup && !hasAuthCallbackParams()) {
        redirectToLogin();
      }
    }).catch((error: unknown) => {
      if (!mounted) return;
      setSession(null);
      setAuthenticationStatus('unauthenticated');
      setAuthReady(true);
      if (hadPersistedAuthAtStartup && isAuthenticationInvalidatingError(error)) {
        hadSessionRef.current = false;
        redirectToLogin();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  // Google OAuth cannot carry our app role through the provider redirect, so a
  // role selected before the handshake is written into user_metadata as soon as
  // the resulting session appears (only when the account has no role yet).
  useEffect(() => {
    if (!isConfigured) return;
    const authUser = session?.user;
    if (!authUser) return;
    const pending = readPendingAuthRole();
    if (!pending) return;
    if (resolveUserRole(authUser)) {
      clearPendingAuthRole();
      return;
    }
    let cancelled = false;
    supabase.auth.updateUser({ data: { role: pending } })
      .then(({ data, error }) => {
        if (cancelled || error) return;
        clearPendingAuthRole();
        if (data?.user) {
          setSession((prev) => (prev ? { ...prev, user: data.user } : prev));
        }
      })
      .catch(() => { /* retried on next session change */ });
    return () => { cancelled = true; };
  }, [isConfigured, session?.user?.id]);

  const value = useMemo<SupabaseContextType>(() => ({
    supabase,
    isConfigured,
    authReady,
    authenticationStatus,
    session,
    user: session?.user ?? null,
    lastAuthEvent,
    passwordRecovery,
    clearPasswordRecovery: () => setPasswordRecovery(false),
    locationSyncStatus,
    testConnection: testSupabaseConnection,
    syncData: syncAllDataToSupabase,
    // Any thrown error (network failure, CORS, DNS) is converted into a returned
    // failure so the caller can always clear its loading state.
    signInWithEmailPassword: async (email, password) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return { error: error as Error, failure: classifySimpleError(error), role: null };
        }
        // Legacy accounts created before role metadata existed default to buyer
        // so the app never lands on a null-role dead end.
        let role = resolveUserRole(data.user);
        if (!role) {
          role = 'buyer';
          const { data: updated } = await supabase.auth.updateUser({ data: { role } });
          role = resolveUserRole(updated?.user) ?? role;
        }
        return { error: null, failure: null, role };
      } catch (err: any) {
        return { error: err as Error, failure: classifySimpleError(err), role: null };
      }
    },
    signUpWithEmailPassword: async (email, password, role) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role },
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}${AUTH_CALLBACK_PATH}` : undefined,
          },
        });
        if (error) {
          return { error: error as Error, needsEmailConfirmation: false, failure: classifySimpleError(error), role: null };
        }
        // With email confirmation enabled Supabase does NOT error on a duplicate
        // signup; it returns an obfuscated user with an empty identities array.
        // Without this check the UI would report success for an existing account.
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          const failure = classifySimpleError({ code: 'user_already_exists' });
          return { error: new Error(failure.message), needsEmailConfirmation: false, failure, role: null };
        }
        return {
          error: null,
          needsEmailConfirmation: Boolean(data?.user && !data.session),
          failure: null,
          role: resolveUserRole(data?.user) ?? role,
        };
      } catch (err: any) {
        return { error: err as Error, needsEmailConfirmation: false, failure: classifySimpleError(err), role: null };
      }
    },
    signInWithGoogle: async (role) => {
      try {
        // Persist the selected role across the provider redirect; the callback
        // writes it into user_metadata once the session exists.
        setPendingAuthRole(role);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}${AUTH_CALLBACK_PATH}` : undefined,
            queryParams: { access_type: 'offline', prompt: 'consent' },
          },
        });
        if (error) {
          clearPendingAuthRole();
          return { error: error as Error, failure: classifySimpleError(error) };
        }
        return { error: null, failure: null };
      } catch (err: any) {
        clearPendingAuthRole();
        return { error: err as Error, failure: classifySimpleError(err) };
      }
    },
    sendPasswordResetEmail: async (email) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: buildAuthRedirect(AUTH_CALLBACK_PATH),
        });
        if (error) {
          return { error: error as Error, failure: classifySimpleError(error) };
        }
        return { error: null, failure: null };
      } catch (err: any) {
        return { error: err as Error, failure: classifySimpleError(err), };
      }
    },
    resendSignupConfirmation: async (email) => {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: buildAuthRedirect(AUTH_CALLBACK_PATH) },
        });
        if (error) {
          return { error: error as Error, failure: classifySimpleError(error) };
        }
        return { error: null, failure: null };
      } catch (err: any) {
        return { error: err as Error, failure: classifySimpleError(err) };
      }
    },
    updatePassword: async (newPassword) => {
      try {
        if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
          const failure: AuthFailure = {
            kind: 'weak_password',
            title: 'Password too short',
            message: `Please choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`,
          };
          return { error: new Error(failure.message), failure };
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          return { error: error as Error, failure: classifySimpleError(error) };
        }
        setPasswordRecovery(false);
        return { error: null, failure: null };
      } catch (err: any) {
        return { error: err as Error, failure: classifySimpleError(err) };
      }
    },
    signOut: async (opts) => {
      clearPendingAuthRole();
      setPasswordRecovery(false);
      if (!isConfigured) {
        localStorage.removeItem('nexora_user_session');
        localStorage.setItem('nexora_is_logged_in', 'false');
        localStorage.removeItem('nexora_user_role');
        clearDemoAuthSession();
        setSession(null);
        setAuthenticationStatus('unauthenticated');
        setAuthReady(true);
        return;
      }
      try {
        await supabase.auth.signOut();
      } catch {
        /* Local state is cleared regardless of a network failure. */
      } finally {
        setSession(null);
        setAuthenticationStatus('unauthenticated');
        setAuthReady(true);
        if (opts?.redirectToLogin) redirectToLogin();
      }
    },
  }), [isConfigured, authReady, authenticationStatus, session, lastAuthEvent, passwordRecovery, locationSyncStatus]);

  return React.createElement(SupabaseContext.Provider, { value }, children);
};

export const useSupabase = () => useContext(SupabaseContext);

/** Cooldown between confirmation / password-reset email re-sends. */
export const AUTH_RESEND_COOLDOWN_MS = 60000;
