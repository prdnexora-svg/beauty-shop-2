-- ============================================================================
-- 0012 - SKINCARE SUBCATEGORY STYLES — 3 display variants
-- ----------------------------------------------------------------------------
-- Expands Skincare subcategories to support:
-- 1. Hindi + English (Easy UI Mix) — bilingual with Hindi in parentheses
-- 2. Pure Short English (Clean B2B Look) — short professional labels (new canonical)
-- 3. Simple Hinglish (Direct & Everyday) — everyday spoken words
--
-- This migration adds the new canonical B2B short names while keeping legacy
-- names for backward compatibility. Frontend maps via skincareSubcategoryStyles.ts
-- ============================================================================

-- Ensure pgcrypto for UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Update / insert new canonical subcategories for Skincare
-- Pure English B2B is now the canonical storage, but we keep legacy aliases

INSERT INTO public.subcategories (category_id, name, slug, created_at)
SELECT c.id, seed.name, seed.slug, seed.created_at
FROM (
  VALUES
    -- New canonical Pure English B2B names (clean look)
    ('skincare', 'Face Serums & Actives',      'face-serums-actives',         TIMESTAMPTZ '2026-01-01 00:07:00+00'),
    ('skincare', 'Daily Cleansers & Wash',     'daily-cleansers-wash',        TIMESTAMPTZ '2026-01-01 00:07:01+00'),
    ('skincare', 'Day & Night Moisturizers',   'day-night-moisturizers',      TIMESTAMPTZ '2026-01-01 00:07:02+00'),
    ('skincare', 'Sun Care & SPF',             'sun-care-spf',                TIMESTAMPTZ '2026-01-01 00:07:03+00'),
    ('skincare', 'Exfoliators & Peels',        'exfoliators-peels',           TIMESTAMPTZ '2026-01-01 00:07:04+00'),
    ('skincare', 'Face Masks & Sheets',        'face-masks-sheets',           TIMESTAMPTZ '2026-01-01 00:07:05+00'),
    ('skincare', 'Eye & Lip Treatments',       'eye-lip-treatments',          TIMESTAMPTZ '2026-01-01 00:07:06+00'),
    ('skincare', 'Body Oils & Toners',         'body-oils-toners',            TIMESTAMPTZ '2026-01-01 00:07:07+00'),
    ('skincare', 'Anti-Aging & Spot Care',     'anti-aging-spot-care',        TIMESTAMPTZ '2026-01-01 00:07:08+00'),

    -- Hindi + English Mix variants (stored as separate searchable names, same slug prefix)
    ('skincare', 'Serums & Treatments (Serums aur Special Care)',              'serums-treatments-hi-en',          TIMESTAMPTZ '2026-01-01 00:07:10+00'),
    ('skincare', 'Cleansers & Toners (Face Wash aur Toners)',                  'cleansers-toners-hi-en',           TIMESTAMPTZ '2026-01-01 00:07:11+00'),
    ('skincare', 'Moisturizers & Creams (Moisturizer aur Night Creams)',        'moisturizers-creams-hi-en',        TIMESTAMPTZ '2026-01-01 00:07:12+00'),
    ('skincare', 'Sunscreen & Sun Care (Sunscreen aur Sun Block)',              'sunscreen-sun-care-hi-en',         TIMESTAMPTZ '2026-01-01 00:07:13+00'),
    ('skincare', 'Face Masks & Peels (Face Pack aur Sheet Masks)',              'face-masks-peels-hi-en',           TIMESTAMPTZ '2026-01-01 00:07:14+00'),
    ('skincare', 'Eye & Lip Care (Under-Eye Cream aur Lip Balm)',               'eye-lip-care-hi-en',               TIMESTAMPTZ '2026-01-01 00:07:15+00'),
    ('skincare', 'Anti-Aging & Spot Care (Jhurriyon aur Daag-Dhabbon ke liye)', 'anti-aging-spot-care-hi-en',       TIMESTAMPTZ '2026-01-01 00:07:16+00'),

    -- Simple Hinglish variants
    ('skincare', 'Face Wash & Cleanser',       'face-wash-cleanser-hinglish',   TIMESTAMPTZ '2026-01-01 00:07:20+00'),
    ('skincare', 'Serum & Drops',              'serum-drops-hinglish',          TIMESTAMPTZ '2026-01-01 00:07:21+00'),
    ('skincare', 'Cream & Gel',                'cream-gel-hinglish',            TIMESTAMPTZ '2026-01-01 00:07:22+00'),
    ('skincare', 'Sunscreen Lotion',           'sunscreen-lotion-hinglish',     TIMESTAMPTZ '2026-01-01 00:07:23+00'),
    ('skincare', 'Face Pack & Scrub',          'face-pack-scrub-hinglish',      TIMESTAMPTZ '2026-01-01 00:07:24+00'),
    ('skincare', 'Lip Care & Eye Cream',       'lip-care-eye-cream-hinglish',   TIMESTAMPTZ '2026-01-01 00:07:25+00')
) AS seed(category_slug, name, slug, created_at)
JOIN public.categories c ON c.slug = seed.category_slug
ON CONFLICT (category_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      created_at = EXCLUDED.created_at;

-- Also ensure legacy names still exist for backward compat (if not already)
INSERT INTO public.subcategories (category_id, name, slug, created_at)
SELECT c.id, seed.name, seed.slug, seed.created_at
FROM (
  VALUES
    ('skincare', 'Serums & Treatments',   'serums-treatments',   TIMESTAMPTZ '2026-01-01 00:07:00+00'),
    ('skincare', 'Cleansers & Toners',    'cleansers-toners',    TIMESTAMPTZ '2026-01-01 00:07:01+00'),
    ('skincare', 'Moisturizers & Creams', 'moisturizers-creams', TIMESTAMPTZ '2026-01-01 00:07:02+00'),
    ('skincare', 'Sunscreen & Sun Care',  'sunscreen-sun-care',  TIMESTAMPTZ '2026-01-01 00:07:03+00'),
    ('skincare', 'Face Masks & Peels',    'face-masks-peels',    TIMESTAMPTZ '2026-01-01 00:07:04+00'),
    ('skincare', 'Eye & Lip Care',        'eye-lip-care',        TIMESTAMPTZ '2026-01-01 00:07:05+00')
) AS seed(category_slug, name, slug, created_at)
JOIN public.categories c ON c.slug = seed.category_slug
ON CONFLICT (category_id, slug) DO NOTHING;
