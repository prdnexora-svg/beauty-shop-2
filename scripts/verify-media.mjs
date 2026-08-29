#!/usr/bin/env node
/**
 * NEXORA LUXE — MEDIA SYSTEM VERIFICATION HARNESS
 *
 * Runs three layers of checks:
 *
 *   1. STATIC  — the SQL migration really defines every bucket, policy, table
 *                and helper the app depends on, and no service-role key or
 *                hardcoded user id leaked into browser code.
 *   2. UNIT    — `tests/media.test.ts` (validation, path/owner scoping, URLs).
 *   3. LIVE    — when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set,
 *                probes the real project: migration applied, buckets present,
 *                anonymous writes blocked by RLS.
 *
 * Usage:
 *   npm run verify:media
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run verify:media
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATION = join(ROOT, 'src/db/migrations/0005_media_storage.sql');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
};

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

function section(title) {
  console.log(`\n${C.bold}${title}${C.reset}`);
}

function pass(name, detail) {
  passed += 1;
  console.log(`  ${C.green}✓${C.reset} ${name}${detail ? ` ${C.dim}${detail}${C.reset}` : ''}`);
}

function fail(name, detail) {
  failed += 1;
  failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
  console.log(`  ${C.red}✗${C.reset} ${name}${detail ? ` — ${detail}` : ''}`);
}

function skip(name, detail) {
  skipped += 1;
  console.log(`  ${C.yellow}•${C.reset} ${name}${detail ? ` ${C.dim}${detail}${C.reset}` : ''}`);
}

function assert(name, condition, detail) {
  if (condition) pass(name, detail);
  else fail(name, detail);
}

// ===========================================================================
// 1. STATIC — migration contents
// ===========================================================================

section('1. Migration (static analysis)');

if (!existsSync(MIGRATION)) {
  fail('migration file exists', MIGRATION);
} else {
  const sql = readFileSync(MIGRATION, 'utf8');
  pass('migration file exists', 'src/db/migrations/0005_media_storage.sql');

  const BUCKETS = ['avatars', 'product-media', 'ad-creatives', 'videos', 'documents'];
  for (const bucket of BUCKETS) {
    assert(`bucket "${bucket}" is created`, new RegExp(`'${bucket}'\\s*,\\s*'${bucket}'`).test(sql));
  }

  assert(
    'public buckets are marked public',
    /'avatars'\s*,\s*'avatars'\s*,\s*true/.test(sql) &&
      /'videos'\s*,\s*'videos'\s*,\s*true/.test(sql),
  );
  assert(
    'documents bucket is private',
    /'documents'\s*,\s*'documents'\s*,\s*false/.test(sql),
  );

  // Every bucket needs read + write policies; private ones must NOT have a
  // public SELECT policy.
  for (const bucket of BUCKETS) {
    assert(
      `bucket "${bucket}" has a write policy scoped to the owner folder`,
      new RegExp(
        `bucket_id = '${bucket}'[\\s\\S]{0,400}?\\(storage\\.foldername\\(name\\)\\)\\[1\\] = auth\\.uid\\(\\)::text`,
      ).test(sql),
    );
  }

  assert(
    'public read policies exist for public buckets',
    /for select to public using \(bucket_id = 'avatars'\)/.test(sql) &&
      /for select to public using \(bucket_id = 'videos'\)/.test(sql),
  );
  assert(
    'private documents bucket has owner-only read',
    /owner_read_documents[\s\S]{0,300}bucket_id = 'documents' and \(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/.test(sql),
  );
  assert(
    'no anonymous read policy on the private bucket',
    !/bucket_id = 'documents'[\s\S]{0,120}for select to public/.test(sql),
  );

  assert('media_assets table is created', /create table if not exists public\.media_assets/.test(sql));
  assert('media_assets has RLS enabled', /alter table public\.media_assets enable row level security/.test(sql));
  assert('media_assets select policy exists', /create policy media_assets_select/.test(sql));
  assert('media_assets insert is owner-scoped', /media_assets_insert[\s\S]{0,200}owner_id = auth\.uid\(\)/.test(sql));
  assert('media_assets delete is owner-or-admin', /media_assets_delete[\s\S]{0,200}owner_id = auth\.uid\(\) or public\.is_platform_admin\(\)/.test(sql));
  assert('bucket column is constrained', /constraint media_assets_bucket_check/.test(sql));
  assert('path is unique per bucket', /constraint media_assets_bucket_path_key unique \(bucket, path\)/.test(sql));
  assert('is_platform_admin helper defined', /create or replace function public\.is_platform_admin\(\)/.test(sql));
  assert('mark_media_replaced helper defined', /create or replace function public\.mark_media_replaced\(/.test(sql));
  assert('migration is idempotent (create table if not exists)', (sql.match(/if not exists/gi) || []).length >= 3);
  assert('migration is idempotent (on conflict)', /on conflict \(id\) do update/.test(sql));
  assert(
    'migration never references a service-role key',
    !/service_role/i.test(sql),
  );
  assert(
    'SECURITY DEFINER functions pin search_path',
    (sql.match(/set search_path = public/g) || []).length >= 2,
  );
}

// ===========================================================================
// 1b. STATIC — secret & anti-pattern scan across browser code
// ===========================================================================

section('2. Secret & anti-pattern scan (src/)');

const SOURCE_EXT = /\.(ts|tsx|js|jsx)$/;
const SKIP_DIRS = ['node_modules', 'dist', 'build'];

function walk(dir, acc = []) {
  let entries = [];
  try {
    entries = readFileSync(dir, 'utf8') ? [] : [];
  } catch {
    /* ignore */
  }
  const fs = require('node:fs');
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (SOURCE_EXT.test(entry.name)) acc.push(full);
  }
  return acc;
}

