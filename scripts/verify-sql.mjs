// ============================================================================
// NEXORA LUXE — SQL MIGRATION & STORAGE RLS VERIFICATION
//
// Boots a real PostgreSQL engine in-process (PGlite, WASM), recreates the
// Supabase platform schemas that live outside the migrations folder, applies
// every migration in order, and then:
//
//   1. proves each migration executes without error (and is idempotent)
//   2. cross-checks storage.buckets against the client config in mediaConfig.ts
//   3. dumps the effective storage.objects policy matrix per bucket
//   4. ENFORCES the policies behaviourally — real SET ROLE + real JWT claims,
//      real inserts/updates/deletes, real accept/deny outcomes
//
// Run: npm run verify:sql
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import {
  ROLES_SQL,
  EXTENSIONS_SQL,
  AUTH_SQL,
  STORAGE_SQL,
  PUBLIC_GRANTS_SQL,
  requestContext,
} from './supabase-stub.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};

let passed = 0;
let failed = 0;
const failures = [];

function section(t) { console.log(`\n${C.bold}${t}${C.reset}`); }
function pass(name, detail = '') {
  passed += 1;
  console.log(`  ${C.green}✓${C.reset} ${name}${detail ? ` ${C.dim}${detail}${C.reset}` : ''}`);
}
function fail(name, detail = '') {
  failed += 1;
  failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
  console.log(`  ${C.red}✗${C.reset} ${name}${detail ? ` ${C.dim}${detail}${C.reset}` : ''}`);
}
function check(name, ok, detail = '') { ok ? pass(name, detail) : fail(name, detail); }
function info(msg) { console.log(`  ${C.dim}•${C.reset} ${msg}`); }

// ---------------------------------------------------------------------------
// SQL statement splitter that understands $$ dollar-quoting, 'single quotes',
// "double quotes", -- line comments and /* block comments */.
// ---------------------------------------------------------------------------
function splitStatements(sql) {
  const statements = [];
  let buf = '';
  let i = 0;
  const n = sql.length;
  const push = () => {
    const s = buf.trim();
    if (s) statements.push(s);
    buf = '';
  };
  while (i < n) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (ch === '-' && next === '-') {
      while (i < n && sql[i] !== '\n') { buf += sql[i]; i += 1; }
      continue;
    }
    if (ch === '/' && next === '*') {
      buf += '/*'; i += 2;
      while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) { buf += sql[i]; i += 1; }
      buf += '*/'; i += 2;
      continue;
    }
    if (ch === "'") {
      buf += ch; i += 1;
      while (i < n) {
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") { buf += "''"; i += 2; continue; }
          buf += "'"; i += 1; break;
        }
        buf += sql[i]; i += 1;
      }
      continue;
    }
    if (ch === '"') {
      buf += ch; i += 1;
      while (i < n) {
        if (sql[i] === '"') { buf += '"'; i += 1; break; }
        buf += sql[i]; i += 1;
      }
      continue;
    }
    // Dollar-quoted body: $$ ... $$ or $tag$ ... $tag$
    if (ch === '$') {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
      if (m) {
        const tag = m[0];
        buf += tag; i += tag.length;
        while (i < n && sql.slice(i, i + tag.length) !== tag) { buf += sql[i]; i += 1; }
        buf += tag; i += tag.length;
        continue;
      }
    }
    if (ch === ';') { push(); i += 1; continue; }
    buf += ch; i += 1;
  }
  push();
  return statements;
}

/**
 * PGlite does not bundle `uuid-ossp`. Strip the CREATE EXTENSION line and rely
 * on the stub's `uuid_generate_v4()`. Documented substitution — affects the
 * UUID source only, never DDL/constraint/policy logic.
 */
function prepareMigration(sql) {
  return sql.replace(/create\s+extension\s+if\s+not\s+exists\s+"uuid-ossp"\s*;/gi, '-- [harness] uuid-ossp substituted by stub uuid_generate_v4()');
}

