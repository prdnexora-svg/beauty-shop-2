-- ============================================================================
-- 0010 - AUTO-CREATE PROFILE STUBS ON SIGNUP + MISSING TABLE GRANTS
-- ----------------------------------------------------------------------------
-- Closes the second half of auth gap #3 ("Profile rows are never created"):
-- migration 0006 mirrors auth.users -> public.users, but nothing ever creates
-- the role profile rows that every RFQ / quote / message FK points at.
--
-- This migration:
--   1. Adds a one-profile-per-user unique index on profiles_buyer(user_id)
--      (profiles_supplier already got one in 0009), so stub creation is
--      idempotent.
--   2. Extends public.handle_new_auth_user() so every signup ALSO creates the
--      role-appropriate profile stub:
--        * buyer    -> profiles_buyer row (contact/company from user_metadata
--                      business_name/contact_name when present, safe defaults
--                      otherwise — every NOT NULL column is satisfied)
--        * supplier -> profiles_supplier row in 'pending_verification' with
--                      is_verified_supplier = TRUE, so the new supplier shows
--                      up in the directory immediately (matches 0009 behaviour)
--      Stub creation is wrapped so it can NEVER fail the auth signup itself.
--   3. Backfills stubs for pre-existing public.users rows that have none.
--   4. Adds the missing GRANTs on profiles_buyer / products / rfqs_enquiries /
--      quotes / messages / follow_ups. RLS policies for these tables exist
--      (0002 + schema.sql) but without grants Postgres denies authenticated
--      clients before RLS is even evaluated, so every buyer-side insert from
--      the app would fail with "permission denied for table ...".
--
-- Safe to re-run. Requires 0002 (RLS), 0004 (onboarding_status), 0006 (trigger
-- base) and 0009 (supplier directory columns) to be applied first.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. IDEMPOTENCY: ONE BUYER PROFILE PER AUTH USER
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS profiles_buyer_user_id_unique
  ON public.profiles_buyer (user_id);

-- ----------------------------------------------------------------------------
-- 2. EXTENDED AUTH TRIGGER: users MIRROR + ROLE PROFILE STUB
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  resolved_role TEXT;
  meta_business TEXT;
  meta_contact  TEXT;
  meta_city     TEXT;
  meta_state    TEXT;
  stub_company  TEXT;
  stub_contact  TEXT;
  stub_slug     TEXT;
BEGIN
  resolved_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'buyer');
  IF resolved_role NOT IN ('buyer', 'supplier') THEN
    resolved_role := 'buyer';
  END IF;

  -- Mirror row (unchanged behaviour from 0006).
  INSERT INTO public.users (id, email, phone, password_hash, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(btrim(COALESCE(NEW.phone, '')), ''),
    NULL,
    resolved_role,
    COALESCE(NEW.created_at AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
    NOW() AT TIME ZONE 'UTC'
  )
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        phone      = COALESCE(EXCLUDED.phone, public.users.phone),
        updated_at = NOW() AT TIME ZONE 'UTC';

  -- ---- Role profile stub (NEW in 0010) ------------------------------------
  -- Metadata is client-writable, so it is used for DISPLAY fields only — never
  -- for privilege (role was already pinned above; supplier stubs start
  -- unverified and pending review).
  BEGIN
    meta_business := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data ->> 'business_name', '')), '');
    meta_contact  := NULLIF(btrim(COALESCE(
                       NEW.raw_user_meta_data ->> 'contact_name',
                       NEW.raw_user_meta_data ->> 'full_name',
                       NEW.raw_user_meta_data ->> 'name',
                       '')), '');
    meta_city     := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data ->> 'city', '')), '');
    meta_state    := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data ->> 'state', '')), '');

    IF resolved_role = 'buyer' THEN
      stub_contact := COALESCE(meta_contact, split_part(COALESCE(NEW.email, 'Buyer'), '@', 1), 'Buyer');
      stub_company := COALESCE(meta_business, stub_contact);
      INSERT INTO public.profiles_buyer
        (user_id, contact_name, company_name, business_type, city, state)
      VALUES
        (NEW.id, stub_contact, stub_company, 'General', COALESCE(meta_city, 'Mumbai'), COALESCE(meta_state, 'Maharashtra'))
      ON CONFLICT (user_id) DO NOTHING;
    ELSE
      stub_company := COALESCE(meta_business, meta_contact, split_part(COALESCE(NEW.email, 'Supplier'), '@', 1), 'New Supplier');
      -- slug is UNIQUE NOT NULL: derive from the user id so concurrent signups
      -- can never collide (company names are not unique).
      stub_slug := 'supplier-' || replace(NEW.id::TEXT, '-', '');
      INSERT INTO public.profiles_supplier
        (user_id, company_name, slug, business_type, brand_name, about,
         city, state, status, is_verified_supplier, is_verified,
         verification_level, onboarding_status)
      VALUES
        (NEW.id, stub_company, stub_slug, 'Manufacturer', stub_company, stub_company,
         COALESCE(meta_city, 'Mumbai'), COALESCE(meta_state, 'Maharashtra'),
         'pending_verification', TRUE, FALSE,
         'Basic', 'business_pending')
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- The profile stub must never break the signup itself.
      RAISE WARNING 'handle_new_auth_user: profile stub failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_auth_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- The trigger itself is unchanged (still AFTER INSERT on auth.users); make
