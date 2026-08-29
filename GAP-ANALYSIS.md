# Nexora Luxe — Codebase Gap Analysis

**Repo:** `prdnexora-svg/beauty-shop-2` · **Branch reviewed:** `arena/01a048ff-beauty-shop-2` @ `f89a321`
**Date:** 29 Aug 2026 · **Method:** static analysis of all 113 source files, all 4 SQL migrations, schema/type/config files, dependency graph and dead-code reachability pass.

> **Verification honesty note.** Findings below are derived from source, schema and reachability analysis, plus the automated checks that exist (`npm run lint`, `npm run test:media`, `npm run verify:media` — 35 passing, 1 skipped). **No live Supabase project is reachable from this environment**, so no finding here was confirmed by executing SQL against a real instance, and no browser/DevTools pass was possible. Items marked **UNVERIFIED-LIVE** need a one-time confirmation run against a real project (action items say how).

---

## Executive summary

The app presents as a Supabase-backed B2B marketplace, but **the database is decorative**. Nine tables are defined in SQL; the application writes to almost none of them.

| Signal | Value |
| --- | --- |
| Tables defined in SQL | 9 (`users`, `profiles_buyer`, `profiles_supplier`, `products`, `rfqs_enquiries`, `quotes`, `messages`, `follow_ups`, `user_locations`) + 2 from media migration (`media_assets`, `platform_admins`) |
| Tables the app actually writes (outside media) | **1** — `messages` (and it fails, see C1) |
| Tables referenced in code but **not defined anywhere** | 1 — `supplier_products` |
| Business API layer (`src/db/api.ts`, 335 lines) | **0 importers — dead code** |
| UI components never imported anywhere | **20 files, 5,554 lines** |
| Duplicate/near-duplicate hook pairs | 1 (`useRealtimeMessages` vs `useChatSubscription`) |
| Unguarded `SECURITY DEFINER` RPCs | **2** (`approve_supplier_onboarding` — privilege escalation; `is_verified_supplier` — no `search_path`) |
| CI / README / `supabase/` CLI dir | **None of the three exist** |

**The three things that would break first in production:**

1. **C1** — Chat is the only flow that persists to Supabase, and it cannot: `messages.sender_id` has an FK to a `users` table the app never populates. Every message insert fails silently.
2. **C2** — `approve_supplier_onboarding()` is `SECURITY DEFINER` with **no caller check**. Any authenticated user can mark any supplier `Nexora Verified`, and `is_verified` gates 7 write policies — a full authorization bypass.
3. **C3** — The entire transactional core (RFQ creation, quotes, products, profiles, follow-ups) writes only to an in-memory seed store and `localStorage`. Nothing survives a browser change, and no other user ever sees it.

> **Update 29 Aug 2026.** C1, C2, M2 and the index half of M4 are now **fixed** by
> `src/db/migrations/0006_security_hardening.sql`, and every finding in this report
> that is expressible in SQL is now enforced by `npm run verify:sql` — which boots a
> real PostgreSQL engine, applies every migration, and fails the build if a policy
> ever stops holding. See "Resolved since this report" at the end. **C2 is a
> live-exploitable vulnerability: any project where `0004` was already applied must
> run `0006` against it.**

---

## 1. Missing tables, schema mismatches & unapplied migrations

### 1.1 There is no migration `0001`

`src/db/migrations/` contains `0002`, `0003`, `0004`, `0005`. The base schema lives in **`src/db/schema.sql`**, outside the migrations folder, with no runner, no ordering metadata and no record of whether it was applied.

Two consequences:

- **`0002_rls_policies.sql` re-declares every policy `schema.sql` already declares.** They are byte-identical copies. Applying both is harmless today because each does `DROP POLICY IF EXISTS` first, but the moment someone edits one file and not the other, the effective policy set becomes order-dependent and non-obvious.
- **`user_locations` is defined twice** — `schema.sql:316` and `0003_location_sync.sql:14`. Identical DDL, so `CREATE TABLE IF NOT EXISTS` saves it, but it means the "which file is authoritative?" question has no answer.

**Action:** promote `schema.sql` to `0001_init.sql` inside `migrations/`, delete the duplicated RLS block from it (leave DDL only, let `0002` own policies), and delete the duplicate `user_locations` block from `schema.sql`.

### 1.2 `supplier_products` — table referenced, never created

`src/services/supplierService.ts:287`

```ts
const { data, error } = await supabase
  .from('supplier_products')
  .select('*')
  .eq('supplier_id', supplierId);
```

