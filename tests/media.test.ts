// ============================================================================
// NEXORA LUXE — MEDIA SYSTEM TESTS
//
// Runs under plain Node with `npm run test:media` (tsx). No browser, no
// network: these cover the pure logic that gates every upload — MIME/size
// validation, path construction, owner-scoping and URL parsing.
//
// Live Supabase checks are NOT faked here. Run `npm run verify:media` with
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set to exercise real buckets.
// ============================================================================

import {
  MEDIA_BUCKETS,
  MEDIA_SCOPES,
  acceptStringForScope,
  buildObjectPath,
  constraintsHintForScope,
  detectMediaKind,
  extensionOf,
  formatBytes,
  isSelfHostedMediaUrl,
  limitsForScope,
  ownerSegmentOf,
  parseStorageUrl,
  sanitizeFileName,
  sniffFileHeader,
  supabaseStoragePublicUrl,
  validateFileDeep,
  validateFileForScope,
} from '../src/lib/mediaConfig';

// ---------------------------------------------------------------------------
// Tiny assertion harness (keeps the project dependency-free)
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];
let currentSuite = '';

function suite(name: string) {
  currentSuite = name;
  console.log(`\n\x1b[1m${name}\x1b[0m`);
}

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed += 1;
    const message = `${currentSuite} → ${name}${detail ? ` (${detail})` : ''}`;
    failures.push(message);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function eq<T>(name: string, actual: T, expected: T) {
  check(name, actual === expected, `expected ${String(expected)}, got ${String(actual)}`);
}

// ---------------------------------------------------------------------------
// Minimal File stand-in (Node has File in 20+, this keeps it portable)
// ---------------------------------------------------------------------------

class FakeBlob {
  bytes: Uint8Array;
  constructor(parts: Uint8Array[]) {
    const total = parts.reduce((sum, p) => sum + p.length, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      merged.set(part, offset);
      offset += part.length;
    }
    this.bytes = merged;
  }
  slice(start = 0, end?: number): FakeBlob {
    return new FakeBlob([this.bytes.slice(start, end ?? this.bytes.length)]);
  }
  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(this.bytes.slice().buffer as ArrayBuffer);
  }
}

function makeFile(name: string, type: string, size: number, header?: number[]): File {
  // `size` is the exact byte count the File should report.
  const head = header ? new Uint8Array(header) : new Uint8Array(0);
  const clippedHead = size >= head.length ? head : head.slice(0, Math.max(0, size));
  const body = new Uint8Array(Math.max(0, size - clippedHead.length));
  const blob = new FakeBlob([clippedHead, body]);
  const file = {
    name,
    type,
    size: blob.bytes.length,
    slice: (start: number, end?: number) => blob.slice(start, end) as unknown as Blob,
    arrayBuffer: () => blob.arrayBuffer(),
  };
  return file as unknown as File;
}

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0];
const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const MP4_HEADER = [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]; // ...ftyp

// ---------------------------------------------------------------------------
// 1. Bucket registry
// ---------------------------------------------------------------------------

suite('Bucket registry');

check(
  'every bucket declares at least one accepted MIME type',
  Object.values(MEDIA_BUCKETS).every((b) => b.mimeTypes.length > 0),
);
check(
  'every bucket has a positive size limit',
  Object.values(MEDIA_BUCKETS).every((b) => b.maxBytes > 0),
);
eq('5 buckets are defined', Object.keys(MEDIA_BUCKETS).length, 5);
eq('documents bucket is private', MEDIA_BUCKETS.documents.visibility, 'private');
eq('avatars bucket is public', MEDIA_BUCKETS.avatars.visibility, 'public');
eq('videos bucket is public', MEDIA_BUCKETS.videos.visibility, 'public');
check(
  'every scope points at a real bucket',
  Object.values(MEDIA_SCOPES).every((s) => Boolean(MEDIA_BUCKETS[s.bucket])),
);
check(
  'every scope only accepts kinds its bucket allows',
  Object.values(MEDIA_SCOPES).every((s) =>
    s.kinds.every((k) => MEDIA_BUCKETS[s.bucket].kinds.includes(k)),
  ),
);
check(
  'constraint hints render for every scope',
  Object.keys(MEDIA_SCOPES).every((s) =>
    constraintsHintForScope(s as keyof typeof MEDIA_SCOPES).length > 0,
  ),
);
check(
  'accept strings render for every scope',
  Object.keys(MEDIA_SCOPES).every((s) => acceptStringForScope(s as keyof typeof MEDIA_SCOPES).length > 0),
);

// ---------------------------------------------------------------------------
// 2. File validation
// ---------------------------------------------------------------------------

suite('File validation');

const okPng = makeFile('shot.png', 'image/png', 1024, PNG_HEADER);
eq('valid PNG passes image scope', validateFileForScope(okPng, 'avatar').ok, true);