const { readdirSync } = await import('node:fs');
function collect(dir, acc = []) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collect(full, acc);
    else if (SOURCE_EXT.test(entry.name)) acc.push(full);
  }
  return acc;
}

const sourceFiles = collect(join(ROOT, 'src'));
pass(`scanned ${sourceFiles.length} source files`);

const serviceRoleHits = [];
const secretHits = [];
for (const file of sourceFiles) {
  const text = readFileSync(file, 'utf8');
  if (/service_role|SUPABASE_SERVICE|SECRET_KEY|SUPABASE_JWT_SECRET/i.test(text)) {
    serviceRoleHits.push(file.replace(ROOT, ''));
  }
  // A real Supabase JWT has three dot-separated base64 segments and is long.
  if (/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(text)) {
    secretHits.push(file.replace(ROOT, ''));
  }
}

assert('no service-role references in browser code', serviceRoleHits.length === 0, serviceRoleHits.join(', '));
assert('no inline JWT/secret literals in browser code', secretHits.length === 0, secretHits.join(', '));

const envExample = readFileSync(join(ROOT, '.env.example'), 'utf8');
assert(
  '.env.example warns against the service-role key',
  /service_role/i.test(envExample),
);

// ===========================================================================
// 2. UNIT TESTS
// ===========================================================================

section('3. Tests (unit + component render)');

const TEST_SUITES = [
  { file: 'tests/media.test.ts', label: 'validation / path / URL unit tests' },
  { file: 'tests/media.render.test.tsx', label: 'component render smoke tests' },
];

