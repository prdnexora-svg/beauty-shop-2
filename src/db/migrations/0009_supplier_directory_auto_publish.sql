-- ============================================================================
-- 0009 - SUPPLIER DIRECTORY AUTO-PUBLISHING & DYNAMIC FILTER SYNC
-- ----------------------------------------------------------------------------
-- Adds directory lifecycle fields to `profiles_supplier` and the RLS insert
-- path used when onboarding publishes a supplier/brand:
--
--   * `status`               - active | pending_verification | rejected | suspended
--   * `is_verified_supplier` - TRUE for every supplier profile (even pending)
--   * `category`             - denormalized primary category for `.eq('category', ...)`
--   * `subcategory`          - denormalized subcategory for subcategory filters
--   * `brand_name` / `about` - public Brand Directory display fields
--
-- Safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DIRECTORY / LISTING COLUMNS ON PROFILES_SUPPLIER
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles_supplier
  ADD COLUMN IF NOT EXISTS status               TEXT NOT NULL DEFAULT 'pending_verification',
  ADD COLUMN IF NOT EXISTS is_verified_supplier BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS category             TEXT,
  ADD COLUMN IF NOT EXISTS subcategory          TEXT,
  ADD COLUMN IF NOT EXISTS brand_name           TEXT,
  ADD COLUMN IF NOT EXISTS about                TEXT;

-- One supplier profile per auth user, so onboarding upserts are idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_supplier_user_id_unique
  ON public.profiles_supplier (user_id);

-- Existing rows: approved/verified become active; everything else pending.
UPDATE public.profiles_supplier
SET status = CASE
      WHEN is_verified = TRUE OR onboarding_status = 'approved' THEN 'active'
      ELSE 'pending_verification'
    END,
    is_verified_supplier = TRUE,
    brand_name = COALESCE(brand_name, company_name),
    about = COALESCE(about, company_name);

-- Populate the primary category from the categories array so server-side
-- `.eq('category', ...)` filters work for legacy seeded rows too.
UPDATE public.profiles_supplier
SET category = CASE
      WHEN categories @> ARRAY['Skincare & Serums']::TEXT[] THEN 'Skincare'
      WHEN categories @> ARRAY['Skincare']::TEXT[] THEN 'Skincare'
      WHEN categories @> ARRAY['OEM / Private Label']::TEXT[] THEN 'Haircare & Styling'
      WHEN categories @> ARRAY['Haircare']::TEXT[] THEN 'Haircare & Styling'
      WHEN categories @> ARRAY['Color Cosmetics']::TEXT[] THEN 'Color Cosmetics / Makeup'
      WHEN categories @> ARRAY['Cosmetics']::TEXT[] THEN 'Color Cosmetics / Makeup'
      WHEN categories @> ARRAY['Personal Care']::TEXT[] THEN 'Personal Care & Body'
      WHEN categories @> ARRAY['Raw Materials']::TEXT[] THEN 'Raw Ingredients & Actives'
      WHEN categories @> ARRAY['Packaging']::TEXT[] THEN 'Packaging & Containers'
      WHEN categories @> ARRAY['Salon Equipment']::TEXT[] THEN 'Salon & Spa Equipment'
      ELSE COALESCE(NULLIF(categories[1], ''), categories[2], '')
    END
WHERE category IS NULL OR category = '';

-- ----------------------------------------------------------------------------
-- 2. RLS: ALLOW OWNER INSERT (onboarding auto-publish, not just admin update)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS supplier_profile_owner_insert ON public.profiles_supplier;
CREATE POLICY supplier_profile_owner_insert
  ON public.profiles_supplier
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. GRANTS
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.profiles_supplier TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles_supplier TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. INDEX FOR FAST DIRECTORY FILTERING
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS profiles_supplier_status_idx   ON public.profiles_supplier (status);
CREATE INDEX IF NOT EXISTS profiles_supplier_category_idx ON public.profiles_supplier (category);
CREATE INDEX IF NOT EXISTS profiles_supplier_city_idx     ON public.profiles_supplier (city);
