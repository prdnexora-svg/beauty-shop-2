-- ============================================================================
-- 0008 - DYNAMIC CATEGORY / SUBCATEGORY TAXONOMY
-- ----------------------------------------------------------------------------
-- Completely dynamic Category & Subcategory taxonomy for the Nexora Luxe RFQ
-- form. The React form fetches these two tables live through
-- `@supabase/supabase-js` and no longer depends on a hard-coded frontend list
-- once Supabase is configured.
--
-- Safe to re-run (CREATE ... IF NOT EXISTS + UPSERT seed rows).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. CATEGORIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  icon_url   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS categories_name_idx      ON public.categories (name);
CREATE INDEX IF NOT EXISTS categories_created_at_idx ON public.categories (created_at);

-- ----------------------------------------------------------------------------
-- 2. SUBCATEGORIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subcategories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One display name per category. `slug` is also unique inside a category so
  -- URL/segment routing can rely on stable identifiers.
  CONSTRAINT subcategories_category_name_unique UNIQUE (category_id, name),
  CONSTRAINT subcategories_category_slug_unique UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS subcategories_category_id_idx    ON public.subcategories (category_id);
CREATE INDEX IF NOT EXISTS subcategories_name_idx           ON public.subcategories (name);
CREATE INDEX IF NOT EXISTS subcategories_created_at_idx     ON public.subcategories (created_at);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- The taxonomy is intentionally read-only for every client. Anyone browsing
-- (anon) or signed in (authenticated) may read it; writes happen through the
-- database admin / dashboard, not through the browser.
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read"
  ON public.categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "subcategories_public_read" ON public.subcategories;
CREATE POLICY "subcategories_public_read"
  ON public.subcategories
  FOR SELECT
  USING (true);

-- Supabase's `anon` and `authenticated` roles need explicit table grants in
-- addition to the RLS policies above.
GRANT SELECT ON public.categories    TO anon, authenticated;
GRANT SELECT ON public.subcategories TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. SEED DATA — STANDARD B2B BEAUTY TAXONOMY
-- ----------------------------------------------------------------------------
-- Use stable, human-readable seed slugs. `created_at` is intentionally set to
-- sequential timestamps so the RFQ form lists categories in the canonical
-- order shown below (Skincare first, then Haircare, Makeup, Personal Care,
-- Ingredients, Packaging, Salon & Spa).
INSERT INTO public.categories (name, slug, created_at)
VALUES
  ('Skincare',                   'skincare',                    TIMESTAMPTZ '2026-01-01 00:06:00+00'),
  ('Haircare & Styling',         'haircare-styling',            TIMESTAMPTZ '2026-01-01 00:06:01+00'),
  ('Color Cosmetics / Makeup',   'color-cosmetics-makeup',      TIMESTAMPTZ '2026-01-01 00:06:02+00'),
  ('Personal Care & Body',       'personal-care-body',          TIMESTAMPTZ '2026-01-01 00:06:03+00'),
  ('Raw Ingredients & Actives',  'raw-ingredients-actives',     TIMESTAMPTZ '2026-01-01 00:06:04+00'),
  ('Packaging & Containers',     'packaging-containers',        TIMESTAMPTZ '2026-01-01 00:06:05+00'),
  ('Salon & Spa Equipment',      'salon-spa-equipment',         TIMESTAMPTZ '2026-01-01 00:06:06+00')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      created_at = EXCLUDED.created_at;

