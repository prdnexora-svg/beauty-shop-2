import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(import.meta.dirname, '..', '..');

test('seller profile covers the requested beauty industry verticals', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/components/SellerBusinessProfile.tsx'), 'utf8');
  const required = [
    'Hair Salon', 'Barber Shop', 'Unisex Salon', 'Beauty Parlour', 'Nail Studio',
    'Hair Spa', 'Facial & Aesthetic Clinic', 'Makeup Studio', 'Bridal Makeup',
    'Massage Centre', 'Tattoo Studio', 'Salon & Spa Equipment', 'OEM / Private Label',
  ];
  for (const segment of required) {
    assert.ok(source.includes(`'${segment}'`), `${segment} is missing`);
  }
});

test('supplier portal exposes an editable profile and no dead forecast placeholder', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/components/SupplierAdminPortal.tsx'), 'utf8');
  assert.ok(source.includes("setActiveTab('business-profile')"));
  assert.ok(source.includes('<SellerBusinessProfile supplier={activeSupplier}'));
  assert.ok(source.includes("activeSupplier?.company_name"));
  assert.ok(!source.includes('Monthly volume demand chart in progress'));
});

test('business profile saves through the supplier repository', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/components/SellerBusinessProfile.tsx'), 'utf8');
  assert.ok(source.includes('db.upsertSupplierProfile'));
  assert.ok(source.includes('profile_completion_pct: completion'));
  assert.ok(source.includes('categories: form.segments'));
  assert.ok(source.includes('role="alert"'));
  assert.ok(source.includes('role="status"'));
});