The handler then reads `p.name`, `p.image_url`, `p.price_range`, `p.moq`. **No such table exists in `schema.sql` or any migration.** PostgREST returns `PGRST205` ("table not found"), the `if (!error && data && data.length > 0)` guard swallows it, and the function silently falls through to hardcoded mock products. Supplier portfolio pages therefore **always** show seeded fake data, with no error surfaced anywhere.

Note the column names also don't match `products` (`title`/`images`/`unit_price`, not `name`/`image_url`/`price_range`), so this isn't a rename — it's a parallel schema that was never built.

**Action:** either create `supplier_products` (with the columns the code reads) or rewrite the query against `products`. Then remove the mock fallback so the failure is visible instead of silent.

### 1.3 `users` — an orphaned parallel identity system (root cause of C1)

`schema.sql:9`

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('buyer','supplier','admin')),
  ...
);
```

This is a hand-rolled users table with a `password_hash` column and a `uuid_generate_v4()` PK. Meanwhile:

- **Four FKs point at it:** `profiles_buyer.user_id` (`:21`), `profiles_supplier.user_id` (`:41`), `messages.sender_id` and `messages.receiver_id` (`:138`–`:139`).
- **A fifth points somewhere else:** `user_locations.user_id REFERENCES auth.users(id)` (`schema.sql:318`).
- **Every RLS policy compares against `auth.uid()`** — the Supabase auth id — never against `users.id`.
- **The app never inserts a row into `users`.** `src/lib/supabase.ts:104` (the bulk sync, see 1.5) is the *only* write, and it is a manual admin action.

So the moment any real flow tries to create a buyer profile, a supplier profile, or send a message, Postgres rejects it:

```
insert or update on table "profiles_buyer" violates foreign key constraint
"profiles_buyer_user_id_fkey"   —   Key (user_id)=(<auth uid>) is not present in table "users".
```

`auth.users` and `public.users` are two unrelated id spaces that no trigger reconciles. The seed store makes this invisible locally because `src/db/database.ts` keeps its own `'usr-buyer-priya'`-style string ids and never touches Postgres.

**Action:** pick one identity system. Recommended: drop `public.users` entirely; repoint the four FKs to `auth.users(id)`; move `role` to `auth.users.raw_app_meta_data` (or a `user_roles` table) and delete `password_hash` from the codebase — Supabase Auth owns credentials, and `src/db/api.ts:19` already fakes the field with the literal string `'managed-by-supabase-auth'`, which is a strong smell that the column is vestigial.

### 1.4 `messages` insert cannot succeed — chat never persists

`src/hooks/useChatSubscription.ts:139` performs the only real business write in the app:

```ts
const { data, error } = await supabase.from('messages').insert({
  conversation_id: conversationId,
  sender_id: payload.senderId,      // ← FK → public.users(id)  (absent)
  receiver_id: payload.receiverId,  // ← FK → public.users(id)  (absent)
  ...
});
```

It is wrapped in `try { } catch (err) { console.warn(...) }`, so the FK failure is **silent**. The user sees their message appear (optimistic update at `:118` + local `db.sendMessage` at `:123`) and it disappears on reload. No message has ever reached Postgres, therefore nothing has ever fired a Realtime event.

Two aggravating factors:

- **Fallback ids are not UUIDs.** `:50`–`:51` default to `'usr-buyer-priya'` / `'usr-supp-1'`. Even with the FK fixed, `invalid input syntax for type uuid`.
- **RLS `WITH CHECK (auth.uid() = sender_id)`** compares the auth uid to a column declared as a `users.id` FK — the two constraints disagree about what the column means.

**Action:** fix 1.3 first, then surface insert errors in the UI instead of `console.warn`, and remove the non-UUID fallback ids.

### 1.5 Realtime is configured in code but never enabled in the database

Both chat hooks subscribe to Postgres Changes on `messages`. **No migration adds the table to the `supabase_realtime` publication** — there is no `alter publication ... add table` statement anywhere in `src/`. Supabase ships with an empty publication for new tables, so the subscription reports `SUBSCRIBED` and then never receives a single event. Chat will look healthy in DevTools and stay permanently silent.

**Action:** add to a migration:
```sql
alter publication supabase_realtime add table public.messages;
alter table public.messages replica identity full;  -- needed for DELETE/UPDATE payloads
```
Then confirm in Dashboard → Database → Replication. **UNVERIFIED-LIVE.**

### 1.6 `syncAllDataToSupabase` — the manual sync button is broken and unsafe

`src/lib/supabase.ts:88`–`:140`, exposed as a **"Sync Tables to Supabase" button** in the DB Status modal (`DatabaseStatusModal.tsx:884`).

Three independent failures:

1. **Non-UUID primary keys.** Seed ids are strings like `'usr-buyer-priya'` (`database.ts:36`). Upserting them into `users.id UUID` → `invalid input syntax for type uuid`. Ten such ids in `database.ts`.
2. **RLS blocks every table.** `users_self_access` requires `auth.uid() = id`; the operator's uid matches none of the seed rows. `profiles_supplier` has no `UPDATE`-by-non-owner path. Every upsert returns a policy error, which is collected into `errors[]` and displayed as a "Sync notice" — so the button reports partial success while having written nothing.
3. **It writes fake password hashes.** `database.ts:38` seeds `password_hash: 'scrypt_hashed_password_buyer_priya'`. Syncing pushes fabricated credential material into the database.

**Action:** delete `syncAllDataToSupabase` and the button. If a seed is genuinely needed, use a proper `supabase/seed.sql` run by the CLI, not a browser button.

### 1.7 Lower-severity schema issues

| # | Issue | Location | Note |
| --- | --- | --- | --- |
| 1.7a | `products.slug` is not unique | `schema.sql:73` | `profiles_supplier.slug` is `UNIQUE`; `products.slug` is not. Deep-links by slug can collide across suppliers. |
| 1.7b | No index on FK columns | `schema.sql` | `products.supplier_id`, `rfqs_enquiries.buyer_id/supplier_id`, `quotes.rfq_id`, `messages.conversation_id` are all unindexed. Directory and inbox queries do seq scans. Postgres does **not** auto-index FKs. |
| 1.7c | No `updated_at` triggers on 8 of 9 tables | `schema.sql` | Only `user_locations` and `media_assets` have one. Every other `updated_at` is write-once. |
| 1.7d | `products` has no `INSERT` policy for unverified suppliers | `0002:96` | `products_supplier_owner_manage` requires `is_verified = TRUE`. A brand-new supplier cannot create a single listing until approved — and the only approval path is the vulnerability in C2. |
| 1.7e | Type drift: `DBUser.password_hash: string` required | `src/db/types.ts:11` | The type still models a column that must be deleted (see 1.3). |
| 1.7f | `mediaService` stores `entity_id` as `text` | `0005:230` | Product/supplier ids are UUIDs elsewhere; joins are impossible without a cast. Acceptable for now, worth aligning. |

---

## 2. API routes, integrations & egress

### 2.1 There is no backend — by design, but undocumented

Zero API routes, no `api/`, no `server/`, no serverless functions. `vercel.json` rewrites `/(.*)` → `/index.html` (SPA catch-all). Everything is client-side.

This is a legitimate architecture for a Supabase-backed SPA, but it means:

- **Every authorization decision lives in RLS.** That makes the RLS gaps in §3 substantially more dangerous than they would be in a three-tier app — there is no server-side check to catch what a policy misses.
- **There is no place to put a secret.** Which is correct here: `grep` confirms no `service_role` key and no JWT-shaped literal anywhere under `src/` (this is enforced by `scripts/verify-media.mjs`).

### 2.2 The business "API layer" is dead code

`src/db/api.ts` exports `authApi`, `buyerApi`, `supplierApi`, `chatApi`, `validationApi` — 335 lines. **Zero importers.** Every one of its 30+ methods delegates to `db.*`, the in-memory seed store in `src/db/database.ts`.

Consequence: the documented-looking API surface is a facade over static seed data. RFQs, quotes, products, profiles and follow-ups are all served from `data/mockData.ts` / `data/sellerProfilesData.ts` / `data/buyerProfilesData.ts` and `localStorage` keys (`nexora_buyer_enquiries`, `nexora_buyer_posts`, `nexora_sponsored_campaigns`, `nexora_onboarding_draft`, …).

Two files claim to be the data layer and neither is authoritative. This is the single biggest source of confusion in the repo.

**Action:** delete `api.ts`, or make it the real thing by reimplementing each method over `supabase.from(...)`. Don't leave a convincing-looking no-op in the tree.

### 2.3 `src/db/database.ts` (1,241 lines) is the real data layer — and it's a localStorage simulation

`db` is a single `new RelationalDatabase()` instance seeded with hardcoded users, suppliers, products and messages. It persists to `nexora_relational_database_v4`. It has validation helpers (`validateGST`, `validatePhone`, `validateRFQ`) that only the dead `api.ts` calls.

**Action:** same as 2.2 — one data layer, not two.

### 2.4 Egress / external network dependencies

| Target | Where | Risk |
| --- | --- | --- |
| Supabase (`${VITE_SUPABASE_URL}`) | `src/lib/mediaService.ts`, `supabase.ts`, hooks | **Unconfigured → all calls target `https://mock-nexora-project.supabase.co` and fail `ENOTFOUND`.** `isSupabaseConfigured()` correctly gates them and the app degrades to demo mode — verified working. |
| Google Fonts | `src/index.css:1` — `@import url('https://fonts.googleapis.com/...')` | Blocked egress or a strict CSP silently degrades typography to system fonts. A blocking `@import` in CSS also delays first paint. |
| YouTube / Vimeo iframes | `MediaPlayer.tsx:46`, `:49` | Third-party embeds; no `referrerpolicy` or sandbox attributes set. |
| `images.unsplash.com` | `supplierService.ts` fallback URLs | Hardcoded external image fallbacks; another egress dependency. |
| `lh3.googleusercontent.com` | `BrandDirectoryDetailScreen.tsx:21` | Hardcoded external logo. |