const bigPng = makeFile('huge.png', 'image/png', 6 * 1024 * 1024, PNG_HEADER);
const bigResult = validateFileForScope(bigPng, 'avatar');
check('oversized file rejected', !bigResult.ok && bigResult.error?.code === 'too_large');

const exe = makeFile('virus.exe', 'application/x-msdownload', 2048);
const exeResult = validateFileForScope(exe, 'avatar');
check('executable rejected by MIME', !exeResult.ok && exeResult.error?.code === 'bad_type');

const noType = makeFile('photo.weird', '', 2048, PNG_HEADER);
const noTypeResult = validateFileForScope(noType, 'avatar');
check('unknown extension rejected when MIME is empty', !noTypeResult.ok);

const emptyFile = makeFile('empty.png', 'image/png', 0, PNG_HEADER);
const emptyResult = validateFileForScope(emptyFile, 'avatar');
check('zero-byte file rejected', !emptyResult.ok && emptyResult.error?.code === 'empty_file');

check('missing file rejected', !validateFileForScope(null, 'avatar').ok);
check('undefined file rejected', !validateFileForScope(undefined, 'avatar').ok);

const pdfForAvatar = makeFile('doc.pdf', 'application/pdf', 2048, PDF_HEADER);
const pdfResult = validateFileForScope(pdfForAvatar, 'avatar');
check('PDF rejected for avatar scope', !pdfResult.ok);

const pdfForDoc = makeFile('doc.pdf', 'application/pdf', 2048, PDF_HEADER);
eq('PDF accepted for compliance scope', validateFileForScope(pdfForDoc, 'compliance').ok, true);

const mp4 = makeFile('clip.mp4', 'video/mp4', 5 * 1024 * 1024, MP4_HEADER);
eq('MP4 accepted for video scope', validateFileForScope(mp4, 'video').ok, true);
check('MP4 rejected for ad-creative (image-only) scope', !validateFileForScope(mp4, 'ad-creative').ok);

const hugeVideo = makeFile('clip.mp4', 'video/mp4', 300 * 1024 * 1024, MP4_HEADER);
check('300MB video rejected (200MB cap)', !validateFileForScope(hugeVideo, 'video').ok);

// ---------------------------------------------------------------------------
// 3. Magic-byte sniffing
// ---------------------------------------------------------------------------

async function sniffTests() {
  suite('Content sniffing (magic bytes)');

  const realPng = await sniffFileHeader(makeFile('a.png', 'image/png', 512, PNG_HEADER));
  check('PNG header recognised', realPng.ok && realPng.kind === 'image');

  const realJpeg = await sniffFileHeader(makeFile('a.jpg', 'image/jpeg', 512, JPEG_HEADER));
  check('JPEG header recognised', realJpeg.ok && realJpeg.kind === 'image');

  const realPdf = await sniffFileHeader(makeFile('a.pdf', 'application/pdf', 512, PDF_HEADER));
  check('PDF header recognised', realPdf.ok && realPdf.kind === 'document');

  const realMp4 = await sniffFileHeader(makeFile('a.mp4', 'video/mp4', 512, MP4_HEADER));
  check('MP4 header recognised', realMp4.ok && realMp4.kind === 'video');

  const fake = await sniffFileHeader(makeFile('evil.png', 'image/png', 512, [0x4d, 0x5a]));
  check('renamed executable rejected', !fake.ok);

  // Declared type vs actual content mismatch must be caught by the deep check.
  const mismatched = makeFile('fake.png', 'image/png', 512, PDF_HEADER);
  const deep = await validateFileDeep(mismatched, 'avatar');
  check('declared PNG that is really a PDF is rejected', !deep.ok && deep.error?.code === 'content_mismatch');

  const honest = await validateFileDeep(makeFile('real.png', 'image/png', 512, PNG_HEADER), 'avatar');
  eq('honest PNG passes the deep check', honest.ok, true);
}

// ---------------------------------------------------------------------------
// 4. Path construction & owner scoping
// ---------------------------------------------------------------------------

suite('Object paths & owner scoping');

const OWNER = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

const avatarPath = buildObjectPath({
  ownerId: OWNER,
  scope: 'avatar',
  fileName: 'My Photo.PNG',
  mimeType: 'image/png',
  now: new Date(Date.UTC(2026, 7, 29)),
});

