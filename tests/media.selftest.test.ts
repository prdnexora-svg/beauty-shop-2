// ============================================================================
// NEXORA LUXE — STORAGE SELF-TEST (DEMO FALLBACK) EXECUTION TEST
//
// Runs the *real* `runStorageSelfTest()` from src/lib/mediaService.ts against
// a real IndexedDB (fake-indexeddb) and a real in-memory localStorage, and
// asserts the upload -> persist -> retrieve -> delete round trip actually
// works when no Supabase project is configured.
//
// It also asserts the contract that matters most for the Storage & Media panel:
// the self-test must NEVER reject, must never leave a step 'pending', and must
// degrade to skipped/failed steps rather than throwing.
//
// Browser globals stubbed because Node has no DOM: Image (image decode),
// window (event dispatch). Everything else — IndexedDB, Blob, File, object
// URLs, the local ledger — is exercised for real.
//
// Run with: npm run test:selftest
// ============================================================================

import 'fake-indexeddb/auto';

// --- Minimal browser-environment stubs (installed before importing the app) --
const store = new Map<string, string>();
const listeners = new Map<string, Array<(e: any) => void>>();

(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => Array.from(store.keys())[i] ?? null,
  get length() {
    return store.size;
  },
};

(globalThis as any).window = {
  dispatchEvent: (event: any) => {
    (listeners.get(event?.type) || []).forEach((fn) => fn(event));
    return true;
  },
  addEventListener: (type: string, fn: any) => {
    listeners.set(type, [...(listeners.get(type) || []), fn]);
  },
  removeEventListener: (type: string, fn: any) => {
    listeners.set(type, (listeners.get(type) || []).filter((f) => f !== fn));
  },
};

// `Image` exists only in browsers. The stub decodes successfully so the
// self-test's "readable back" check exercises its normal path.
class StubImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 1;
  naturalHeight = 1;
  private _src = '';
  get src() {
    return this._src;
  }
  set src(value: string) {
    this._src = value;
    // Simulate async decode the way a browser does.
    setTimeout(() => this.onload?.(), 0);
  }
}
(globalThis as any).Image = StubImage;

// Imports must come after the stubs above.
const { runStorageSelfTest } = await import('../src/lib/mediaService');
const { isStorageConfigured } = await import('../src/lib/mediaConfig');

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}${detail ? ` \x1b[2m${detail}\x1b[0m` : ''}`);
  } else {
    failed += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` \x1b[2m${detail}\x1b[0m` : ''}`);
  }
}

console.log('\n\x1b[1mStorage self-test — demo fallback execution\x1b[0m');

const configured = isStorageConfigured();
console.log(`  \x1b[2mSupabase configured: ${configured} (this run exercises the ${configured ? 'LIVE' : 'DEMO'} path)\x1b[0m`);

// ---------------------------------------------------------------------------
// 1. The self-test must return a report, never throw.
// ---------------------------------------------------------------------------
const owner = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
let report: Awaited<ReturnType<typeof runStorageSelfTest>> | null = null;
try {
  report = await runStorageSelfTest(owner);
  check('runStorageSelfTest() resolves without throwing', true);
} catch (error: any) {
  check('runStorageSelfTest() resolves without throwing', false, error?.message);
}

if (!report) {
  console.log('\n  passed: \x1b[32m' + passed + '\x1b[0m  failed: \x1b[31m' + failed + '\x1b[0m');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Structural contract of the report.
// ---------------------------------------------------------------------------
check('report contains all 9 steps', report.steps.length === 9, `${report.steps.length} steps`);
check(
  'no step is left "pending"',
  report.steps.every((s) => s.status !== 'pending'),
  report.steps.map((s) => `${s.id}=${s.status}`).join(' '),
);
check(
  'passed + failed counts match the step statuses',
  report.passed === report.steps.filter((s) => s.status === 'passed').length &&
    report.failed === report.steps.filter((s) => s.status === 'failed').length,
  `${report.passed} passed / ${report.failed} failed`,
);

// ---------------------------------------------------------------------------
// 3. Demo round trip: upload -> record -> read -> delete.
// ---------------------------------------------------------------------------
const byId = (id: string) => report!.steps.find((s) => s.id === id);

if (!configured) {
  for (const id of ['upload', 'record', 'read', 'delete']) {
    const step = byId(id);
    check(`demo "${id}" step passed`, step?.status === 'passed', `${step?.status}: ${step?.detail || ''}`);
  }
  // Steps that genuinely require a Supabase project must be honestly skipped,
  // never silently passed — that is the "no fake success" rule.
  for (const id of ['bucket', 'signed', 'rls']) {
    const step = byId(id);
    check(`"${id}" is skipped (not faked) in demo mode`, step?.status === 'skipped', `${step?.status}`);
  }
  check(
    'config step explains demo mode',
    /demo/i.test(byId('config')?.detail || ''),
    byId('config')?.detail || '',
  );
} else {
  console.log('  \x1b[2m• live project detected — asserting the live step set instead\x1b[0m');
  for (const id of ['config', 'auth', 'bucket', 'upload', 'record', 'read', 'delete']) {
    const step = byId(id);
    check(`live "${id}" step passed`, step?.status === 'passed', `${step?.status}: ${step?.detail || ''}`);
  }
}

// ---------------------------------------------------------------------------
// 4. Idempotency: running twice must not corrupt state or leave debris.
// ---------------------------------------------------------------------------
const second = await runStorageSelfTest(owner).catch(() => null);
check('second run also resolves', Boolean(second));
if (second) {
  check(
    'second run reports the same outcome',
    second.passed === report.passed && second.failed === report.failed,
    `${second.passed} passed / ${second.failed} failed`,
  );
  check(
    'second run leaves no pending steps',
    second.steps.every((s) => s.status !== 'pending'),
  );
}

// ---------------------------------------------------------------------------
// 5. Cleanup: the self-test must not leave its probe behind in the local index.
// ---------------------------------------------------------------------------
{
  const raw = (globalThis as any).localStorage.getItem('nexora_media_demo_index');
  const assets = raw ? JSON.parse(raw) : [];
  const leftovers = (assets as any[]).filter((a: any) => a?.metadata?.selfTest === true);
  check('no self-test assets left in the local ledger', leftovers.length === 0, `${leftovers.length} leftover(s)`);
}

// ---------------------------------------------------------------------------
// 6. Resilience: a null owner must still produce a valid report, not a crash.
// ---------------------------------------------------------------------------
{
  const noOwner = await runStorageSelfTest(null).catch(() => null);
  check('runStorageSelfTest(null) resolves', Boolean(noOwner));
  if (noOwner) {
    check(
      'null-owner run has no pending steps',
      noOwner.steps.every((s) => s.status !== 'pending'),
    );
    check(
      'null-owner run does not fake a successful upload',
      byIdIn(noOwner, 'upload') !== 'passed' || configured,
      `upload=${byIdIn(noOwner, 'upload')}`,
    );
  }
}

function byIdIn(rep: { steps: { id: string; status: string }[] }, id: string) {
  return rep.steps.find((s) => s.id === id)?.status;
}

console.log(`\n  passed: \x1b[32m${passed}\x1b[0m  failed: \x1b[31m${failed}\x1b[0m`);
if (failed > 0) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log('\n\x1b[32mStorage self-test verified.\x1b[0m');