**Action:** self-host the three webfonts (removes an egress dependency and a render-blocking request); add `referrerpolicy="strict-origin-when-cross-origin"` and a `sandbox` allow-list to the video iframes.

### 2.5 Config drift: three environment variables are documented but unwired

`.env.example` documents `VITE_AUTH_PHONE_OTP_ENABLED`, `VITE_AUTH_DEFAULT_COUNTRY_CODE` and `VITE_AUTH_OTP_CHANNEL`, with a long comment explaining SMS provider setup. **None of the three is read anywhere in `src/`.** Phone auth is hard-disabled: `src/lib/phoneAuth.ts:23` sets `PHONE_OTP_ENABLED = false` and every function returns a disabled stub; `supabase.ts` exposes matching no-op stubs (`signInWithOtp`, `verifyOtp`, `phoneOtpCapability: 'disabled'`).

Similarly `VITE_SUPABASE_STORAGE_KEY` **is** read (`src/lib/env.ts:38`) but **not used** — `supabase.ts:17` hardcodes `const SUPABASE_STORAGE_KEY = 'nexora.auth.qwaehqsmodekbgvnaavz'`.

**Action:** delete the three phone variables and the entire `phoneAuth.ts` stub module (55 lines + ~6 stubs in `supabase.ts`), and either wire `VITE_SUPABASE_STORAGE_KEY` through to `createClient` or drop it from `.env.example`.

