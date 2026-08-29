// ============================================================================
// NEXORA LUXE — ENVIRONMENT ACCESS
//
// Vite inlines `import.meta.env` at build time. Outside a Vite context (unit
// tests run under plain Node/tsx) `import.meta.env` is undefined, so every
// read goes through this module which falls back to an empty object instead
// of throwing. Tests can inject values by setting `process.env` before import.
// ============================================================================

interface ImportMetaWithEnv {
  env?: Record<string, string | undefined>;
}

function viteEnv(): Record<string, string | undefined> {
  const meta = (import.meta as unknown as ImportMetaWithEnv | undefined)?.env;
  if (meta && typeof meta === 'object') return meta;
  return {};
}

/** Vite env var, with a Node `process.env` fallback for test/CI runs. */
function read(key: string): string {
  const fromVite = viteEnv()[key];
  if (fromVite) return fromVite;
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
}

export const ENV = {
  get SUPABASE_URL(): string {
    return read('VITE_SUPABASE_URL');
  },
  get SUPABASE_ANON_KEY(): string {
    return read('VITE_SUPABASE_ANON_KEY');
  },
  get SUPABASE_STORAGE_KEY(): string {
    return read('VITE_SUPABASE_STORAGE_KEY') || 'nexora.auth.qwaehqsmodekbgvnaavz';
  },
};

const PLACEHOLDER_PATTERNS = ['mock-nexora-project', 'your-project', 'your-anon'];

/**
 * True when real Supabase credentials are present. Placeholder values from
 * `.env.example` are treated as "not configured" so the app falls back to the
 * local demo store instead of firing requests at a non-existent project.
 */
export function hasRealSupabaseCredentials(url?: string, key?: string): boolean {
  const u = ((url || ENV.SUPABASE_URL) ?? '').trim();
  const k = ((key || ENV.SUPABASE_ANON_KEY) ?? '').trim();
  if (!u || !k) return false;
  return !PLACEHOLDER_PATTERNS.some((pattern) => u.includes(pattern) || k.includes(pattern));
}
