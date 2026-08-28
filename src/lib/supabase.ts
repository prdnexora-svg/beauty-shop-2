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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-nexora-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stbmV4b3JhLXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDA0MDAwMCwiZXhwIjoyMDE1NjE2MDAwfQ.mock_key_nexora';

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
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
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
    url: import.meta.env.VITE_SUPABASE_URL || '',
    storageKey: SUPABASE_STORAGE_KEY,
    isConfigured: isSupabaseConfigured(),
    anonKeyTruncated: import.meta.env.VITE_SUPABASE_ANON_KEY
      ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 10)}...${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(-6)}`
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
export type AuthFailureKind = 'invalid_email' | 'credentials' | 'rate_limited' | 'network' | 'unknown';
export interface AuthFailure {
  kind: AuthFailureKind;
  title: string;
  message: string;
  hint?: string;
}

function classifySimpleError(error: any): AuthFailure {
  const msg = (error?.message || '').toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('incorrect password') || msg.includes('invalid')) {
    return { kind: 'credentials', title: 'Incorrect email or password', message: 'Please check your Gmail ID and password and try again.' };
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return { kind: 'rate_limited', title: 'Too many attempts', message: 'Please wait a minute before trying again.' };
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return { kind: 'network', title: 'Network error', message: 'Could not reach server. Check internet connection.' };
  }
  return { kind: 'unknown', title: 'Sign in failed', message: error?.message || 'Please try again.' };
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
  signInWithEmailPassword: (email: string, password: string) => Promise<{ error?: Error | null; failure?: AuthFailure | null }>;
  signUpWithEmailPassword: (email: string, password: string, role: 'buyer' | 'supplier') => Promise<{ error?: Error | null; needsEmailConfirmation?: boolean; failure?: AuthFailure | null }>;
  signInWithGoogle: () => Promise<void>;
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
  signInWithEmailPassword: async () => ({ error: null, failure: null }),
  signUpWithEmailPassword: async () => ({ error: null, needsEmailConfirmation: false, failure: null }),
  signInWithGoogle: async () => {},
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
    signInWithEmailPassword: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return {
        error: error as Error | null,
        failure: error ? classifySimpleError(error) : null,
      };
    },
    signUpWithEmailPassword: async (email, password, role) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        },
      });
      return {
        error: error as Error | null,
        needsEmailConfirmation: Boolean(data?.user && !data.session),
        failure: error ? classifySimpleError(error) : null,
      };
    },
    signInWithGoogle: async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
    },
    signOut: async (opts) => {
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
      } finally {
        setSession(null);
        setAuthenticationStatus('unauthenticated');
        setAuthReady(true);
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
export type AuthFailureKind = 'invalid_email' | 'credentials' | 'rate_limited' | 'network' | 'unknown';
export type OtpChannel = 'email' | 'sms' | 'whatsapp';
export type PhoneCapability = 'disabled' | 'unknown' | 'available' | 'unavailable';