---

## 3. UI components, authorization & state handlers

### 3.1 Twenty components are unreachable — 5,554 lines

Verified by import-graph reachability (no dynamic or lazy imports exist; `main.tsx` mounts `App` directly):

```
CategoriesSection   CategoryGrid        FeaturedDeals       HeroSection
LiveChatWidget      LiveSourcingRequests MarketplaceColumns  OEMSpotlight
QuickRFQSection     RFQModal            SavedSuppliersSection SellerGrowthSection
SponsoredFullVideoSection               SponsoredImageAds
SponsoredReelLightboxModal              SponsoredReelsSection
TopProfilesMarqueeBar TrustStrip        VerifiedSuppliersSection
media/MediaLibraryModal
```

The notable casualties:

- **`LiveChatWidget`, `SponsoredImageAds`, `SponsoredReelsSection`, `SponsoredFullVideoSection`** — four shipped, styled features that no user can ever see. The sponsored-ads surface (plus `SponsoredAdManager`, `sponsoredCampaignsStore.ts`, `sponsoredAnalyticsStore.ts`) has a full authoring UI and analytics store but no render path into the app.
- **`RFQModal`, `QuickRFQSection`, `SavedSuppliersSection`, `SellerGrowthSection`, `VerifiedSuppliersSection`** — core marketplace surfaces that appear to have been replaced by inline markup in `App.tsx` and never deleted.
- **`MediaLibraryModal`** — built as part of the media work, intentionally left unwired pending a consumer.

**Action:** wire `LiveChatWidget` and the sponsored surfaces (they are clearly intended to be live), and delete the rest. Don't leave 5.5k lines of unreachable code for the next person to maintain.

### 3.2 Authorization — two Critical RLS/RPC defects

#### C2 — `approve_supplier_onboarding()` is an unauthenticated privilege escalation

