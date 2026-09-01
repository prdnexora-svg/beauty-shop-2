# Buyer & Supplier Auth — Missing Items & Gaps Analysis

Follow-up to the auth audit. The previous pass fixed **bugs in code that exists**.
This document catalogues **functionality that does not exist at all**, plus dead
and contradictory code left behind by the phone/OTP removal.

Status legend: 🔴 blocker · 🟠 significant · 🟡 polish

---

## 1. Account recovery — completely absent 🔴

There is **no password reset anywhere in the codebase**. No
`resetPasswordForEmail` call, no "Forgot password?" link, no
`/auth/reset` route, no update-password screen.

A user who forgets their password is permanently locked out; the only recovery
is a manual reset from the Supabase dashboard. Combined with the fact that the
duplicate-email path now correctly refuses re-registration, this is a dead end.

**Needed:** `supabase.auth.resetPasswordForEmail(email, { redirectTo })`, a link
on the Sign In tab, a `/auth/reset-password` route handling the `type=recovery`
callback, and a set-new-password form calling `supabase.auth.updateUser({ password })`.

## 2. No email-confirmation resend 🟠

`signUpWithEmailPassword` returns `needsEmailConfirmation` and the modal shows
"check your Gmail inbox" — but if that email is lost, spam-filtered, or expires
(Supabase links default to 24h), there is no way to request another.
`supabase.auth.resend({ type: 'signup', email })` is never called.

## 3. Profile rows are never created 🔴

This is the largest structural gap. Registration writes to `auth.users` and
nothing else:

- `public.users` — **never inserted into.** The table, its RLS policy, and the
  `0005` column-type migration all exist, but no code path writes a row. Every
  FK target below is therefore unreachable for a real signup.
- `profiles_buyer` / `profiles_supplier` — **never created at signup.** No
  component references them; only `DatabaseStatusModal` (a schema *viewer*)
  and the local seed store mention them.

Consequences: `authApi.getSession()` looks up `db.getBuyerProfileByUserId(...)`
against the **local seed store**, so a real user always gets `undefined`. Every
`buyer_id` / `supplier_id` FK in `rfqs_enquiries`, `quotes`, and `messages` has
no row to point at. The supplier onboarding workflow in `0004`
(`onboarding_status`, `approve_supplier_onboarding`) can never fire because no
`profiles_supplier` row is ever inserted.

**Needed:** a `SECURITY DEFINER` trigger on `auth.users AFTER INSERT` that
mirrors id/email/role into `public.users` and creates the role-appropriate
profile stub. Doing it client-side is not viable — the `users_self_access`
RLS policy has no INSERT path that runs before the session exists.

## 4. `users` table has no INSERT policy 🟠

`0002_rls_policies.sql` defines `users_self_access FOR ALL USING (auth.uid() = id)`.
`FOR ALL` includes INSERT, and the `WITH CHECK` requires `auth.uid() = id` —
satisfiable only *after* authentication. Signup therefore cannot self-insert.
This reinforces #3: the trigger must be `SECURITY DEFINER` to bypass RLS.

## 5. `authApi` is fully orphaned 🟠

`src/db/api.ts` exports `authApi.login / register / getSession / switchRole / logout`
— a **complete second auth implementation**. Nothing imports it
(`grep -rn "authApi"` outside its own file: zero hits). The live path is
`AuthModal` → `useSupabase()`.

It has diverged badly and will mislead the next developer:

- `register()` **invents a password** when none is supplied:
  `` `Nexora${Date.now()}` `` — an unrecoverable account, guessable within a
  known time window.
- It enforces a **min length of 8**; the live modal enforces 6. No shared constant.
- It passes `business_name` into `user_metadata` — the live path silently drops it.
- It lacks the empty-`identities` duplicate check, so it still has bug #1 from
  the previous audit.
- `switchRole()` lets a **client rewrite its own role** via `updateUser({ data: { role } })`.
  `user_metadata` is user-writable in Supabase; if this were ever wired up, any
  buyer could self-promote to supplier from the browser console.

**Recommendation:** delete it, or reduce it to thin wrappers over the context.

### 5a. Role in `user_metadata` is client-writable 🟠

Even on the live path, role lives in `user_metadata`, which the account owner
can modify. It is fine as a *routing hint* (its current use) but must never
become an authorization boundary. Any RLS policy or portal gate that trusts it
is bypassable. Server-authoritative role belongs in `app_metadata` or
`public.users.role`.

## 6. `SupplierAdminPortal` renders with no role check 🟠

Every other protected screen is gated, but the portal itself is rendered bare:

```tsx
{currentScreen === 'supplier-portal' && <SupplierAdminPortal ... />}
```

`SupplierOnboardingScreen` at least receives `authenticated={isLoggedIn && userRole === 'supplier'}`.
`handleNavigate` guards the *transition*, but nothing guards the *render* — so a
direct state restore, or any future deep link, drops a buyer straight into the
supplier portal UI. Defence in depth is missing at the component boundary.

## 7. Demo mode accepts any credentials 🟠

