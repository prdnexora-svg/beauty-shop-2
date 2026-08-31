/**
 * UI logic tests for the Ultra-Simple Formulation Preferences.
 * Run with: npm test
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BENEFIT_OPTIONS,
  STRENGTH_OPTIONS,
  QUANTITY_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  FRAGRANCE_OPTIONS,
  DEFAULT_FORMULATION,
  MAX_BENEFITS,
  buildFormulationSummaryLine,
  buildFormulationBrief,
  buildFormulationFacts,
  getBottleCount,
  isFormulationValid,
  toggleBenefit,
} from '../components/formulationPreferences';

/* ---------------------------------------------------------------- */
/* 1. The three-option contracts required by the spec                */
/* ---------------------------------------------------------------- */

test('strength offers exactly Mild | Regular | Extra Strong', () => {
  assert.deepEqual(
    STRENGTH_OPTIONS.map((s) => s.label),
    ['Mild', 'Regular', 'Extra Strong']
  );
});

test('quantity offers exactly 50 | 100 | 250+ bottles', () => {
  assert.deepEqual(
    QUANTITY_OPTIONS.map((q) => q.label),
    ['50 bottles', '100 bottles', '250+ bottles']
  );
  assert.deepEqual(
    QUANTITY_OPTIONS.map((q) => q.bottles),
    [50, 100, 250]
  );
});

test('product type offers exactly Cream | Gel | Serum', () => {
  assert.deepEqual(
    PRODUCT_TYPE_OPTIONS.map((p) => p.label).sort(),
    ['Cream', 'Gel', 'Serum']
  );
});

test('fragrance offers exactly the 3 plain options', () => {
  assert.deepEqual(
    FRAGRANCE_OPTIONS.map((f) => f.label),
    ['No Fragrance', 'Light Natural Floral', 'Fresh Citrus']
  );
});

test('exactly 4 benefit cards with emoji + friendly names', () => {
  assert.equal(BENEFIT_OPTIONS.length, 4);
  assert.deepEqual(
    BENEFIT_OPTIONS.map((b) => `${b.emoji} ${b.label}`),
    [
      '💧 Hydration Boost',
      '✨ Skin Brightening',
      '🛡️ Acne & Pore Control',
      '🌸 Glow & Texture Repair',
    ]
  );
  // each card maps to its hero ingredient for the lab hand-off
  assert.deepEqual(
    BENEFIT_OPTIONS.map((b) => b.technicalName),
    ['Hyaluronic Acid', 'Vitamin C', 'Salicylic Acid', 'Niacinamide']
  );
});

/* ---------------------------------------------------------------- */
/* 2. Live summary sentence                                          */
/* ---------------------------------------------------------------- */

test('summary line matches the required example format', () => {
  const state = {
    ...DEFAULT_FORMULATION,
    benefits: ['brightening', 'hydration'],
    quantity: '100' as const,
    productType: 'Serum' as const,
  };
  assert.equal(
    buildFormulationSummaryLine(state),
    'Your Custom Product: 100 Serum Bottles with Brightening & Hydration'
  );
});

test('summary line handles a single benefit without separators', () => {
  const state = { ...DEFAULT_FORMULATION, benefits: ['acne-control'] };
  assert.equal(
    buildFormulationSummaryLine(state),
    'Your Custom Product: 100 Serum Bottles with Acne Control'
  );
});

test('summary line reflects quantity, type and all four benefits', () => {
  const state = {
    ...DEFAULT_FORMULATION,
    benefits: BENEFIT_OPTIONS.map((b) => b.id),
    quantity: '250+' as const,
    productType: 'Gel' as const,
  };
  assert.equal(
    buildFormulationSummaryLine(state),
    'Your Custom Product: 250+ Gel Bottles with Hydration & Brightening & Acne Control & Glow Repair'
  );
});

/* ---------------------------------------------------------------- */
/* 3. Toggle + validation behaviour                                  */
/* ---------------------------------------------------------------- */