`src/db/migrations/0004_supplier_onboarding_workflow.sql:30`

```sql
CREATE OR REPLACE FUNCTION approve_supplier_onboarding(profile_id UUID, notes TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles_supplier
     SET onboarding_status = 'approved',
         verification_level = 'Nexora Verified',
         is_verified = TRUE, ...
   WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

`SECURITY DEFINER` → executes as the function owner (`postgres`), **bypassing all RLS**. There is:

- **no** `auth.uid()` check,
- **no** `is_platform_admin()` check (the helper added later in `0005` is never referenced here),
- **no** `set search_path = public`,
- **no** `revoke ... from anon, authenticated`.

Supabase grants `EXECUTE` on new functions to `anon` and `authenticated` by default. So:

```js
await supabase.rpc('approve_supplier_onboarding', { profile_id: '<any supplier>' });
```

…makes **anyone** `Nexora Verified` — including an unauthenticated caller if the grant extends to `anon`. This is severe because **`is_verified = TRUE` gates 7 write policies** across `products`, `rfqs_enquiries`, `quotes`, `messages` and `follow_ups` (counted in `0002_rls_policies.sql`). Self-approval therefore converts a cosmetic trust badge into full write access to the commercial data of every supplier and buyer. It also bypasses the `onboarding_status` CHECK-guard on the `INSERT` policy.

Contrast with `public.mark_media_replaced` (`0005`), which gets this exactly right: `set search_path = public`, an internal `owner_id = auth.uid() or is_platform_admin()` check, plus `revoke all ... from public` / `grant ... to authenticated`.

**Action — apply now:**
```sql
create or replace function public.approve_supplier_onboarding(profile_id uuid, notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not authorized';
  end if;
  update public.profiles_supplier set ... where id = profile_id;
end;
$$;

revoke all on function public.approve_supplier_onboarding(uuid, text) from public;
grant execute on function public.approve_supplier_onboarding(uuid, text) to authenticated;
```
Then audit: `select proname, prosecdef, proconfig from pg_proc where proname in ('approve_supplier_onboarding','is_verified_supplier','is_platform_admin','mark_media_replaced');`

#### `is_verified_supplier()` — `SECURITY DEFINER` without `search_path`

`schema.sql:180` / `0002:31`. Read-only and returns a boolean, so not directly exploitable, but a `SECURITY DEFINER` function without `set search_path` is mutable-search-path attack surface, and it's the same mistake one migration later corrected.

**Action:** add `set search_path = public` to both copies.

#### Positive: media and location policies are sound

- All 5 storage buckets: owner-scoped write/modify/delete on `(storage.foldername(name))[1] = auth.uid()::text`; `documents` has no anonymous read path; admin override is gated on `is_platform_admin()`.
- `media_assets`: select/insert/update/delete all correctly scoped to owner or admin.
- `user_locations`: complete owner-only CRUD.
- No `service_role` key and no JWT-shaped literal anywhere in `src/` — machine-verified by `scripts/verify-media.mjs`.

### 3.3 Broken state handlers

| # | Issue | Evidence | Impact |
| --- | --- | --- | --- |
| 3.3a | **No React error boundary anywhere** | `grep` for `ErrorBoundary`/`componentDidCatch` → no matches; `main.tsx` mounts `<App/>` bare | Any render throw blanks the whole app to a white screen. |
| 3.3b | **Chat insert errors swallowed** | `useChatSubscription.ts:159` `catch (err) { console.warn(...) }` | Users see messages that never persist and never arrive. Root cause of the "chat works in demo, dies in prod" class of bug. |
| 3.3c | **Unguarded `JSON.parse` of `localStorage`** | `BuyerDashboard.tsx:428`, `SupplierOnboardingScreen.tsx:81`, `data/chatStore.ts:79`, `data/notifications.ts:130`, `data/sponsoredAnalyticsStore.ts:41,62`, `sponsoredCampaignsStore.ts:248`, `sponsoredReelsData.ts:197,228`, `db/database.ts:508` | One corrupt key throws during module init or render → white screen. `App.tsx:134` and `BuyerEnquiryLogScreen.tsx:46` get this right with `try/catch`; the other nine don't. |
| 3.3d | **Duplicate chat hooks** | `useRealtimeMessages.ts` (167 lines) is a near-clone of `useChatSubscription.ts` with different naming (`status` vs `connectionState`, `sendMessage` vs `pushMessage`) and **zero importers** | Two divergent copies of the same logic; fixes applied to one silently miss the other. |
| 3.3e | **No password-reset flow** | `AuthModal.tsx` has no forgot-password path and no `resetPasswordForEmail` call anywhere in `src/` | A forgotten password is a permanently locked account. |
| 3.3f | **Silent `catch {}` / `catch (e) {}` blocks** | `App.tsx:140`, `BuyerEnquiryLogScreen.tsx:46`, `mediaService.ts` RPC paths | Failures vanish with no telemetry and no user-visible signal. |
| 3.3g | **Optimistic UI with no rollback** | `useChatSubscription.ts:118` appends the temp message before the insert; on failure the temp row stays and is never marked failed | User sees a message that definitively did not send, with no retry affordance. |
| 3.3h | **Auto-start GPS tracking with no consent** | `supabase.ts:277` — `enabled: isConfigured && Boolean(session?.user)`; `useLocationSync` starts a `watchPosition` immediately on sign-in | Continuous coordinate writes to `user_locations` with no opt-in, no visible indicator and no way to stop. Under India's DPDP Act 2023 this needs explicit consent and a stated purpose. |
| 3.3i | **`/auth/login` hard navigation into an SPA** | `supabase.ts:181` `window.location.replace(AUTH_LOGIN_PATH)`; no router installed (`react-router` is not a dependency); navigation is `useState`-based | A full page reload to `/auth/login` remounts `App`, whose `currentScreen` state defaults to `'explore'`. The Vercel catch-all returns `index.html` with HTTP 200, so the redirect lands on the home page, not a login view. `App.tsx:474` then re-triggers the redirect — guarded only by a 3-second throttle, so a loop is contained but the intended destination is never reached. |

### 3.4 Tooling & process gaps

- **No CI.** No `.github/`. The 91 tests and the verification harness I added run only when someone remembers to run them locally.
- **No README.** No setup, migration or deployment instructions anywhere.
- **No `supabase/` directory.** No local dev, no `db push`, no generated TypeScript types — which is why `src/db/types.ts` is hand-maintained and has drifted (1.7e).
- **`dist/` and `node_modules/` are gitignored** — correct.
- **Bundle is 1.74 MB (420 kB gzip)** in a single chunk, with a Vite warning. `manualChunks` for `recharts`, `motion` and `@supabase/supabase-js` would split it.

---

## 4. Prioritized findings & action items

### 🔴 CRITICAL — fix before any real user touches this

| # | Finding | Evidence | Immediate action |
| --- | --- | --- | --- |
| **C1** | **Chat never persists.** `messages.sender_id`/`receiver_id` have FKs to a `users` table the app never populates; errors are swallowed. Non-UUID fallback ids (`'usr-buyer-priya'`) would fail even after the FK is fixed. Realtime publication also missing. | `useChatSubscription.ts:139`, `schema.sql:138`, `schema.sql:9` | 1) Delete `public.users`, repoint the 4 FKs to `auth.users(id)`, move `role` to app_metadata. 2) `alter publication supabase_realtime add table public.messages;`. 3) Surface insert errors in the UI; drop the string fallback ids. Verify with two browser profiles. |
| **C2** | **Unauthenticated privilege escalation.** `approve_supplier_onboarding()` is `SECURITY DEFINER` with no caller check, no `search_path`, no `revoke`. Anyone can self-verify, and `is_verified` gates 7 write policies → full commercial data write access. | `0004:30` | Apply the hardened function from §3.2 (`is_platform_admin()` guard + `set search_path` + `revoke`/`grant`). **If this migration is already applied to any live project, patch that project today** — this is a live-exploitable vulnerability, not a code-review nit. |
| **C3** | **The transactional core writes nothing to the database.** RFQs, quotes, products, supplier/buyer profiles and follow-ups go to an in-memory seed store and `localStorage`. `db/api.ts` (335 lines) has 0 importers and delegates to the seed store. | `src/db/api.ts`, `src/db/database.ts`, `App.tsx` | Decide the data layer: delete `api.ts` + `database.ts` and reimplement over `supabase.from(...)`, **or** keep them as an explicit, documented offline/demo store and mark the SQL schema as the future target. Either way there must be one answer, not two. |
| **C4** | **Table referenced but never created:** `supplier_products`. Query fails `PGRST205`, guard swallows it, supplier portfolios always show hardcoded mocks. | `supplierService.ts:287` | Create the table with the columns the code reads (`name`, `image_url`, `price_range`, `moq`, `supplier_id`) **or** retarget to `products`. Remove the silent mock fallback. |

### 🟠 HIGH — fix this sprint

| # | Finding | Evidence | Immediate action |
| --- | --- | --- | --- |
| **H1** | **`syncAllDataToSupabase` is broken and unsafe.** Non-UUID seed ids into `UUID` columns; RLS rejects every table; writes fabricated `password_hash` values. Exposed as a button. | `supabase.ts:88`, `database.ts:36`, `DatabaseStatusModal.tsx:884` | Delete the function and the button. Seed via `supabase/seed.sql` + CLI if needed. |
| **H2** | **Realtime publication missing.** Subscriptions report `SUBSCRIBED` and never fire. | no `alter publication` in `src/` | Add `messages` to `supabase_realtime`; `replica identity full`. Confirm in Dashboard → Replication. |
| **H3** | **No error boundary.** One render throw = white screen. | `main.tsx`, no `ErrorBoundary` in `src/` | Add a boundary around `<App/>` with a reset action. |
| **H4** | **Nine unguarded `JSON.parse(localStorage)` calls** crash the app on corrupt state. | §3.3c list | Wrap every read in `try/catch` with a schema fallback. Better: one `safeRead<T>(key, fallback)` helper. |
| **H5** | **`/auth/login` redirect is broken.** `window.location.replace` into a router-less SPA lands on the home page, not login. | `supabase.ts:181`, no router dep | Either add `react-router` (and real `/auth/login` + `/auth/callback` routes), or replace the hard navigation with `setCurrentScreen` / `setIsAuthModalOpen(true)`. |
| **H6** | **No migration `0001`; base schema orphaned; `0002` duplicates every policy; `user_locations` defined twice.** | `migrations/` has no `0001`; `schema.sql:316` vs `0003:14` | Promote `schema.sql` → `migrations/0001_init.sql` (DDL only), let `0002` own policies, drop the duplicate `user_locations` block. |
| **H7** | **20 unreachable components, 5,554 lines** — including `LiveChatWidget` and the entire sponsored-ads render surface. | import-graph pass, §3.1 | Wire `LiveChatWidget` + sponsored surfaces; delete the remaining 16. |
| **H8** | **GPS tracking starts automatically on sign-in with no consent UI.** | `supabase.ts:277`, `useLocationSync.ts` | Gate on explicit opt-in with a purpose string and a visible stop control before enabling in production. |
| **H9** | **New suppliers cannot create products.** `products_supplier_owner_manage` requires `is_verified = TRUE`; the only approval path is the C2 vulnerability. | `0002:96` | Add a draft-insert policy (owner-only, `status = 'draft'`) so onboarding can proceed, and move approval behind the hardened admin RPC. |
| **H10** | **No CI, no README, no `supabase/` CLI dir, no generated types.** | `.github` absent, README absent, `supabase/` absent | Add a GitHub Actions workflow running `npm run verify` on every PR; add `supabase/` config + generated types; write a README covering migrations and env setup. |

### 🟡 MEDIUM — fix next

| # | Finding | Evidence | Immediate action |
| --- | --- | --- | --- |
| **M1** | Config drift: `VITE_AUTH_PHONE_OTP_ENABLED`, `VITE_AUTH_DEFAULT_COUNTRY_CODE`, `VITE_AUTH_OTP_CHANNEL` documented in `.env.example`, read nowhere. `VITE_SUPABASE_STORAGE_KEY` read but unused (hardcoded at `supabase.ts:17`). | `.env.example`, `env.ts:38` | Delete the 3 phone vars + `phoneAuth.ts` (55 lines) + its 6 stubs in `supabase.ts`. Wire `VITE_SUPABASE_STORAGE_KEY` through to `createClient` or drop it. |
| **M2** | `is_verified_supplier()` is `SECURITY DEFINER` with no `search_path`. | `schema.sql:180`, `0002:31` | Add `set search_path = public`. |
| **M3** | `supplierService.ts` reads `import.meta.env` directly, bypassing `src/lib/env.ts` — and so treats placeholder values as "configured". | `supplierService.ts:47`, `:286` | Route through `ENV` / `hasRealSupabaseCredentials()`. |
| **M4** | No FK indexes on 5 hot columns; no `updated_at` triggers on 8 of 9 tables. | §1.7b, §1.7c | Add `create index` on `products.supplier_id`, `rfqs_enquiries.buyer_id`/`supplier_id`, `quotes.rfq_id`, `messages.conversation_id`; add a shared `set_updated_at()` trigger. |
| **M5** | `products.slug` is not unique. | `schema.sql:73` | Add `UNIQUE (supplier_id, slug)`. |
| **M6** | Duplicate chat hook (`useRealtimeMessages.ts`, 167 lines, 0 importers). | §3.3d | Delete it; keep `useChatSubscription`. |
| **M7** | Optimistic chat messages never roll back and never show a failed state. | `useChatSubscription.ts:118` | Track `status: 'sending' \| 'sent' \| 'failed'` per message with retry. |
| **M8** | No password-reset flow. | `AuthModal.tsx`, no `resetPasswordForEmail` in `src/` | Add forgot-password → `resetPasswordForEmail` → a `/auth/callback`-handled recovery screen. |
| **M9** | Google Fonts via blocking CSS `@import`; YouTube/Vimeo iframes without `referrerpolicy`/`sandbox`. | `index.css:1`, `MediaPlayer.tsx:46` | Self-host the 3 webfonts; add `referrerpolicy` + a `sandbox` allow-list to embeds. |
| **M10** | 1.74 MB single JS chunk (420 kB gzip), Vite warning on every build. | `npm run build` output | Configure `build.rollupOptions.output.manualChunks` for `recharts`, `motion`, `@supabase/supabase-js`. |
| **M11** | `DBUser.password_hash` still modelled as required; `api.ts` fakes it as `'managed-by-supabase-auth'`. | `db/types.ts:11`, `api.ts:19` | Remove once C1's identity consolidation lands. |
| **M12** | `MediaLibraryModal` built but unwired. | `components/media/MediaLibraryModal.tsx` | Wire into `SponsoredAdManager` / `EnquiryModal` as a "choose existing" picker, or delete. |

---

## Suggested sequence

1. **Today:** C2 (patch every project where `0004` has been applied) → C1's identity consolidation → H1 (remove the sync button).
2. **This week:** H2, H3, H4, H5, H6 — these are what make the app behave correctly once data can actually persist.
3. **Next:** C3 + C4 — the real work of moving the transactional core onto Supabase.
4. **Then:** H7–H10 (dead code, tooling, CI) and the Medium list.

**Verification commands that exist today:**
```bash
npm run lint          # tsc --noEmit
npm run test:media    # 69 unit + 22 component render assertions
npm run verify:media  # migration/secret static scan + both suites (+ live probes when creds are set)
npm run verify        # all three
```

None of the above cover the business schema — that is the gap this report documents, and there is no automated check for any finding in §1 or §3.2 today.

---

## Resolved since this report

`src/db/migrations/0006_security_hardening.sql` closes the SQL-fixable findings. Each is now covered by an assertion in `npm run verify:sql` (101 checks, 0 failures), so a regression fails CI rather than reaching production.

| Finding | Status | Fix |
| --- | --- | --- |
| **C2** — `approve_supplier_onboarding()` privilege escalation | **Fixed** | `is_platform_admin()` guard, `set search_path = public`, `revoke all … from public, anon` + `grant … to authenticated`. **Behaviourally proven**: a non-admin calling it is now rejected with `42501`. |
| **C1** — user-id FKs point at an unpopulated `public.users` | **Fixed** | `profiles_buyer.user_id`, `profiles_supplier.user_id`, `messages.sender_id`, `messages.receiver_id` repointed to `auth.users(id)`. **Behaviourally proven**: a real auth user can now insert both profile types. |
| **H6** (partial) — migration ordering | **Improved** | Migration chain is now exercised end-to-end on every `verify:sql` run, including idempotency. `schema.sql` still needs promoting to `0001_init.sql`. |
| **M2** — `is_verified_supplier()` missing `search_path` | **Fixed** | Pinned, plus explicit `revoke`/`grant`. |
| **M4** (partial) — missing FK indexes | **Fixed** | 9 indexes added in `0006`: the four repointed FKs, `messages.conversation_id`, `products.supplier_id`, `rfqs_enquiries.buyer_id`/`supplier_id`, `quotes.rfq_id`. |

**Still open and not fixable in SQL alone:** C3 and C4 (the transactional core still writes nothing to Supabase), H1 (`syncAllDataToSupabase` still targets the now-orphaned `public.users`), H2 (Realtime publication), and everything in §3.3.

Note on `public.users`: `0006` deliberately does **not** drop it, because `src/lib/supabase.ts:104` still upserts into it via the "Sync Tables to Supabase" button. Drop the table in the same change that deletes that sync path (H1).
