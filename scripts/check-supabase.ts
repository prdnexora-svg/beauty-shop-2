/**
 * Live Supabase backend health check.
 *
 * Usage:
 *   npm run db:check            # reads .env
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run db:check
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function readEnvFile(path: string): Record<string, string> {
  try {
    const text = readFileSync(path, 'utf8');
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .reduce<Record<string, string>>((acc, line) => {
        const idx = line.indexOf('=');
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        acc[key] = value;
        return acc;
      }, {});
  } catch {
    return {};
  }
}

(async () => {
  const env = readEnvFile('.env');
  const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
  const key = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    console.error('FAIL: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set.');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  console.log(`Checking ${url}`);

  const checks: Array<[string, string]> = [
    ['supplier directory', 'profiles_supplier'],
    ['products', 'products'],
    ['buyer profiles', 'profiles_buyer'],
    ['rfqs_enquiries', 'rfqs_enquiries'],
    ['quotes', 'quotes'],
    ['messages', 'messages'],
    ['categories', 'categories'],
    ['subcategories', 'subcategories'],
  ];

  let failures = 0;
  for (const [label, table] of checks) {
    try {
      const { error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        // Some tables are intentionally owner-only. Column/permission errors
        // are meaningful, but an owner-only read should not fail a basic check.
        const isPermission = /permission denied|RLS|row-level security/i.test(`${error.code || ''} ${error.message}`);
        if (isPermission) {
          console.log(`  [${label}] table reachable (RLS-protected): ${error.message}`);
          continue;
        }
        failures += 1;
        console.error(`  [${label}] FAIL: ${error.message}`);
        continue;
      }
      console.log(`  [${label}] OK (${count ?? '?'} rows reachable anonymously)`);
    } catch (err: any) {
      failures += 1;
      console.error(`  [${label}] NETWORK FAIL: ${err?.message || err}`);
    }
  }

  if (failures > 0) {
    console.error(`\nFAIL: ${failures} check(s) failed. Applied migrations? See docs/supabase-live-integration.md`);
    process.exit(1);
  }
  console.log('\nPASS: Supabase backend reachable and public tables respond.');
})().catch((err) => {
  console.error('Unexpected health-check failure:', err);
  process.exit(1);
});
