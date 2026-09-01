-- ============================================================================
-- 0006 - NULLABLE PHONE + AUTOMATIC public.users ROW CREATION
-- ----------------------------------------------------------------------------
-- Resolves the two schema blockers in docs/auth-gap-analysis.md (#11 and #3):
--
--   #11 `phone` was VARCHAR(20) UNIQUE NOT NULL, but the registration form
--       collects only email + password. Any insert would fail immediately.
--
--   #3  Signup wrote to auth.users and stopped. public.users was never
--       populated, so every buyer_id / supplier_id foreign key pointed at a
--       row that did not exist.
--
-- Idempotent and safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PHONE BECOMES OPTIONAL
-- ----------------------------------------------------------------------------
-- Email + password is the only supported credential pair; phone is now a
-- profile detail that may be supplied later (or never).
ALTER TABLE public.users
  ALTER COLUMN phone DROP NOT NULL;

-- Normalise historic empty strings to NULL so the UNIQUE index does not treat
-- '' as a real value shared by every phone-less account.
UPDATE public.users
SET phone = NULL
WHERE phone IS NOT NULL AND btrim(phone) = '';

-- A plain UNIQUE constraint already permits multiple NULLs in Postgres, so no
-- partial index is required — but the constraint must not be dropped, or
-- duplicate real numbers would become possible.

-- ----------------------------------------------------------------------------
-- 2. PASSWORD_HASH BECOMES OPTIONAL
-- ----------------------------------------------------------------------------
-- Credentials live exclusively in auth.users, managed and hashed (bcrypt) by
-- GoTrue. public.users is a mirror/profile table and must never hold a
-- credential. The column is kept for schema compatibility but is no longer
-- required, so the trigger below is not forced to invent a fake value.
ALTER TABLE public.users
  ALTER COLUMN password_hash DROP NOT NULL;

COMMENT ON COLUMN public.users.password_hash IS
  'Deprecated. Credentials are owned by auth.users (GoTrue/bcrypt). Always NULL for trigger-created rows.';

COMMENT ON COLUMN public.users.phone IS
  'Optional E.164 mobile number. NULL for email/password and OAuth signups.';

-- ----------------------------------------------------------------------------
-- 3. AUTH -> PUBLIC MIRROR TRIGGER
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER is mandatory here. The `users_self_access` RLS policy from
-- migration 0002 requires `auth.uid() = id`, which is not yet satisfied at the
-- moment the auth row is created, so a client-side or INVOKER-rights insert
-- can never succeed. Running as the function owner bypasses RLS for this one
-- controlled write.
--
-- search_path is pinned to defeat search_path-hijacking against a
-- SECURITY DEFINER function.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  resolved_role TEXT;
BEGIN
  -- Role is chosen in the signup UI and arrives in raw_user_meta_data. It is
  -- client-writable, so it is treated as a hint only and validated against the
  -- same enum the CHECK constraint enforces. Anything unexpected (including
  -- an attempt to self-assign 'admin') falls back to 'buyer'.
  resolved_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'buyer');
  IF resolved_role NOT IN ('buyer', 'supplier') THEN
    resolved_role := 'buyer';
  END IF;

  INSERT INTO public.users (id, email, phone, password_hash, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(btrim(COALESCE(NEW.phone, '')), ''),
    NULL,                       -- never mirror credentials
    resolved_role,
    COALESCE(NEW.created_at AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
    NOW() AT TIME ZONE 'UTC'
  )
  -- Re-running signup for an existing id (or a replayed confirmation) must not
  -- abort the auth transaction; refresh the mirrored contact fields instead.
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        phone      = COALESCE(EXCLUDED.phone, public.users.phone),
        updated_at = NOW() AT TIME ZONE 'UTC';

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- A failure here must never block account creation. Losing the mirror row
    -- is recoverable (see the backfill below); losing the signup is not.
    RAISE WARNING 'handle_new_auth_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- 4. KEEP THE MIRROR FRESH
-- ----------------------------------------------------------------------------
-- Email changes, phone additions and role updates made through GoTrue must
-- propagate, otherwise public.users drifts out of sync after the first write.
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  resolved_role TEXT;
BEGIN
  resolved_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'buyer');
  IF resolved_role NOT IN ('buyer', 'supplier') THEN
    resolved_role := 'buyer';
  END IF;

  UPDATE public.users
  SET email      = COALESCE(NEW.email, email),
      phone      = COALESCE(NULLIF(btrim(COALESCE(NEW.phone, '')), ''), phone),
      -- Never demote an admin from client-supplied metadata.
      role       = CASE WHEN role = 'admin' THEN role ELSE resolved_role END,
      updated_at = NOW() AT TIME ZONE 'UTC'
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_auth_user_updated failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email, phone, raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_updated();

-- ----------------------------------------------------------------------------
-- 5. BACKFILL EXISTING AUTH USERS
-- ----------------------------------------------------------------------------
-- Accounts registered before this migration have no mirror row. Create them so
-- the FK targets resolve for users who already signed up.
INSERT INTO public.users (id, email, phone, password_hash, role, created_at, updated_at)
SELECT
  au.id,
  COALESCE(au.email, ''),
  NULLIF(btrim(COALESCE(au.phone, '')), ''),
  NULL,
  CASE
    WHEN COALESCE(au.raw_user_meta_data ->> 'role', 'buyer') IN ('buyer', 'supplier')
      THEN au.raw_user_meta_data ->> 'role'
    ELSE 'buyer'
  END,
  COALESCE(au.created_at AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
  NOW() AT TIME ZONE 'UTC'
FROM auth.users au
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. REFERENTIAL INTEGRITY
-- ----------------------------------------------------------------------------
-- The mirror is only meaningful if it cannot outlive its auth row. Deleting an
-- account in GoTrue now cascades through public.users and every dependent
-- profile / RFQ / quote row.
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- 7. RLS: ALLOW A USER TO READ ITS OWN MIRROR ROW
-- ----------------------------------------------------------------------------
-- 0002 created `users_self_access FOR ALL`, whose WITH CHECK blocks the insert
-- path entirely. Inserts are now the trigger's job (SECURITY DEFINER, bypasses
-- RLS), so the client-facing policies are narrowed to select/update and the
-- role column is protected from client-side privilege escalation.
DROP POLICY IF EXISTS users_self_access ON public.users;

DROP POLICY IF EXISTS users_self_select ON public.users;
CREATE POLICY users_self_select ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Reading the current role must not re-enter the policies on public.users, or
-- Postgres raises "infinite recursion detected in policy". A SECURITY DEFINER
-- helper reads the row with RLS bypassed, which keeps the check terminating.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS users_self_update ON public.users;
CREATE POLICY users_self_update ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Role changes must go through an admin/service-role path, never a
    -- self-service UPDATE from the browser.
    AND role = public.current_user_role()
  );