async function applyStatements(db, sql, label) {
  const statements = splitStatements(sql);
  const errors = [];
  for (let i = 0; i < statements.length; i += 1) {
    const stmt = statements[i];
    try {
      await db.exec(stmt);
    } catch (error) {
      errors.push({
        index: i + 1,
        message: error.message,
        statement: stmt.length > 220 ? `${stmt.slice(0, 220)}…` : stmt,
      });
    }
  }
  if (errors.length === 0) {
    pass(`${label} executes cleanly`, `${statements.length} statements`);
  } else {
    fail(`${label} executes cleanly`, `${errors.length} of ${statements.length} statements errored`);
    errors.slice(0, 6).forEach((e) => {
      console.log(`      ${C.red}#${e.index}${C.reset} ${e.message}`);
      console.log(`      ${C.dim}${e.statement.replace(/\n/g, ' ')}${C.reset}`);
    });
    if (errors.length > 6) info(`…and ${errors.length - 6} more`);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Request-scoped helpers
// ---------------------------------------------------------------------------
async function asRequest(db, ctx, fn) {
  return db.transaction(async (tx) => {
    await tx.exec(requestContext(ctx));
    return fn(tx);
  });
}

/** Expect the statement to be REJECTED (RLS error) or to touch nothing. */
async function expectDenied(db, ctx, sql, label) {
  try {
    const res = await asRequest(db, ctx, async (tx) => {
      const r = await tx.query(sql);
      return r.affectedRows ?? r.rows?.length ?? 0;
    });
    // RLS `using` clauses filter silently: zero rows touched == denied.
    if (res === 0) pass(label, 'blocked (0 rows)');
    else fail(label, `expected denial, ${res} row(s) affected`);
  } catch (error) {
    pass(label, `rejected: ${error.message.split('\n')[0].slice(0, 90)}`);
  }
}

/** Expect the statement to SUCCEED and touch at least one row. */
async function expectAllowed(db, ctx, sql, label) {
  try {
    const res = await asRequest(db, ctx, async (tx) => {
      const r = await tx.query(sql);
      return r.affectedRows ?? r.rows?.length ?? 0;
    });
    if (res > 0) pass(label, `allowed (${res} row(s))`);
    else fail(label, 'expected success but 0 rows were affected');
  } catch (error) {
    fail(label, `unexpectedly rejected: ${error.message.split('\n')[0].slice(0, 120)}`);
  }
}

async function scalar(db, sql, params = []) {
  const r = await db.query(sql, params);
  return r.rows?.[0];
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const USER_C = '33333333-3333-4333-8333-333333333333';
// Exists ONLY in auth.users (never inserted into the legacy public.users).
// This is what a real Supabase Auth signup looks like today.
const USER_D = '44444444-4444-4444-8444-444444444444';

const BUCKETS = ['avatars', 'product-media', 'ad-creatives', 'videos', 'documents'];
const PUBLIC_BUCKETS = ['avatars', 'product-media', 'ad-creatives', 'videos'];

/** What scripts must match — mirrors src/lib/mediaConfig.ts MEDIA_BUCKETS. */
const EXPECTED_BUCKETS = {
  avatars: { public: true, maxBytes: 5 * 1024 * 1024, kinds: ['image'] },
  'product-media': { public: true, maxBytes: 10 * 1024 * 1024, kinds: ['image'] },
  'ad-creatives': { public: true, maxBytes: 10 * 1024 * 1024, kinds: ['image'] },
  videos: { public: true, maxBytes: 200 * 1024 * 1024, kinds: ['video', 'image'] },
  documents: { public: false, maxBytes: 25 * 1024 * 1024, kinds: ['document', 'image'] },
};

const ANON = { role: 'anon' };
const A = { role: 'authenticated', sub: USER_A, email: 'a@example.com' };
const B = { role: 'authenticated', sub: USER_B, email: 'b@example.com' };
const ADMIN = { role: 'authenticated', sub: USER_C, email: 'admin@nexoraluxe.com' };
const ADMIN_CLAIM = { role: 'authenticated', sub: USER_C, email: 'someone@example.com', appRole: 'admin' };
const D = { role: 'authenticated', sub: USER_D, email: 'd@example.com' };

// ============================================================================
console.log(`${C.bold}Nexora Luxe — SQL migration & storage RLS verification${C.reset}`);
console.log(C.dim + 'Engine: PGlite (PostgreSQL in WASM). Platform schemas stubbed; RLS evaluation is real.' + C.reset);

const db = new PGlite();
const version = (await scalar(db, 'select version()')).version;
console.log(C.dim + version.split(' on ')[0] + C.reset);

// ---------------------------------------------------------------------------
section('0. Platform bootstrap');
await db.exec(ROLES_SQL);
await db.exec(EXTENSIONS_SQL);
await db.exec(AUTH_SQL);
await db.exec(STORAGE_SQL);
await db.exec(`
  insert into auth.users (id, email) values
    ('${USER_A}', 'a@example.com'),
    ('${USER_B}', 'b@example.com'),
    ('${USER_C}', 'admin@nexoraluxe.com'),
    ('${USER_D}', 'd@example.com')
  on conflict (id) do nothing;
`);
pass('auth + storage schemas and anon/authenticated roles created');

// ---------------------------------------------------------------------------
section('1. Migration execution');

const MIGRATIONS = [
  { file: 'src/db/schema.sql', label: 'base schema (src/db/schema.sql, un-numbered)' },
  { file: 'src/db/migrations/0002_rls_policies.sql', label: '0002_rls_policies.sql' },
  { file: 'src/db/migrations/0003_location_sync.sql', label: '0003_location_sync.sql' },
  { file: 'src/db/migrations/0004_supplier_onboarding_workflow.sql', label: '0004_supplier_onboarding_workflow.sql' },
  { file: 'src/db/migrations/0005_media_storage.sql', label: '0005_media_storage.sql' },
  { file: 'src/db/migrations/0006_security_hardening.sql', label: '0006_security_hardening.sql' },
];

for (const m of MIGRATIONS) {
  let sql;
  try {
    sql = prepareMigration(readFileSync(join(ROOT, m.file), 'utf8'));
  } catch (error) {
    fail(`${m.label} is readable`, error.message);
    continue;
  }
  await applyStatements(db, sql, m.label);
}

await db.exec(PUBLIC_GRANTS_SQL);

// The legacy public.users table is never populated by the application, but
// several later tests write to legacy tables, so mirror the auth users into it.
// Section 9 proves what happens when this row is absent (i.e. real life).
await db.exec(`
  insert into public.users (id, email, phone, password_hash, role)
  values
    ('${USER_A}', 'a@example.com',      '+910000000001', 'x', 'buyer'),
    ('${USER_B}', 'b@example.com',      '+910000000002', 'x', 'supplier'),
    ('${USER_C}', 'admin@nexoraluxe.com','+910000000003','x', 'admin')
  on conflict (id) do nothing;
`);

// ---------------------------------------------------------------------------
section('2. Idempotency (re-running must be safe)');
for (const m of MIGRATIONS.slice(-3)) {
  const sql = prepareMigration(readFileSync(join(ROOT, m.file), 'utf8'));
  await applyStatements(db, sql, `${m.label} re-run`);
}

// ---------------------------------------------------------------------------
section('3. Self-containment — 0005 on a pristine database');
{
  const fresh = new PGlite();
  await fresh.exec(ROLES_SQL);
  await fresh.exec(EXTENSIONS_SQL);
  await fresh.exec(AUTH_SQL);
  await fresh.exec(STORAGE_SQL);
  const sql = prepareMigration(readFileSync(join(ROOT, 'src/db/migrations/0005_media_storage.sql'), 'utf8'));
  await applyStatements(fresh, sql, '0005 standalone (no prior migrations)');
  await fresh.close();
}

// ---------------------------------------------------------------------------
section('4. Bucket configuration vs client config (mediaConfig.ts)');
{
  const rows = (await db.query(
    `select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id`,
  )).rows;
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

  check('all 5 buckets exist', BUCKETS.every((b) => byId[b]), `found ${rows.length}`);

  for (const [id, expected] of Object.entries(EXPECTED_BUCKETS)) {
    const row = byId[id];
    if (!row) { fail(`bucket "${id}" configured`, 'missing from storage.buckets'); continue; }
    const sizeOk = Number(row.file_size_limit) === expected.maxBytes;
    const visOk = row.public === expected.public;
    check(
      `bucket "${id}": visibility + size cap`,
      sizeOk && visOk,
      `${row.public ? 'public' : 'private'}, ${(Number(row.file_size_limit) / 1048576).toFixed(0)}MB${sizeOk ? '' : ` (expected ${expected.maxBytes / 1048576}MB)`}${visOk ? '' : ' (visibility mismatch!)'}`,
    );
  }

  // MIME allow-lists must cover what the client is allowed to hand over.
  const needsVideo = byId.videos?.allowed_mime_types || [];
  check('videos bucket accepts video MIME types', needsVideo.some((m) => String(m).startsWith('video/')), needsVideo.join(', '));
  const docs = byId.documents?.allowed_mime_types || [];
  check('documents bucket accepts PDF', docs.includes('application/pdf'), docs.join(', '));
  check('documents bucket is private', byId.documents?.public === false);
}

// ---------------------------------------------------------------------------
section('5. Effective storage.objects policy matrix');
{
  const policies = (await db.query(
    `select policyname, cmd, roles, qual, with_check
       from pg_policies
      where schemaname = 'storage' and tablename = 'objects'
      order by policyname`,
  )).rows;

  check('storage.objects has RLS enabled', (await scalar(db,
    `select rowsecurity from pg_tables where schemaname='storage' and tablename='objects'`)).rowsecurity === true);

  const bucketOf = (qual) => {
    // Pull the bucket_id literal(s) out of a policy expression.
    const m = /bucket_id\s*=\s*'([^']+)'/g;
    const out = new Set();
    let hit;
    while ((hit = m.exec(qual || ''))) out.add(hit[1]);
    return out;
  };

  for (const bucket of BUCKETS) {
    const relevant = policies.filter((p) => bucketOf(`${p.qual} ${p.with_check}`).has(bucket));
    const cmds = new Set(relevant.map((p) => String(p.cmd).toUpperCase()));
    const has = (c) => cmds.has(c);
    const ok = has('SELECT') && has('INSERT') && has('UPDATE') && has('DELETE');
    check(
      `${bucket}: SELECT+INSERT+UPDATE+DELETE policies present`,
      ok,
      `${relevant.length} policies [${[...cmds].sort().join(',')}]`,
    );
  }

  // The four public buckets must be anonymously readable; documents must not.
  // `TO public` shows up in pg_policies.roles as ['public']; an omitted TO
  // clause also means PUBLIC. Both grant anonymous reads.
  const isPublicRole = (roles) => {
    const r = roles || [];
    return r.length === 0 || r.includes('public') || r.includes('anon');
  };
  for (const bucket of PUBLIC_BUCKETS) {
    const sel = policies.find((p) => String(p.cmd).toUpperCase() === 'SELECT' && bucketOf(p.qual).has(bucket));
    check(`${bucket}: anonymous SELECT allowed`, Boolean(sel) && isPublicRole(sel.roles),
      sel ? `roles=${(sel.roles || []).join('|') || 'PUBLIC (all roles)'}` : 'no select policy');
  }
  const docSel = policies.filter((p) => String(p.cmd).toUpperCase() === 'SELECT' && bucketOf(p.qual).has('documents'));
  check('documents: no anonymous SELECT policy',
    docSel.length > 0 && docSel.every((p) => (p.roles || []).includes('authenticated')),
    docSel.map((p) => (p.roles || []).join('|')).join(' , ') || 'none');

  // Every write policy must be confined to authenticated + owner folder.
  const writes = policies.filter((p) => ['INSERT', 'UPDATE', 'DELETE'].includes(String(p.cmd).toUpperCase()));
  const badWrite = writes.filter((p) => !(p.roles || []).includes('authenticated'));
  check('every write policy is restricted to `authenticated`', badWrite.length === 0,
    badWrite.length ? `unrestricted: ${badWrite.map((p) => p.policyname).join(', ')}` : `${writes.length} write policies`);

  const ownerScoped = writes.filter((p) => /auth\.uid\(\)/.test(`${p.qual} ${p.with_check}`) || /is_platform_admin/.test(`${p.qual} ${p.with_check}`));
  check('every write policy is owner- or admin-scoped',
    ownerScoped.length === writes.length,
    `${ownerScoped.length}/${writes.length}`);
}

// ---------------------------------------------------------------------------
section('6. BEHAVIOURAL RLS — storage.objects (real roles, real JWT claims)');
{
  // Seed one object per bucket, in USER_A's folder, as the service role.
  for (const bucket of BUCKETS) {
    await db.exec(`
      insert into storage.objects (bucket_id, name, owner, metadata)
      values ('${bucket}', '${USER_A}/verify/2026/08/a-${bucket}.bin', '${USER_A}', '{}'::jsonb)
      on conflict (bucket_id, name) do nothing;
    `);
  }
  info(`seeded ${BUCKETS.length} objects owned by USER_A`);

  for (const bucket of BUCKETS) {
    const ownName = `${USER_A}/verify/2026/08/a-${bucket}.bin`;
    const foreignName = `${USER_B}/verify/2026/08/b-${bucket}.bin`;
    const rootName = `no-owner-folder-${bucket}.bin`;

    await expectAllowed(db, A,
      `insert into storage.objects (bucket_id, name, owner) values ('${bucket}', '${USER_A}/verify/2026/08/new-${bucket}.bin', '${USER_A}')`,
      `${bucket}: owner can INSERT into own folder`);

    await expectDenied(db, A,
      `insert into storage.objects (bucket_id, name, owner) values ('${bucket}', '${foreignName}', '${USER_A}')`,
      `${bucket}: owner CANNOT INSERT into another user's folder`);

    await expectDenied(db, A,
      `insert into storage.objects (bucket_id, name, owner) values ('${bucket}', '${rootName}', '${USER_A}')`,
      `${bucket}: owner CANNOT INSERT outside the <uid>/ prefix`);

    await expectDenied(db, ANON,
      `insert into storage.objects (bucket_id, name, owner) values ('${bucket}', '${USER_A}/verify/2026/08/anon-${bucket}.bin', null)`,
      `${bucket}: ANONYMOUS CANNOT INSERT`);

    await expectDenied(db, B,
      `update storage.objects set metadata = '{"x":1}' where bucket_id = '${bucket}' and name = '${ownName}'`,
      `${bucket}: user B CANNOT UPDATE A's object`);

    await expectDenied(db, B,
      `delete from storage.objects where bucket_id = '${bucket}' and name = '${ownName}'`,
      `${bucket}: user B CANNOT DELETE A's object`);

    await expectAllowed(db, A,
      `update storage.objects set metadata = '{"ok":true}' where bucket_id = '${bucket}' and name = '${ownName}'`,
      `${bucket}: owner CAN UPDATE own object`);
  }

  // Read visibility.
  for (const bucket of PUBLIC_BUCKETS) {
    const r = await asRequest(db, ANON, (tx) =>
      tx.query(`select count(*)::int as n from storage.objects where bucket_id = '${bucket}'`));
    check(`${bucket}: anonymous CAN read`, r.rows[0].n > 0, `${r.rows[0].n} row(s) visible`);
  }
  {
    const r = await asRequest(db, ANON, (tx) =>
      tx.query(`select count(*)::int as n from storage.objects where bucket_id = 'documents'`));
    check('documents: anonymous CANNOT read', r.rows[0].n === 0, `${r.rows[0].n} row(s) visible`);
  }
  {
    const r = await asRequest(db, B, (tx) =>
      tx.query(`select count(*)::int as n from storage.objects where bucket_id = 'documents'`));
    check('documents: other authenticated user CANNOT read', r.rows[0].n === 0, `${r.rows[0].n} row(s) visible`);
  }
  {
    const r = await asRequest(db, A, (tx) =>
      tx.query(`select count(*)::int as n from storage.objects where bucket_id = 'documents'`));
    check('documents: owner CAN read own', r.rows[0].n > 0, `${r.rows[0].n} row(s) visible`);
  }
  {
    // Admin via app_metadata claim should see another user's private documents.
    const r = await asRequest(db, ADMIN_CLAIM, (tx) =>
      tx.query(`select count(*)::int as n from storage.objects where bucket_id = 'documents'`));
    check('documents: platform ADMIN can read (app_metadata claim)', r.rows[0].n > 0, `${r.rows[0].n} row(s) visible`);
  }
  {
    // Admin via the platform_admins allow-list (seeded email).
    const r = await asRequest(db, ADMIN, (tx) =>
      tx.query(`select count(*)::int as n from storage.objects where bucket_id = 'documents'`));
    check('documents: platform ADMIN can read (allow-list email)', r.rows[0].n > 0, `${r.rows[0].n} row(s) visible`);
  }

  // Cleanup of the objects created above.
  await db.exec(`delete from storage.objects where name like '%/verify/2026/08/new-%'`);
}

// ---------------------------------------------------------------------------
section('7. BEHAVIOURAL RLS — public.media_assets ledger');
{
  await db.exec(`
    insert into public.media_assets (owner_id, bucket, path, media_kind, visibility, scope, mime_type, byte_size, public_url)
    values
      ('${USER_A}', 'product-media', '${USER_A}/product/a.png', 'image', 'public',   'product', 'image/png', 1000, 'https://x/a.png'),
      ('${USER_A}', 'documents',     '${USER_A}/compliance/a.pdf', 'document', 'private', 'compliance', 'application/pdf', 2000, null),
      ('${USER_B}', 'documents',     '${USER_B}/compliance/b.pdf', 'document', 'private', 'compliance', 'application/pdf', 3000, null)
    on conflict (bucket, path) do nothing;
  `);

  await expectAllowed(db, A,
    `insert into public.media_assets (owner_id, bucket, path, media_kind, visibility, scope, mime_type, byte_size)
     values ('${USER_A}', 'product-media', '${USER_A}/product/self.png', 'image', 'public', 'product', 'image/png', 10)`,
    'owner can INSERT own asset');

  await expectDenied(db, A,
    `insert into public.media_assets (owner_id, bucket, path, media_kind, visibility, scope, mime_type, byte_size)
     values ('${USER_B}', 'product-media', '${USER_B}/product/spoof.png', 'image', 'public', 'product', 'image/png', 10)`,
    'owner CANNOT INSERT an asset owned by someone else');

  await expectDenied(db, ANON,
    `insert into public.media_assets (owner_id, bucket, path, media_kind, visibility, scope, mime_type, byte_size)
     values ('${USER_A}', 'product-media', '${USER_A}/product/anon.png', 'image', 'public', 'product', 'image/png', 10)`,
    'ANONYMOUS CANNOT INSERT an asset');

  const readAs = async (ctx) => (await asRequest(db, ctx, (tx) =>
    tx.query(`select id, owner_id, visibility from public.media_assets order by path`))).rows;

  const anonRows = await readAs(ANON);
  check('anonymous sees ONLY public assets',
    anonRows.length > 0 && anonRows.every((r) => r.visibility === 'public'),
    `${anonRows.length} row(s), all public`);

  const aRows = await readAs(A);
  check("user A sees own private asset but not B's",
    aRows.some((r) => r.owner_id === USER_A && r.visibility === 'private')
    && aRows.every((r) => r.owner_id === USER_A || r.visibility === 'public'),
    `${aRows.length} row(s) visible`);

  await expectDenied(db, B,
    `update public.media_assets set byte_size = 99999 where owner_id = '${USER_A}'`,
    "user B CANNOT UPDATE A's asset");

  await expectDenied(db, B,
    `delete from public.media_assets where owner_id = '${USER_A}'`,
    "user B CANNOT DELETE A's asset");

  await expectAllowed(db, A,
    `update public.media_assets set byte_size = 4242 where owner_id = '${USER_A}' and bucket = 'product-media' and path = '${USER_A}/product/a.png'`,
    'owner CAN UPDATE own asset');
}

// ---------------------------------------------------------------------------
// Sections 8-10 are wrapped so one unexpected error cannot stop the summary.
try {
section('8. SECURITY DEFINER function hardening');
{
  const definerFns = (await db.query(`
    select p.proname, p.prosecdef, p.proconfig,
           pg_get_function_identity_arguments(p.oid) as args
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('approve_supplier_onboarding','is_verified_supplier','is_platform_admin','mark_media_replaced')
     order by p.proname
  `)).rows;

  for (const fn of definerFns) {
    const isDefiner = fn.prosecdef;
    const hasSearchPath = (fn.proconfig || []).some((c) => c.startsWith('search_path='));
    check(
      `${fn.proname}(): search_path pinned`,
      !isDefiner || hasSearchPath,
      isDefiner ? (hasSearchPath ? 'SECURITY DEFINER + pinned' : 'SECURITY DEFINER but search_path NOT pinned') : 'not SECURITY DEFINER',
    );
  }

  const approve = definerFns.find((f) => f.proname === 'approve_supplier_onboarding');
  if (approve) {
    // The privilege-escalation check: a plain authenticated user must NOT be
    // able to approve anyone. Verify the body performs an authorization check.
    const src = (await scalar(db,
      `select prosrc from pg_proc where proname = 'approve_supplier_onboarding'`)).prosrc;
    const guarded = /is_platform_admin|auth\.uid\(\)|raise exception|current_setting\('request\.jwt/gi.test(src);
    check('approve_supplier_onboarding(): performs an authorization check', guarded,
      guarded ? 'guarded' : 'NO GUARD — any authenticated caller can self-verify (privilege escalation)');

    // Behavioural proof: B tries to approve a supplier profile.
    await db.exec(`
      insert into public.profiles_supplier (id, user_id, company_name, slug, business_type)
      values ('44444444-4444-4444-8444-444444444444', '${USER_B}', 'B Co', 'b-co', 'Manufacturer')
      on conflict (id) do nothing;
    `);
    let escalated = false;
    try {
      await asRequest(db, B, (tx) =>
        tx.query(`select public.approve_supplier_onboarding('44444444-4444-4444-8444-444444444444', 'self-approval')`));
      const row = await scalar(db,
        `select is_verified, onboarding_status from public.profiles_supplier where id = '44444444-4444-4444-8444-444444444444'`);
      escalated = row?.is_verified === true;
      check('non-admin CANNOT self-approve (behavioural)', !escalated,
        escalated ? 'APPROVED — privilege escalation confirmed' : 'still unverified');
    } catch (error) {
      pass('non-admin CANNOT self-approve (behavioural)', `blocked: ${error.message.split('\n')[0].slice(0, 80)}`);
    }
  }

  // mark_media_replaced: non-owner must not be able to retire someone else's asset.
  try {
    const before = await scalar(db,
      `select status from public.media_assets where owner_id = '${USER_A}' and bucket = 'product-media' and path = '${USER_A}/product/a.png'`);
    await asRequest(db, B, (tx) => tx.query(
      `select public.mark_media_replaced(
         (select id from public.media_assets where owner_id = '${USER_A}' and path = '${USER_A}/product/a.png'),
         (select id from public.media_assets where owner_id = '${USER_B}' limit 1))`));
    const after = await scalar(db,
      `select status from public.media_assets where owner_id = '${USER_A}' and bucket = 'product-media' and path = '${USER_A}/product/a.png'`);
    check('mark_media_replaced(): non-owner call is a no-op', before?.status === after?.status,
      `status stayed "${after?.status}"`);
  } catch (error) {
    fail('mark_media_replaced(): non-owner call is a no-op', error.message.split('\n')[0].slice(0, 100));
  }
}

// ---------------------------------------------------------------------------
section('9. Identity compatibility — can a real Supabase Auth user create a profile?');
{
  // This is the make-or-break compatibility question: after ALL migrations are
  // applied, can a user who signed up through Supabase Auth actually write
  // their profile row? Every RLS policy compares auth.uid() to user_id, but
  // user_id is a foreign key to public.users — a table nobody populates.
  const results = [];
  for (const t of ['profiles_buyer', 'profiles_supplier']) {
    const col = t === 'profiles_buyer'
      ? 'contact_name, company_name, business_type, city, state'
      : 'company_name, slug, business_type';
    const vals = t === 'profiles_buyer'
      ? `'P','C','Retailer','Jaipur','Rajasthan'`
      : `'C','c-co','Manufacturer'`;
    try {
      await asRequest(db, D, (tx) => tx.query(
        `insert into public.${t} (user_id, ${col}) values ('${USER_D}', ${vals})`));
      results.push({ table: t, ok: true });
    } catch (error) {
      results.push({ table: t, ok: false, message: error.message.split('\n')[0] });
    }
  }

  for (const r of results) {
    check(`${r.table}: authenticated user can INSERT own profile`, r.ok,
      r.ok ? 'inserted' : r.message?.slice(0, 150));
  }

  if (results.some((r) => !r.ok)) {
    const fk = results.find((r) => /violates foreign key constraint/.test(r.message || ''));
    if (fk) {
      info('ROOT CAUSE: user_id has an FK to public.users, but only Supabase Auth');
      info('populates auth.users. The two id spaces are never reconciled, so every');
      info('profile/message write is rejected by Postgres regardless of RLS.');
      info('Fix: repoint the FK to auth.users(id) and drop the legacy public.users table.');
    }
  }

}

// ---------------------------------------------------------------------------
section('10. Cross-schema compatibility checks');
{
  // Identity consistency: which user table do FKs point at?
  // Use pg_catalog, not information_schema — information_schema can omit rows
  // for objects outside the current search_path, which would make this check
  // pass vacuously.
  const fks = (await db.query(`
    select
      conrelid::regclass::text                     as table_name,
      conname                                      as constraint_name,
      (select attname from pg_attribute
        where attrelid = conrelid and attnum = conkey[1])  as column_name,
      confrelid::regclass::text                    as referenced_table
    from pg_constraint
    where contype = 'f'
      and connamespace = 'public'::regnamespace
      and confrelid::regclass::text in ('public.users', 'auth.users')
    order by 1, 3
  `)).rows;

  const toAuthUsers = fks.filter((f) => f.referenced_table === 'auth.users');
  const toPublicUsers = fks.filter((f) => f.referenced_table === 'public.users');

  check('user-id foreign keys are consistent (never split across both)',
    toAuthUsers.length === 0 || toPublicUsers.length === 0,
    toAuthUsers.length && toPublicUsers.length
      ? `SPLIT: ${toPublicUsers.length} → public.users, ${toAuthUsers.length} → auth.users`
      : `${toPublicUsers.length} → public.users, ${toAuthUsers.length} → auth.users`);

  // Non-vacuous: if nothing points at a users table at all, say so loudly.
  check('user-id foreign keys were actually found', fks.length > 0,
    fks.length ? `${fks.length} FK(s)` : 'NONE FOUND — the query is not matching, investigate');

  check('user-id foreign keys target auth.users',
    toPublicUsers.length === 0 && toAuthUsers.length >= 4,
    toAuthUsers.length >= 4
      ? `${toAuthUsers.length} FK(s) → auth.users: ${toAuthUsers.map((f) => `${f.table_name}.${f.column_name}`).join(', ')}`
      : `${toPublicUsers.length} still → public.users: ${toPublicUsers.map((f) => `${f.table_name}.${f.column_name}`).join(', ')}`);

  // Legacy schema compatibility: 0005 must not have broken any legacy table.
  const tables = (await db.query(
    `select table_name from information_schema.tables where table_schema='public' order by table_name`)).rows.map((r) => r.table_name);
  const expectedLegacy = ['users', 'profiles_buyer', 'profiles_supplier', 'products',
    'rfqs_enquiries', 'quotes', 'messages', 'follow_ups', 'user_locations'];
  const missing = expectedLegacy.filter((t) => !tables.includes(t));
  check('all legacy tables still present after every migration', missing.length === 0,
    missing.length ? `missing: ${missing.join(', ')}` : `${tables.length} public tables`);

  // Does 0005 collide with any legacy policy name?
  const dupes = (await db.query(`
    select tablename, policyname, count(*) as n
      from pg_policies
     where schemaname = 'public'
     group by tablename, policyname
    having count(*) > 1`)).rows;
  check('no duplicate policy names in public schema', dupes.length === 0,
    dupes.length ? dupes.map((d) => `${d.tablename}.${d.policyname}`).join(', ') : 'none');

  // media_assets must be reachable by the client's column set.
  const cols = (await db.query(
    `select column_name from information_schema.columns where table_schema='public' and table_name='media_assets'`)).rows.map((r) => r.column_name);
  const needed = ['id', 'owner_id', 'bucket', 'path', 'public_url', 'media_kind', 'visibility',
    'scope', 'entity_type', 'entity_id', 'mime_type', 'byte_size', 'original_name',
    'width', 'height', 'duration_seconds', 'status', 'error_message',
    'replaced_by', 'replaced_at', 'metadata', 'created_at', 'updated_at', 'deleted_at'];
  const absent = needed.filter((c) => !cols.includes(c));
  check('media_assets exposes every column the client reads', absent.length === 0,
    absent.length ? `missing: ${absent.join(', ')}` : `${needed.length} columns verified`);

  // RLS must actually be on for media_assets.
  check('media_assets has RLS enabled', (await scalar(db,
    `select rowsecurity from pg_tables where schemaname='public' and tablename='media_assets'`)).rowsecurity === true);
}
} catch (error) {
  fail('sections 8-10 completed', error.message.split('\n')[0].slice(0, 200));
}

await db.close();

// ---------------------------------------------------------------------------
console.log(`\n${C.bold}Summary${C.reset}`);
console.log(`  passed:  ${C.green}${passed}${C.reset}`);
console.log(`  failed:  ${failed > 0 ? C.red : C.green}${failed}${C.reset}`);
if (failed > 0) {
  console.log(`\n${C.bold}Failures${C.reset}`);
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log(`\n${C.green}SQL migration & storage RLS verification passed.${C.reset}`);