test('toggleBenefit adds and removes benefit cards', () => {
  const start = { ...DEFAULT_FORMULATION, benefits: ['hydration'] };
  const added = toggleBenefit(start, 'glow-repair');
  assert.deepEqual(added.benefits, ['hydration', 'glow-repair']);
  const removed = toggleBenefit(added, 'hydration');
  assert.deepEqual(removed.benefits, ['glow-repair']);
});

test('toggleBenefit ignores unknown ids gracefully', () => {
  const start = { ...DEFAULT_FORMULATION, benefits: ['hydration'] };
  const next = toggleBenefit(start, 'not-a-real-benefit');
  assert.deepEqual(next.benefits, ['hydration', 'not-a-real-benefit'].slice(0, MAX_BENEFITS));
});

test('isFormulationValid requires at least one benefit', () => {
  assert.equal(isFormulationValid({ ...DEFAULT_FORMULATION, benefits: [] }), false);
  assert.equal(isFormulationValid({ ...DEFAULT_FORMULATION, benefits: ['hydration'] }), true);
});

test('getBottleCount maps the friendly quantity to numbers', () => {
  assert.equal(getBottleCount({ ...DEFAULT_FORMULATION, quantity: '50' }), 50);
  assert.equal(getBottleCount({ ...DEFAULT_FORMULATION, quantity: '100' }), 100);
  assert.equal(getBottleCount({ ...DEFAULT_FORMULATION, quantity: '250+' }), 250);
});

/* ---------------------------------------------------------------- */
/* 4. Facts & supplier brief                                         */
/* ---------------------------------------------------------------- */

test('facts checklist contains the four quick batch details', () => {
  const facts = buildFormulationFacts(DEFAULT_FORMULATION);
  assert.deepEqual(
    facts.map((f) => f.label),
    ['Product Type', 'Quantity', 'Strength', 'Fragrance']
  );
  assert.equal(facts[0].value, 'Serum');
  assert.equal(facts[1].value, '100 bottles');
  assert.equal(facts[2].value, 'Regular');
  assert.equal(facts[3].value, 'No Fragrance');
});

test('supplier brief is plain-language but keeps hero ingredients', () => {
  const brief = buildFormulationBrief(DEFAULT_FORMULATION);
  assert.ok(brief.includes('Hydration Boost (Hyaluronic Acid)'));
  assert.ok(brief.includes('Skin Brightening (Vitamin C)'));
  assert.ok(brief.includes('Strength: Regular'));
  assert.ok(brief.includes('Batch: 100 bottles'));
  assert.ok(brief.includes('Product Type: Serum'));
  assert.ok(brief.includes('Fragrance: No Fragrance'));
});

/* ---------------------------------------------------------------- */
/* 5. Zero-technical guard: no raw codes / % / pH / viscosity        */
/*    anywhere in user-facing option strings                         */
/* ---------------------------------------------------------------- */

test('user-facing option labels contain no percentages, pH or viscosity', () => {
  const userFacing: string[] = [
    ...BENEFIT_OPTIONS.flatMap((b) => [b.label, b.blurb]),
    ...STRENGTH_OPTIONS.flatMap((s) => [s.label, s.hint]),
    ...QUANTITY_OPTIONS.flatMap((q) => [q.label, q.hint]),
    ...PRODUCT_TYPE_OPTIONS.flatMap((p) => [p.label, p.hint]),
    ...FRAGRANCE_OPTIONS.flatMap((f) => [f.label, f.hint]),
    buildFormulationSummaryLine(DEFAULT_FORMULATION),
    ...buildFormulationFacts(DEFAULT_FORMULATION).map((f) => f.value),
  ];

  const bannedPatterns: Array<[RegExp, string]> = [
    [/%/, 'a percentage'],
    [/\bpH\b/i, 'a pH level'],
    [/viscosit/i, 'a viscosity metric'],
    [/\bCAS\b/, 'a raw chemical code'],
    [/\d+\s*%/,'a raw percentage'],
  ];

  for (const text of userFacing) {
    for (const [pattern, description] of bannedPatterns) {
      assert.ok(
        !pattern.test(text),
        `Expected "${text}" to not contain ${description}`
      );
    }
  }
});
