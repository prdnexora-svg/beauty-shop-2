-- ============================================================================
-- 0007 - POST LIKES & COMMENTS (social layer on the RFQ / sourcing feed)
-- ----------------------------------------------------------------------------
-- There is no `posts` table in this schema. The feed entity is
-- `rfqs_enquiries` (public RFQs / sourcing requests), so both tables below
-- reference it. If a dedicated `posts` table is introduced later, only the two
-- REFERENCES clauses need to change.
--
-- Author identity resolves through `public.users` (populated by the
-- on_auth_user_created trigger in migration 0006), NOT through auth.users
-- directly, so RLS-safe joins are possible from the client.
--
-- Idempotent and safe to re-run.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. POST_LIKES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.rfqs_enquiries(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One like per user per post. This is what makes toggleLike safe against
  -- double-clicks and concurrent tabs: the second insert is rejected by the
  -- database, not merely by client-side state.
  CONSTRAINT post_likes_post_user_unique UNIQUE (post_id, user_id)
);

-- "How many likes does this post have" and "has this user liked it" are the
-- only two read patterns; the unique constraint already indexes (post_id,
-- user_id) so post_id lookups are covered by its leading column.
CREATE INDEX IF NOT EXISTS post_likes_user_idx ON public.post_likes(user_id);

-- ----------------------------------------------------------------------------
-- 2. POST_COMMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.rfqs_enquiries(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Reject empty/whitespace comments at the database level. A NOT NULL alone
  -- would happily accept ''. Length cap prevents unbounded payloads.
  CONSTRAINT post_comments_content_not_blank
    CHECK (btrim(content) <> '' AND length(content) <= 2000)
);

CREATE INDEX IF NOT EXISTS post_comments_post_created_idx
  ON public.post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS post_comments_user_idx ON public.post_comments(user_id);

-- Keep updated_at honest on edits.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS post_comments_touch_updated_at ON public.post_comments;
CREATE TRIGGER post_comments_touch_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 3. PUBLIC AUTHOR VIEW
-- ----------------------------------------------------------------------------
-- Comments must render an author name + avatar, but `users` is locked down by
-- RLS to "your own row only" (migration 0006) and buyer/supplier display data
-- lives in two different profile tables. This view exposes ONLY the fields
-- safe to show publicly next to a comment — never email, phone or role-
-- sensitive data.
--
-- security_invoker = off (the default for views) means it runs with the
-- definer's rights and is not blocked by the users_self_select policy.
CREATE OR REPLACE VIEW public.user_public_profiles AS
SELECT
  u.id,
  COALESCE(
    NULLIF(btrim(pb.contact_name), ''),
    NULLIF(btrim(ps.company_name), ''),
    'Nexora Member'
  ) AS display_name,
  COALESCE(
    NULLIF(btrim(pb.company_name), ''),
    NULLIF(btrim(ps.company_name), '')
  ) AS company_name,
  ps.logo_url AS avatar_url,
  u.role
FROM public.users u
LEFT JOIN public.profiles_buyer    pb ON pb.user_id = u.id
LEFT JOIN public.profiles_supplier ps ON ps.user_id = u.id;

GRANT SELECT ON public.user_public_profiles TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE public.post_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- --- Likes ---
-- Anyone (including signed-out visitors) may read like counts.
DROP POLICY IF EXISTS post_likes_public_read ON public.post_likes;
CREATE POLICY post_likes_public_read ON public.post_likes
  FOR SELECT
  USING (true);

-- A user may only create a like attributed to themselves. Without the
-- WITH CHECK a client could forge `user_id` and like on someone else's behalf.
DROP POLICY IF EXISTS post_likes_owner_insert ON public.post_likes;
CREATE POLICY post_likes_owner_insert ON public.post_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS post_likes_owner_delete ON public.post_likes;
CREATE POLICY post_likes_owner_delete ON public.post_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- --- Comments ---
DROP POLICY IF EXISTS post_comments_public_read ON public.post_comments;
CREATE POLICY post_comments_public_read ON public.post_comments
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS post_comments_owner_insert ON public.post_comments;
CREATE POLICY post_comments_owner_insert ON public.post_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Editing is restricted to the body: `USING` picks the row, `WITH CHECK`
-- prevents re-assigning it to another user or another post.
DROP POLICY IF EXISTS post_comments_owner_update ON public.post_comments;
CREATE POLICY post_comments_owner_update ON public.post_comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS post_comments_owner_delete ON public.post_comments;
CREATE POLICY post_comments_owner_delete ON public.post_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. REALTIME
-- ----------------------------------------------------------------------------
-- REPLICA IDENTITY FULL is REQUIRED, not optional. By default Postgres only
-- puts the primary key in a DELETE's replication record, so an unlike event
-- would arrive as `old: { id }` with no post_id — and every client-side
-- `filter: post_id=eq.X` subscription would silently drop it. The like count
-- would then only go up, never down, until a manual refresh.
ALTER TABLE public.post_likes    REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;

-- Add both tables to the realtime publication (guarded: re-adding raises).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'post_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'post_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    RAISE WARNING 'supabase_realtime publication not found; enable Realtime in the Supabase dashboard.';
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. AGGREGATE HELPER
-- ----------------------------------------------------------------------------
-- Counting likes for a feed of N posts via N HEAD requests is an N+1. This
-- returns every count in one round trip.
CREATE OR REPLACE FUNCTION public.get_post_like_counts(post_ids UUID[])
RETURNS TABLE (post_id UUID, like_count BIGINT, liked_by_me BOOLEAN)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    p.id AS post_id,
    COUNT(l.id) AS like_count,
    BOOL_OR(l.user_id = auth.uid()) IS TRUE AS liked_by_me
  FROM unnest(post_ids) AS p(id)
  LEFT JOIN public.post_likes l ON l.post_id = p.id
  GROUP BY p.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_post_like_counts(UUID[]) TO anon, authenticated;
