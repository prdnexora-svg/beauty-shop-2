/**
 * QA tests: RFQ Public Form (Screen 10.1) — uploads, previews & INR currency.
 *
 * Covers:
 *   1. INR formatting helper (₹ + Indian digit grouping) and budget math
 *   2. Visual reference upload validation (JPG / PNG / WEBP only, ≤ 10 MB)
 *   3. Attachment file-kind resolution (image vs pdf vs document)
 *   4. Render smoke test: '+ Add Own' picker, ₹ labels, attachment previews
 *
 * Browser globals are stubbed before importing the screen because the Nexora
 * relational DB layer touches localStorage/window at module-evaluation time.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, String(v)),
    removeItem: (k: string) => void storage.delete(k),
    clear: () => storage.clear()
  }
});
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { dispatchEvent: () => {}, addEventListener: () => {}, removeEventListener: () => {} }
});

const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const {
  PostRequirementScreen,
  MAX_UPLOAD_BYTES,
  MAX_VISUAL_REFS,
  PRESET_VISUAL_REFS,
  formatINR,
  formatNumberIN,
  formatBytes,
  resolveFileKind,
  isSupportedImage
} = await import('../components/PostRequirementScreen');

const fakeFile = (name: string, type: string, size = 1024): File =>
  ({ name, type, size } as unknown as File);

/* ------------------------------------------------------------------ */
/* 1. INR currency + budget math                                       */
/* ------------------------------------------------------------------ */

test('formatINR renders Indian grouping with the rupee sign', () => {
  assert.equal(formatINR(250000), '₹ 2,50,000');
  assert.equal(formatINR(1000), '₹ 1,000');
  assert.equal(formatINR(0), '₹ 0');
  assert.ok(formatINR(250000).startsWith('₹'));
  assert.ok(!formatINR(250000).includes('$'));
});

test('formatINR never renders USD-style separators for large budgets', () => {
  assert.equal(formatINR(1250000), '₹ 12,50,000');
  assert.notEqual(formatINR(1250000), '₹ 1,250,000');
});

test('formatNumberIN uses en-IN grouping for quantities', () => {
  assert.equal(formatNumberIN(2500), '2,500');
  assert.equal(formatNumberIN(100000), '1,00,000');
});

test('total budget = quantity × unit price, formatted in INR', () => {
  // Mirrors the auto-calculation inside the component.
  const quantity = 2500;
  const unitPrice = 290;
  assert.equal(formatINR(quantity * unitPrice), '₹ 7,25,000');

  const updated = formatINR(5000 * 290);
  assert.equal(updated, '₹ 14,50,000');

  const priceBump = formatINR(2500 * 350);
  assert.equal(priceBump, '₹ 8,75,000');
});

/* ------------------------------------------------------------------ */
/* 2. Visual reference uploads                                          */
/* ------------------------------------------------------------------ */

test('preset visual references are Dropper, Pump Bottle and Glass Jar', () => {
  assert.deepEqual(
    PRESET_VISUAL_REFS.map((r) => r.label),
    ['Dropper', 'Pump Bottle', 'Glass Jar']
  );
});

test('visual-reference picker accepts JPG / PNG / WEBP only', () => {
  assert.equal(isSupportedImage(fakeFile('a.jpg', 'image/jpeg')), true);
  assert.equal(isSupportedImage(fakeFile('b.png', 'image/png')), true);
  assert.equal(isSupportedImage(fakeFile('c.webp', 'image/webp')), true);
  assert.equal(isSupportedImage(fakeFile('d.pdf', 'application/pdf')), false);
  assert.equal(isSupportedImage(fakeFile('e.docx', 'application/msword')), false);
});

test('uploads are capped at 10 MB and selection at 3 references', () => {
  assert.equal(MAX_UPLOAD_BYTES, 10 * 1024 * 1024);
  assert.equal(MAX_VISUAL_REFS, 3);
});

/* ------------------------------------------------------------------ */
/* 3. Attachment file kinds                                             */
/* ------------------------------------------------------------------ */

test('resolveFileKind distinguishes images, pdfs and other documents', () => {
  assert.equal(resolveFileKind('image/jpeg', 'x.jpg'), 'image');
  assert.equal(resolveFileKind('image/png', 'x.png'), 'image');
  assert.equal(resolveFileKind('application/pdf', 'brief.pdf'), 'pdf');
  assert.equal(resolveFileKind('', 'brief.pdf'), 'pdf');
  assert.equal(resolveFileKind('application/msword', 'spec.doc'), 'document');
});

test('formatBytes produces readable attachment sizes', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(2048), '2 KB');
  assert.equal(formatBytes(2.4 * 1024 * 1024), '2.4 MB');
});

/* ------------------------------------------------------------------ */
/* 4. Render smoke test                                                 */
/* ------------------------------------------------------------------ */

test('RFQ form renders INR labels, Add Own uploader and attachment previews', () => {
  const html = renderToStaticMarkup(
    React.createElement(PostRequirementScreen, {
      onNavigateToExplore: () => {},
      onNavigateToRFQs: () => {}
    })
  );

  // Currency switch — no $ / USD anywhere
  assert.ok(html.includes('Target Unit Price (INR)'), 'unit price label should be INR');
  assert.ok(html.includes('Total Estimated Budget (INR)'), 'budget label should be INR');
  assert.ok(!html.includes('USD'), 'no USD strings should remain');
  assert.ok(html.includes('₹'), 'rupee symbol should render');
  assert.ok(html.includes('Auto-calculated'), 'budget should be auto-calculated by default');
  assert.ok(html.includes(`₹ ${formatNumberIN(2500 * 290)}`), 'budget shows quantity × unit price');

  // Visual references
  assert.ok(html.includes('Add Own'), '+ Add Own card should render');
  assert.ok(
    html.includes('accept="image/jpeg,image/png,image/webp"'),
    'Add Own should open a native image picker'
  );
  assert.ok(html.includes('/ 3 selected'), 'selection counter should render');
  for (const preset of PRESET_VISUAL_REFS) {
    assert.ok(html.includes(preset.label), `${preset.label} preset should render`);
  }

  // Attachments: image thumbnail + document icon, both previewable
  assert.ok(html.includes('reference_bottle_packaging.jpg'), 'seeded image attachment should render');
  assert.ok(html.includes('brand_formulation_brief.pdf'), 'seeded pdf attachment should render');
  assert.ok(html.includes('Preview reference_bottle_packaging.jpg'), 'preview control should render');
  assert.ok(html.includes('Remove brand_formulation_brief.pdf'), 'delete control should render');
  assert.ok(html.includes('Click to upload or drag and drop'), 'dropzone should render');
});
