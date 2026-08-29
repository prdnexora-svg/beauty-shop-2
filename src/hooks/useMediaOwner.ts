// ============================================================================
// NEXORA LUXE — MEDIA OWNER
// Resolves "who is uploading" for every media surface.
//
//   * Supabase configured  -> the authenticated user's id (from the session,
//                             never hardcoded — storage policies key on it).
//   * Demo mode            -> a stable, locally generated id persisted in
//                             localStorage so demo uploads remain attributable
//                             and deletable across reloads.
//   * Signed out           -> null. Uploaders refuse to run without an owner.
// ============================================================================

import { useMemo } from 'react';
import { useSupabase } from '../lib/supabase';
import { isStorageConfigured } from '../lib/mediaConfig';

const DEMO_OWNER_KEY = 'nexora_media_demo_owner';

function uuidV4(): string {
  const webCrypto: Crypto | undefined =
    typeof crypto !== 'undefined' ? (crypto as Crypto) : undefined;

  if (webCrypto && typeof webCrypto.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    // RFC4122 v4 shape built from CSPRNG bytes.
    const bytes = new Uint8Array(16);
    webCrypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function demoOwnerId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const existing = localStorage.getItem(DEMO_OWNER_KEY);
    if (existing && existing.length >= 8) return existing;

    // Demo mode only: adopt a stable id when the local session says signed in.
    const loggedIn = localStorage.getItem('nexora_is_logged_in') === 'true';
    if (!loggedIn) return null;
    const created = uuidV4();
    localStorage.setItem(DEMO_OWNER_KEY, created);
    return created;
  } catch {
    return null;
  }
}

/** Called from the auth success path so demo uploads get an owner. */
export function ensureDemoOwner(): string | null {
  return demoOwnerId();
}

export function clearDemoOwner(): void {
  try {
    localStorage.removeItem(DEMO_OWNER_KEY);
  } catch {
    /* ignore */
  }
}

export interface MediaOwner {
  ownerId: string | null;
  isAuthenticated: boolean;
  /** True when running without a real Supabase project. */
  isDemo: boolean;
  email?: string | null;
}

export function useMediaOwner(): MediaOwner {
  const { user } = useSupabase();

  return useMemo(() => {
    if (isStorageConfigured()) {
      return {
        ownerId: user?.id ?? null,
        isAuthenticated: Boolean(user?.id),
        isDemo: false,
        email: user?.email ?? null,
      };
    }
    const demoId = demoOwnerId();
    return {
      ownerId: demoId,
      isAuthenticated: Boolean(demoId),
      isDemo: true,
      email: null,
    };
  }, [user]);
}

export default useMediaOwner;