check('path starts with the owner id', avatarPath.startsWith(OWNER), avatarPath);
eq('owner segment is the owner id', ownerSegmentOf(avatarPath), OWNER);
check('path contains the scope', avatarPath.includes('/avatar/'), avatarPath);
check('path includes year/month partition', /\/2026\/08\//.test(avatarPath), avatarPath);
check('file name is sanitised to lowercase', avatarPath.includes('my-photo'), avatarPath);
check('extension preserved', avatarPath.endsWith('.png'), avatarPath);
check('no spaces in path', !avatarPath.includes(' '), avatarPath);

const a = buildObjectPath({ ownerId: OWNER, scope: 'product', fileName: 'x.png' });
const b = buildObjectPath({ ownerId: OWNER, scope: 'product', fileName: 'x.png' });
check('two uploads of the same name do not collide', a !== b, `${a} vs ${b}`);

let threw = false;
try {
  buildObjectPath({ ownerId: '', scope: 'avatar', fileName: 'x.png' });
} catch {
  threw = true;
}
check('empty owner id is rejected', threw);

threw = false;
try {
  buildObjectPath({ ownerId: '../../etc/passwd', scope: 'avatar', fileName: 'x.png' });
} catch {
  threw = true;
}
check('path-traversal owner id is rejected', threw);

threw = false;
try {
  buildObjectPath({ ownerId: `${OWNER}/evil`, scope: 'avatar', fileName: 'x.png' });
} catch {
  threw = true;
}
check('owner id containing a slash is rejected', threw);

eq('sanitizeFileName strips directories', sanitizeFileName('../../evil.png'), 'evil.png');
eq('sanitizeFileName collapses specials', sanitizeFileName('a b@c#.png'), 'a-b-c.png');
eq('extensionOf reads the extension', extensionOf('photo.JPG'), '.jpg');
eq('extensionOf falls back to MIME', extensionOf('photo', 'image/png'), '.png');

// ---------------------------------------------------------------------------
// 5. URL handling
// ---------------------------------------------------------------------------

suite('URL handling');

const BASE = 'https://demo.supabase.co';
const publicUrl = supabaseStoragePublicUrl(BASE, 'avatars', `${OWNER}/avatar/2026/08/x.png`);
eq(
  'public URL shape',
  publicUrl,
  `https://demo.supabase.co/storage/v1/object/public/avatars/${OWNER}/avatar/2026/08/x.png`,
);

const parsed = parseStorageUrl(publicUrl, BASE);
eq('parse public URL bucket', parsed?.bucket, 'avatars');
eq('parse public URL path', parsed?.path, `${OWNER}/avatar/2026/08/x.png`);

eq('parse rejects foreign URLs', parseStorageUrl('https://evil.example.com/x.png', BASE), null);
eq('parse rejects plain paths', parseStorageUrl('/avatars/x.png', BASE), null);
eq('parse handles undefined', parseStorageUrl(undefined, BASE), null);

const encoded = supabaseStoragePublicUrl(BASE, 'avatars', `${OWNER}/avatar/2026/08/my photo.png`);
check('URL encodes spaces', !encoded.includes(' '), encoded);

// isSelfHostedMediaUrl depends on VITE_SUPABASE_URL, which is unset in tests.
eq('self-hosted detection is false without a configured project', isSelfHostedMediaUrl(publicUrl), false);

// ---------------------------------------------------------------------------
// 6. Scope limits
// ---------------------------------------------------------------------------

suite('Scope limits');

eq('avatar max is 5MB', limitsForScope('avatar').maxBytes, 5 * 1024 * 1024);
eq('product max is 10MB', limitsForScope('product').maxBytes, 10 * 1024 * 1024);
eq('video max is 200MB', limitsForScope('video').maxBytes, 200 * 1024 * 1024);
eq('documents max is 25MB', limitsForScope('compliance').maxBytes, 25 * 1024 * 1024);
eq('avatar is single-file', limitsForScope('avatar').maxFiles, 1);
check('product allows multiple files', (limitsForScope('product').maxFiles ?? 1) > 1);
eq('avatar bucket is avatars', limitsForScope('avatar').bucket.id, 'avatars');
eq('compliance bucket is documents', limitsForScope('compliance').bucket.id, 'documents');

// ---------------------------------------------------------------------------
// 7. Helpers
// ---------------------------------------------------------------------------

suite('Helpers');

eq('formatBytes bytes', formatBytes(512), '512 B');
eq('formatBytes KB', formatBytes(2048), '2.0 KB');
eq('formatBytes MB', formatBytes(5 * 1024 * 1024), '5.0 MB');
eq('formatBytes zero', formatBytes(0), '0 B');
eq('formatBytes negative guards', formatBytes(-1), '0 B');

eq('detectMediaKind image', detectMediaKind({ type: 'image/webp' }), 'image');
eq('detectMediaKind video', detectMediaKind({ type: 'video/webm' }), 'video');
eq('detectMediaKind by extension', detectMediaKind({ name: 'doc.pdf' }), 'document');
eq('detectMediaKind unknown', detectMediaKind({ name: 'x.xyz' }), null);

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

(async () => {
  await sniffTests();

  console.log(`\n\x1b[1mSummary\x1b[0m`);
  console.log(`  passed: \x1b[32m${passed}\x1b[0m`);
  console.log(`  failed: \x1b[31m${failed}\x1b[0m`);
  if (failed > 0) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
  console.log('\n\x1b[32mAll media unit tests passed.\x1b[0m');
})();