When Supabase is unconfigured, `handleSubmit` writes a session for **whatever
email and password are typed** — no lookup against `SEED_USERS`, no password
comparison. Sign-in and sign-up are indistinguishable. `password_hash` values in
the seed data (`'scrypt_hashed_password_buyer_priya'`) are decorative strings,
not hashes.

Acceptable for a local preview, dangerous if the mock URL ever ships to a
deployed environment — `isSupabaseConfigured()` fails **open** into this mode.
A build-time assert for production would be prudent.

## 8. Guest mode is written but never read 🟡

`nexora_guest_mode` is set by `handleGuestContinue` and cleared in three places,
but **no code ever reads it**. Guest state is inferred from `isLoggedIn === false`
instead. Either wire it into the `'guest'` role added in `0005`, or drop the key.

## 9. `.env.example` documents a removed feature 🟡

Roughly 30 lines describe `VITE_AUTH_PHONE_OTP_ENABLED`, `VITE_AUTH_OTP_CHANNEL`,
`VITE_AUTH_DEFAULT_COUNTRY_CODE`, Twilio/DLT setup, and SMS provider
troubleshooting. All of it is obsolete — `PHONE_OTP_ENABLED = false` is
hardcoded and none of these variables are read anywhere.

`VITE_SUPABASE_STORAGE_KEY` is also documented but **not read** —
`SUPABASE_STORAGE_KEY` is a hardcoded constant in `src/lib/supabase.ts`.

## 10. `src/lib/phoneAuth.ts` is dead 🟡

55 lines of stubs returning safe defaults. No imports outside itself.
`src/lib/supabase.ts` separately re-exports its own duplicate copies of
`parseAuthIdentifier`, `toE164Phone`, `formatPhoneForDisplay`,
`SUPABASE_OTP_LENGTH`, etc. Two competing dead APIs for the same removed
feature, plus `signInWithOtp` / `verifyOtp` / `phoneOtpCapability` stubs typed
as `any` on the context.

## 11. `phone` is NOT NULL but never collected 🔴

`schema.sql` declares `phone VARCHAR(20) UNIQUE NOT NULL`. The registration
form collects **email and password only**. The moment the trigger from #3 is
added, every insert will fail the NOT NULL constraint.

`phone` must become nullable, or acquire a default, before profile rows can be
created. This directly contradicts the "no mobile number" product decision the
rest of the auth flow was rewritten around.

## 12. `syncAllDataToSupabase` would corrupt `users` 🟠

It upserts `state.users` — seed rows whose ids are `'usr-buyer-priya'`,
`'usr-supp-aura'`. These are **not UUIDs** and will fail the `UUID` column type,
and they do not correspond to any `auth.users` row. If this ever succeeds
against a real project it creates orphaned identity rows. `users` should be
excluded from the sync entirely.

## 13. No auth tests beyond pure helpers 🟡

The 9 tests added in the last pass cover role resolution, the pending-role
handoff, and duplicate detection — all pure functions. There is **no coverage**
of `SupabaseProvider` session lifecycle, the `AuthModal` submit path, the
protected-screen redirect effects, or the role-guard logic in `handleNavigate`.
No test harness for React components exists (no jsdom, no testing-library).

## 14. Smaller items 🟡

- **Password strength**: only `length >= 6`. No complexity rule, no breach
  check, no strength meter, and no shared constant between the two validators.
- **No rate limiting / lockout** client-side; relies entirely on Supabase
  defaults. `rate_limited` is classified but never proactively surfaced.
- **`businessName` collected and discarded** — required by validation, sent
  nowhere (flagged previously; still open).
- **No `aria-live`** on the error/info banners; screen readers miss auth errors.
  No `role="alert"`, no focus management on submit failure.
- **`onSuccess(role, isNewUser)` for OAuth always reports `isNewUser: false`**,
  so a first-time Google supplier skips onboarding and lands in the portal
  with no profile.
- **No account deletion / deactivation** — likely a DPDP Act compliance
  requirement for an India-first B2B marketplace.
- **1.83 MB single JS bundle** (442 kB gzipped) — the auth screen pulls the
  entire app, including Recharts, before a user can log in.

---

## Suggested order

| # | Item | Why first |
|---|------|-----------|
| 1 | `phone` nullable (#11) | Blocks #3; one-line migration |
| 2 | `auth.users` trigger → `public.users` + profile stub (#3, #4) | Unblocks every FK and the supplier onboarding workflow |
| 3 | Password reset (#1) | Users are currently lockable-out with no recovery |
| 4 | Delete or neuter `authApi` (#5) | Removes the invented-password and self-promote hazards |
| 5 | Role-gate `SupplierAdminPortal` (#6) + move role authority server-side (#5a) | Closes the privilege boundary |
| 6 | Resend confirmation (#2) | Completes the signup happy path |
| 7 | Dead-code sweep (#8, #9, #10, #12) | Cheap; prevents future confusion |

Items 1–2 are a single migration and should land together. Nothing in this list
is a regression from the previous fix pass — these are pre-existing gaps.