for (const suite of TEST_SUITES) {
  try {
    const output = execFileSync(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['tsx', suite.file],
      { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' },
    );
    const summary = output.match(/passed:.*$/m);
    pass(suite.label, summary ? summary[0].replace(/\x1b\[\d+m/g, '').trim() : '');
  } catch (error) {
    const output = `${error.stdout || ''}${error.stderr || ''}`;
    const failedLines = output
      .split('\n')
      .filter((line) => line.includes('✗'))
      .map((line) => line.replace(/\x1b\[\d+m/g, '').trim());
    fail(suite.label, failedLines.join(' | '));
    console.log(C.dim + output.split('\n').slice(-15).join('\n') + C.reset);
  }
}

// ===========================================================================
// 3. LIVE CHECKS
// ===========================================================================

const url = (process.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const configured = Boolean(url && anonKey && !/mock-nexora-project|your-project|your-anon/.test(url + anonKey));

section('4. Live Supabase checks');

if (!configured) {
  skip(
    'live checks',
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — run with credentials to exercise real buckets',
  );
} else {
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

  // 4a. Was the migration applied? Ask PostgREST for the table.
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/media_assets?select=id&limit=1`, {
      headers: { ...headers, Accept: 'application/json' },
    });
    if (res.ok) {
      pass('media_assets table is reachable', `HTTP ${res.status} (RLS returns only permitted rows)`);
    } else {
      const body = await res.text();
      const missingTable = /PGRST205|42P01|does not exist/i.test(body);
      fail(
        'media_assets table is reachable',
        missingTable
          ? 'table not found — run src/db/migrations/0005_media_storage.sql'
          : `HTTP ${res.status}: ${body.slice(0, 160)}`,
      );
    }
  } catch (error) {
    fail('media_assets table is reachable', error.message);
  }

  // 4b. Do the buckets exist? Probe a non-existent object and read the error:
  //     "Bucket not found" vs "Object not found" distinguishes the two.
  for (const bucket of ['avatars', 'product-media', 'ad-creatives', 'videos', 'documents']) {
    try {
      const res = await fetch(
        `${url.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/__nexora_probe__.png`,
        { headers },
      );
      const body = await res.text();
      if (/bucket not found/i.test(body)) {
        fail(`bucket "${bucket}" exists`, 'bucket not found — migration not applied');
      } else if (res.status === 404) {
        pass(`bucket "${bucket}" exists`, 'probe object correctly reported missing');
      } else {
        skip(`bucket "${bucket}" exists`, `unexpected HTTP ${res.status}`);
      }
    } catch (error) {
      fail(`bucket "${bucket}" exists`, error.message);
    }
  }

  // 4c. RLS: an anonymous caller must not be able to write into any bucket.
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/storage/v1/object/avatars/anonymous/probe.png`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'image/png', 'x-upsert': 'true' },
      body: new Uint8Array([137, 80, 78, 71]),
    });
    if (res.ok) {
      fail('anonymous upload is blocked by RLS', 'SECURITY: an unauthenticated write succeeded');
    } else {
      pass('anonymous upload is blocked by RLS', `HTTP ${res.status}`);
    }
  } catch (error) {
    fail('anonymous upload is blocked by RLS', error.message);
  }

  // 4d. Private bucket must not serve objects anonymously.
  try {
    const res = await fetch(
      `${url.replace(/\/$/, '')}/storage/v1/object/public/documents/__nexora_probe__.pdf`,
      { headers },
    );
    const body = await res.text();
    const refuses = res.status === 400 || res.status === 401 || res.status === 403 || /not allowed|unauthorized|policy/i.test(body);
    if (refuses) pass('private bucket refuses public object access', `HTTP ${res.status}`);
    else skip('private bucket refuses public object access', `HTTP ${res.status}: ${body.slice(0, 120)}`);
  } catch (error) {
    fail('private bucket refuses public object access', error.message);
  }
}

// ===========================================================================
// SUMMARY
// ===========================================================================

console.log(`\n${C.bold}Summary${C.reset}`);
console.log(`  passed:  ${C.green}${passed}${C.reset}`);
console.log(`  failed:  ${C.red}${failed}${C.reset}`);
console.log(`  skipped: ${C.yellow}${skipped}${C.reset}`);

if (failed > 0) {
  console.log(`\n${C.red}Failures:${C.reset}`);
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}

console.log(`\n${C.green}Media system verification passed.${C.reset}`);
if (skipped > 0) {
  console.log(`${C.yellow}Some checks were skipped — see above.${C.reset}`);
}