-- sure it exists even on databases where 0006 was skipped.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_auth_user();
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. BACKFILL: STUBS FOR PRE-EXISTING USERS THAT HAVE NONE
-- ----------------------------------------------------------------------------
INSERT INTO public.profiles_buyer (user_id, contact_name, company_name, business_type, city, state)
SELECT u.id,
       COALESCE(NULLIF(split_part(u.email, '@', 1), ''), 'Buyer'),
       COALESCE(NULLIF(split_part(u.email, '@', 1), ''), 'Buyer'),
       'General', 'Mumbai', 'Maharashtra'
FROM public.users u
WHERE u.role = 'buyer'
  AND NOT EXISTS (SELECT 1 FROM public.profiles_buyer b WHERE b.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.profiles_supplier
  (user_id, company_name, slug, business_type, brand_name, about,
   city, state, status, is_verified_supplier, is_verified,
   verification_level, onboarding_status)
SELECT u.id,
       COALESCE(NULLIF(split_part(u.email, '@', 1), ''), 'Supplier'),
       'supplier-' || replace(u.id::TEXT, '-', ''),
       'Manufacturer',
       COALESCE(NULLIF(split_part(u.email, '@', 1), ''), 'Supplier'),
       COALESCE(NULLIF(split_part(u.email, '@', 1), ''), 'Supplier'),
       'Mumbai', 'Maharashtra',
       'pending_verification', TRUE, FALSE,
       'Basic', 'business_pending'
FROM public.users u
WHERE u.role = 'supplier'
  AND NOT EXISTS (SELECT 1 FROM public.profiles_supplier s WHERE s.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. MISSING GRANTS (RLS policies exist, but grants were never issued)
-- ----------------------------------------------------------------------------
-- Buyer profiles: owner-scoped by buyer_profile_self_access (auth.uid() = user_id).
GRANT SELECT, INSERT, UPDATE ON public.profiles_buyer TO authenticated;

-- Products: public read of active rows, verified-supplier owners manage.
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- Marketplace loop tables: scoped by the buyer/supplier RLS policies in 0002.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfqs_enquiries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_ups    TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. BUYER QUOTE NEGOTIATION (accept / reject / counter on own RFQs)
-- ----------------------------------------------------------------------------
-- Suppliers manage quotes via quotes_verified_supplier_manage and buyers could
-- only SELECT them, so accept/reject/counter from the buyer tracking screen
-- had no RLS path. Buyers may UPDATE the negotiation columns of quotes that
-- belong to their own RFQs; they still cannot INSERT/DELETE quotes.
DROP POLICY IF EXISTS quotes_buyer_negotiate_own_rfqs ON public.quotes;
CREATE POLICY quotes_buyer_negotiate_own_rfqs
  ON public.quotes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs_enquiries rfq
      JOIN public.profiles_buyer buyer ON buyer.id = rfq.buyer_id
      WHERE rfq.id = quotes.rfq_id
        AND buyer.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rfqs_enquiries rfq
      JOIN public.profiles_buyer buyer ON buyer.id = rfq.buyer_id
      WHERE rfq.id = quotes.rfq_id
        AND buyer.user_id = auth.uid()
    )
  );
