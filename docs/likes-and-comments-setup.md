# Likes & Comments — Setup Guide

Backend + frontend for likes and comments on the sourcing feed.

| File | Purpose |
|---|---|
| `src/db/migrations/0007_post_likes_and_comments.sql` | Tables, RLS, realtime, author view, batch RPC |
| `src/db/socialApi.ts` | `toggleLike` · `addComment` · `fetchComments` · `fetchLikesCount` |
| `src/hooks/usePostSocial.ts` | State, optimistic updates, realtime subscription |
| `src/components/PostSocialBar.tsx` | Drop-in UI |
| `src/tests/postSocial.test.ts` | 17 tests on the tricky logic |

---

## Two things that differ from the brief

**1. This app is Vite + React, not Next.js.** There is no `app/`, no `pages/`, no API routes, no server components. Everything below is client-side against Supabase, which is how the rest of this codebase already talks to the backend (`src/hooks/useRealtimeMessages.ts`). Nothing here needs a Next.js runtime.

**2. There is no `posts` table.** The schema has 9 tables and none is `posts`. The feed entity is **`rfqs_enquiries`** (public RFQs / sourcing requests), so both new tables reference it:

```sql
post_id UUID NOT NULL REFERENCES public.rfqs_enquiries(id) ON DELETE CASCADE
```

If you add a dedicated `posts` table later, only those two `REFERENCES` clauses change.

Also note `user_id` references **`public.users`**, not `auth.users` — that mirror table is populated by the trigger from migration `0006`, so it must be applied first.

---

## Step 1 — Apply the migration

Supabase Dashboard → **SQL Editor** → paste `0007_post_likes_and_comments.sql` → **Run**.

Or via CLI:

```bash
supabase db push
# or:
psql "$DATABASE_URL" -f src/db/migrations/0007_post_likes_and_comments.sql
```

Prerequisite: migrations `0002` (RLS) and `0006` (auth mirror trigger) must already be applied.

## Step 2 — Confirm Realtime is on

The migration adds both tables to the `supabase_realtime` publication automatically. Verify:

```sql
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND schemaname = 'public';
```

You should see `post_likes` and `post_comments`. If the publication doesn't exist, enable Realtime once in **Database → Replication**, then re-run the migration.

## Step 3 — Verify RLS

```sql
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('post_likes','post_comments') ORDER BY tablename, cmd;
```

Expect 7 policies: public `SELECT` on both, owner-scoped `INSERT`/`DELETE` on both, plus `UPDATE` on comments.

## Step 4 — Use it

```tsx
import { PostSocialBar } from './components/PostSocialBar';
import { useSupabase } from './lib/supabase';

const { user, isConfigured } = useSupabase();

<PostSocialBar
  postId={rfq.id}
  userId={user?.id ?? null}
  enabled={isConfigured}
  onRequireAuth={() => openAuthModal('login')}
/>
```

Or use the hook directly for custom UI:

```tsx
const { likeCount, likedByMe, comments, toggleLike, addComment } =
  usePostSocial({ postId, userId: user?.id, enabled: isConfigured });
```

---

## Design decisions worth knowing

### `REPLICA IDENTITY FULL` is required, not optional

```sql
ALTER TABLE public.post_likes REPLICA IDENTITY FULL;
```

By default Postgres puts **only the primary key** in a DELETE's replication record. An unlike would arrive as `old: { id }` with no `post_id`, so every `filter: post_id=eq.X` subscription would silently drop it — **like counts would go up but never down** until a manual refresh. This one line is the fix, and it is the most common way this feature ships broken.

### `toggleLike` never does read-then-write

The obvious implementation is:

```ts
if (await hasLiked()) await remove(); else await insert();  // ✗ racy
```

Two tabs both read `false`, both insert, one gets a unique violation and shows an error for what the user saw as a successful like. Instead we **attempt the insert first** and treat error `23505` as "already liked → unlike". The `UNIQUE (post_id, user_id)` constraint is the arbiter, not client state.

### Realtime echoes are suppressed

Supabase broadcasts your own writes back to you. Since the UI already applied the change optimistically, the echo would double-count. Each mutation registers a key (`add:${userId}`) that the subscription consumes exactly once.

### Comment authors come from a view

`users` is locked to "your own row only" by RLS (migration `0006`), and display data is split across `profiles_buyer.contact_name` and `profiles_supplier.company_name`. A client join would return nothing for everyone else's comments.

`user_public_profiles` exposes **only** id, display name, company, avatar and role — never email, phone, or credentials. `fetchComments` also falls back to a two-query path if PostgREST can't infer the view relationship.

### N+1 avoidance

`get_post_like_counts(uuid[])` returns counts for a whole feed page in one round trip. `fetchLikeCountsFor()` uses it and degrades to per-post queries if the RPC is absent.

---

## Verification status

Typecheck clean · **144/144 tests pass** (17 new) · build succeeds · all modules load in the dev server.

⚠️ **The SQL has not been executed against a live Postgres** — none is available in this sandbox. It is verified structurally (balanced dollar-quotes and parens, 2 tables, 7 policies) and its logic is mirrored in unit tests. Apply it to a Supabase branch before production.

Not included (say the word and I'll add them): comment threading/replies, `@mentions`, notifications on like/comment, pagination for long comment threads, and moderation/reporting.
