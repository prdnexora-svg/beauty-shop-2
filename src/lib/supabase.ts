import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { DatabaseState } from '../db/database';
import { useLocationSync, LocationSyncStatus } from '../hooks/useLocationSync';

// ============================================================================
// NEXORA LUXE — SIMPLE EMAIL + PASSWORD AUTH
// No mobile number, no OTP. Only Gmail/Email + Password + Google OAuth.
// ============================================================================

const SUPABASE_STORAGE_KEY = 'nexora.auth.qwaehqsmodekbgvnaavz';
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
    if (state.users?.length) {
      const { error } = await supabase.from('users').upsert(state.users);
      if (error) errors.push(`users: ${error.message}`);
      else syncedCount += state.users.length;
    }
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
  if (msg.includes('rate limit') || msg.includes('too many requests') || code === 'over_request_rate_limit') {
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

export interface SupabaseContextType {
  supabase: SupabaseClient;
  isConfigured: boolean;
  authReady: boolean;
  authenticationStatus: AuthenticationStatus;
  session: Session | null;
  user: User | null;
  lastAuthEvent: AuthChangeEvent | null;
  locationSyncStatus: LocationSyncStatus;
  testConnection: () => Promise<{ connected: boolean; message: string; details?: any; latencyMs?: number }>;
  syncData: (state: DatabaseState) => Promise<{ success: boolean; syncedCount: number; errors: string[] }>;
  signInWithEmailPassword: (email: string, password: string) => Promise<{ error?: Error | null; failure?: AuthFailure | null; role?: AuthRole | null }>;
  signUpWithEmailPassword: (email: string, password: string, role: AuthRole) => Promise<{ error?: Error | null; needsEmailConfirmation?: boolean; failure?: AuthFailure | null; role?: AuthRole | null }>;
  signInWithGoogle: (role: AuthRole) => Promise<{ error?: Error | null; failure?: AuthFailure | null }>;
  signOut: (opts?: { redirectToLogin?: boolean }) => Promise<void>;
  // Deprecated stubs for backward compatibility (no-op, always disabled)
  signInWithOtp?: any;
  verifyOtp?: any;
  phoneOtpCapability?: any;
  phoneOtpCapabilityDetail?: any;
  recheckPhoneOtpCapability?: any;
}

const defaultContext: SupabaseContextType = {
  supabase,
  isConfigured: false,
  authReady: false,
  authenticationStatus: 'loading',
  session: null,
  user: null,
  lastAuthEvent: null,
  locationSyncStatus: 'idle',
  testConnection: testSupabaseConnection,
  syncData: syncAllDataToSupabase,
  signInWithEmailPassword: async () => ({ error: null, failure: null, role: null }),
  signUpWithEmailPassword: async () => ({ error: null, needsEmailConfirmation: false, failure: null, role: null }),
  signInWithGoogle: async () => ({ error: null, failure: null }),
  signOut: async () => {},
  signInWithOtp: async () => ({ error: new Error('OTP login is disabled. Use email + password.'), failure: null, channel: 'email', target: '', skipped: true }),
  verifyOtp: async () => ({ error: new Error('OTP disabled'), failure: null }),
  phoneOtpCapability: 'disabled',
  phoneOtpCapabilityDetail: null,
  recheckPhoneOtpCapability: async () => 'disabled',
};

export const SupabaseContext = createContext<SupabaseContextType>(defaultContext);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured();
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authenticationStatus, setAuthenticationStatus] = useState<AuthenticationStatus>('loading');
  const [lastAuthEvent, setLastAuthEvent] = useState<AuthChangeEvent | null>(null);
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
      if (nextSession) {
        hadSessionRef.current = true;
        lastAuthRedirectAt = 0;
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          stripAuthCallbackParams();
        }
      } else if (event === 'SIGNED_OUT') {
        hadSessionRef.current = false;
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
    signOut: async (opts) => {
      clearPendingAuthRole();
      if (!isConfigured) {
        localStorage.removeItem('nexora_user_session');
        localStorage.setItem('nexora_is_logged_in', 'false');
        localStorage.setItem('nexora_user_role', 'guest');
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
    // Stubs for backward compat
    signInWithOtp: async () => ({ error: new Error('OTP disabled'), failure: null, channel: 'email', target: '', skipped: true }),
    verifyOtp: async () => ({ error: new Error('OTP disabled'), failure: null }),
    phoneOtpCapability: 'disabled',
    phoneOtpCapabilityDetail: null,
    recheckPhoneOtpCapability: async () => 'disabled' as any,
  }), [isConfigured, authReady, authenticationStatus, session, lastAuthEvent, locationSyncStatus]);

  return React.createElement(SupabaseContext.Provider, { value }, children);
};

export const useSupabase = () => useContext(SupabaseContext);

// Backward compatible exports (so other files don't break, but OTP is disabled)
export const SUPABASE_OTP_LENGTH = 6;
export const OTP_RESEND_COOLDOWN_MS = 60000;
export const SUPABASE_AUTH_PROVIDERS_URL = 'https://supabase.com/dashboard/project/_/auth/providers-and-otp';
export const SMS_PROVIDER_FIX_STEPS: { label: string; detail: string }[] = [];
export const formatPhoneForDisplay = (v: string) => v;
export const parseAuthIdentifier = (raw: string) => {
  const input = (raw || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input) return { kind: 'invalid' as const, value: '', display: '', error: 'Enter email.' };
  if (emailRegex.test(input)) return { kind: 'email' as const, value: input, display: input };
  return { kind: 'invalid' as const, value: input, display: input, error: 'Enter valid email.' };
};
export const phoneOtpAllowed = () => false;
export const toE164Phone = (raw: string) => ({ value: raw, ok: false, error: 'Phone not supported' });
export type OtpChannel = 'email' | 'sms' | 'whatsapp';
export type PhoneCapability = 'disabled' | 'unknown' | 'available' | 'unavailable';
