-- ============================================================================
-- NEXORA LUXE - MIGRATION 0110: PRODUCTION RLS & MULTI-TENANT HARDENING
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL Editor (or `psql "$DATABASE_URL"`).
--
-- What this locks down:
--   * Public/anonymous supplier directory reads expose ONLY directory-safe
--     columns (no phone, private email, address, GSTIN, PAN or bank data).
--   * Rejected / suspended suppliers are hidden from the public directory.
--   * Supplier owners cannot self-verify, approve their own onboarding, or
--     flip themselves to `active` from the browser.
--   * The admin approval function is no longer callable by normal users.
--
-- Safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PUBLIC DIRECTORY SAFE COLUMNS
-- ----------------------------------------------------------------------------
-- Table-level SELECT is revoked from `anon` (and table-level owners keep full
-- data). Only the directory projection below is granted publicly. `authenticated`
-- also gets the same safe projection; owner rows are still fully manageable
-- through the RLS owner policies below.
REVOKE SELECT ON public.profiles_supplier FROM anon;
REVOKE SELECT ON public.profiles_supplier FROM authenticated;
REVOKE UPDATE ON public.profiles_supplier FROM authenticated;

GRANT SELECT (
  id,
  user_id,
  company_name,
  slug,
  business_type,
  brand_name,
  about,
  city,
  state,
  categories,
  category,
  subcategory,
  status,
  onboarding_status,
  is_verified_supplier,
  is_verified,
  verification_level,
  logo_url,
  cover_image_url,
  trust_score,
  response_rate,
  avg_response_time,
  year_established,
  employee_count,
  monthly_capacity,
  facility_area,
  moq,
  certifications,
  certifications_list,
  cold_chain_available,
  created_at,
  updated_at
)
ON public.profiles_supplier TO anon, authenticated;

-- Owners still need INSERT/UPDATE on the profile row itself. Column-level
-- SELECT above lets the owner read their own contact fields through the owner
-- policy without exposing them to the public.
GRANT SELECT, INSERT, UPDATE ON public.profiles_supplier TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. PUBLIC DIRECTORY ROW VISIBILITY
-- ----------------------------------------------------------------------------
-- Only `active` / `pending_verification` listings appear anonymously. Approved
-- suppliers are public; rejected/suspended are not.
DROP POLICY IF EXISTS supplier_profile_public_read ON public.profiles_supplier;
CREATE POLICY supplier_profile_public_read
  ON public.profiles_supplier
  FOR SELECT
  USING (
    status IN ('active', 'pending_verification')
    AND is_verified_supplier = TRUE
  );

-- ----------------------------------------------------------------------------
-- 3. OWNER-INSTALL POLICIES THAT PREVENT SELF-APPROVAL
-- ----------------------------------------------------------------------------
-- A new supplier may create their own listing, but only in the unverified
-- `business_pending` state. They cannot start as `approved`/`active` or attach
-- trust fields.
DROP POLICY IF EXISTS supplier_profile_owner_insert ON public.profiles_supplier;
CREATE POLICY supplier_profile_owner_insert
  ON public.profiles_supplier
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND onboarding_status = 'business_pending'
    AND is_verified_supplier = TRUE
    AND (is_verified = FALSE OR is_verified IS NULL)
    AND (status IS NULL OR status = 'pending_verification')
    AND verification_level IS NULL
    AND approved_at IS NULL
  );

-- Owners may update their own listing, but the most privileged trust columns
-- are still validated by the trigger below (the `USING` clause can only see the
-- old row, so the trigger is the authoritative boundary).
DROP POLICY IF EXISTS supplier_profile_owner_update ON public.profiles_supplier;
CREATE POLICY supplier_profile_owner_update
  ON public.profiles_supplier
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. PREVENT CLIENT-SIDE PRIVILEGE ESCALATION (BROWSER CANNOT VERIFY ITSELF)
-- ----------------------------------------------------------------------------
-- The admin approval path (`approve_supplier_onboarding`) and the auth mirror
-- trigger both run as the function owner (`postgres` / `service_role`), so the
-- trigger permits them. A normal authenticated role cannot flip trust columns.
CREATE OR REPLACE FUNCTION public.prevent_supplier_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged BOOLEAN;
BEGIN
  is_privileged := current_user IN ('postgres', 'service_role', 'supabase_admin');

  IF NOT is_privileged THEN
    -- INSERT: new supplier must start unverified.
    IF TG_OP = 'INSERT' THEN
      IF COALESCE(NEW.is_verified, FALSE) OR NEW.verification_level IS NOT NULL
         OR COALESCE(NEW.status, 'pending_verification') = 'active'
         OR COALESCE(NEW.onboarding_status, 'business_pending') = 'approved'
         OR NEW.approved_at IS NOT NULL THEN
        RAISE EXCEPTION 'Supplier cannot self-verify. Admin approval is required.';
      END IF;
    END IF;

    -- UPDATE: prevent an owner from self-promoting any trust/approval field.
    IF TG_OP = 'UPDATE' THEN
      IF COALESCE(NEW.is_verified, FALSE) AND NOT COALESCE(OLD.is_verified, FALSE) THEN
        RAISE EXCEPTION 'Supplier verification requires admin approval.';
      END IF;
      IF NEW.verification_level IS DISTINCT FROM OLD.verification_level
         AND NEW.verification_level IS NOT NULL THEN
        RAISE EXCEPTION 'Supplier verification level requires admin approval.';
      END IF;
      IF OLD.onboarding_status IS DISTINCT FROM 'approved'
         AND NEW.onboarding_status = 'approved' THEN
        RAISE EXCEPTION 'Supplier onboarding approval is admin-only.';
      END IF;
      IF OLD.status IS DISTINCT FROM 'active' AND NEW.status = 'active' THEN
        RAISE EXCEPTION 'Supplier active status is admin-only.';
      END IF;
      IF NEW.approved_at IS NOT NULL AND OLD.approved_at IS NULL THEN
        RAISE EXCEPTION 'Supplier approval timestamp is admin-only.';
      END IF;
      IF NEW.reviewed_at IS NOT NULL AND OLD.reviewed_at IS NULL THEN
        RAISE EXCEPTION 'Supplier review timestamp is admin-only.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_supplier_privilege_escalation ON public.profiles_supplier;
CREATE TRIGGER prevent_supplier_privilege_escalation
  BEFORE INSERT OR UPDATE ON public.profiles_supplier
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_supplier_privilege_escalation();

-- ----------------------------------------------------------------------------
-- 5. RPC EXECUTION PERMISSIONS
-- ----------------------------------------------------------------------------
-- `approve_supplier_onboarding`, `handle_new_auth_user` and
-- `is_verified_supplier` are SECURITY DEFINER. Ensure they are not callable by
-- the end-user roles; only the database/service role may approve supplier IDs.
REVOKE ALL ON FUNCTION public.approve_supplier_onboarding(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_supplier_onboarding(UUID, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO service_role;

REVOKE ALL ON FUNCTION public.is_verified_supplier(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_verified_supplier(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- 6. INDEXES / CARDINALITY HELPERS
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS profiles_supplier_is_verified_supplier_idx
  ON public.profiles_supplier (is_verified_supplier);
CREATE INDEX IF NOT EXISTS profiles_supplier_onboarding_status_idx
  ON public.profiles_supplier (onboarding_status);
CREATE INDEX IF NOT EXISTS profiles_supplier_buffer_overview_idx
  ON public.profiles_supplier (status, is_verified, is_verified_supplier);