-- Subcategories are inserted from a VALUES list and resolved to their parent
-- category id through `slug`, which keeps the seed readable and idempotent.
INSERT INTO public.subcategories (category_id, name, slug, created_at)
SELECT c.id, seed.name, seed.slug, seed.created_at
FROM (
  VALUES
    -- Skincare
    ('skincare', 'Serums & Treatments',        'serums-treatments',           TIMESTAMPTZ '2026-01-01 00:07:00+00'),
    ('skincare', 'Cleansers & Toners',         'cleansers-toners',            TIMESTAMPTZ '2026-01-01 00:07:01+00'),
    ('skincare', 'Moisturizers & Creams',      'moisturizers-creams',         TIMESTAMPTZ '2026-01-01 00:07:02+00'),
    ('skincare', 'Sunscreen & Sun Care',       'sunscreen-sun-care',          TIMESTAMPTZ '2026-01-01 00:07:03+00'),
    ('skincare', 'Face Masks & Peels',         'face-masks-peels',            TIMESTAMPTZ '2026-01-01 00:07:04+00'),
    ('skincare', 'Eye & Lip Care',             'eye-lip-care',                TIMESTAMPTZ '2026-01-01 00:07:05+00'),

    -- Haircare & Styling
    ('haircare-styling', 'Shampoo & Conditioners', 'shampoo-conditioners',    TIMESTAMPTZ '2026-01-01 00:07:10+00'),
    ('haircare-styling', 'Hair Oils & Serums',     'hair-oils-serums',        TIMESTAMPTZ '2026-01-01 00:07:11+00'),
    ('haircare-styling', 'Scalp Treatments',       'scalp-treatments',        TIMESTAMPTZ '2026-01-01 00:07:12+00'),
    ('haircare-styling', 'Hair Color & Styling',   'hair-color-styling',      TIMESTAMPTZ '2026-01-01 00:07:13+00'),

    -- Color Cosmetics / Makeup
    ('color-cosmetics-makeup', 'Face Makeup',  'face-makeup',                 TIMESTAMPTZ '2026-01-01 00:07:20+00'),
    ('color-cosmetics-makeup', 'Lip Products', 'lip-products',                TIMESTAMPTZ '2026-01-01 00:07:21+00'),
    ('color-cosmetics-makeup', 'Eye Makeup',   'eye-makeup',                  TIMESTAMPTZ '2026-01-01 00:07:22+00'),
    ('color-cosmetics-makeup', 'Nails',        'nails',                       TIMESTAMPTZ '2026-01-01 00:07:23+00'),

    -- Personal Care & Body
    ('personal-care-body', 'Body Washes',     'body-washes',                  TIMESTAMPTZ '2026-01-01 00:07:30+00'),
    ('personal-care-body', 'Body Lotions',    'body-lotions',                 TIMESTAMPTZ '2026-01-01 00:07:31+00'),
    ('personal-care-body', 'Soaps & Scrubs',  'soaps-scrubs',                 TIMESTAMPTZ '2026-01-01 00:07:32+00'),
    ('personal-care-body', 'Intimate Care',   'intimate-care',                TIMESTAMPTZ '2026-01-01 00:07:33+00'),

    -- Raw Ingredients & Actives
    ('raw-ingredients-actives', 'Botanical Extracts',          'botanical-extracts',          TIMESTAMPTZ '2026-01-01 00:07:40+00'),
    ('raw-ingredients-actives', 'Active Chemicals',            'active-chemicals',            TIMESTAMPTZ '2026-01-01 00:07:41+00'),
    ('raw-ingredients-actives', 'Essential Oils',              'essential-oils',              TIMESTAMPTZ '2026-01-01 00:07:42+00'),
    ('raw-ingredients-actives', 'Carrier Oils',                'carrier-oils',                TIMESTAMPTZ '2026-01-01 00:07:43+00'),
    ('raw-ingredients-actives', 'Preservatives & Emulsifiers', 'preservatives-emulsifiers',   TIMESTAMPTZ '2026-01-01 00:07:44+00'),

    -- Packaging & Containers
    ('packaging-containers', 'Bottles & Jars',        'bottles-jars',          TIMESTAMPTZ '2026-01-01 00:07:50+00'),
    ('packaging-containers', 'Droppers & Pumps',      'droppers-pumps',        TIMESTAMPTZ '2026-01-01 00:07:51+00'),
    ('packaging-containers', 'Tubes & Compacts',      'tubes-compacts',        TIMESTAMPTZ '2026-01-01 00:07:52+00'),
    ('packaging-containers', 'Custom Eco Packaging',  'custom-eco-packaging',  TIMESTAMPTZ '2026-01-01 00:07:53+00'),

    -- Salon & Spa Equipment
    ('salon-spa-equipment', 'Facial Machines',  'facial-machines',    TIMESTAMPTZ '2026-01-01 00:08:00+00'),
    ('salon-spa-equipment', 'Styling Chairs',   'styling-chairs',     TIMESTAMPTZ '2026-01-01 00:08:01+00'),
    ('salon-spa-equipment', 'Treatment Tables', 'treatment-tables',   TIMESTAMPTZ '2026-01-01 00:08:02+00'),
    ('salon-spa-equipment', 'Sterilizers',      'sterilizers',        TIMESTAMPTZ '2026-01-01 00:08:03+00')
) AS seed(category_slug, name, slug, created_at)
JOIN public.categories c ON c.slug = seed.category_slug
ON CONFLICT (category_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      created_at = EXCLUDED.created_at;
