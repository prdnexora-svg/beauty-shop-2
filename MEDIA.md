# Nexora Luxe — Media System (Storage · Images · Gallery · Video · Permissions)

This is the reference for the media layer: how files are uploaded, where they
live, who can read them, and how to verify the whole thing end to end.

---

## 1. What was there before (audit result)

Before this work the app had **no Supabase Storage integration at all** —
`grep` for `.storage`, `.upload(`, `getPublicUrl()` and `createSignedUrl()`
returned nothing. Every "upload" in the UI was simulated:

| Location | Previous behaviour | Status now |
| --- | --- | --- |
| `BuyerDashboard` post photo | `FileReader` → canvas → **base64 data URL in `localStorage`** | Real upload to `product-media` / `videos` |
| `BuyerDashboard` post video | **None** — only an external URL field | Real MP4/WebM upload + native playback |
| `EditProfileModal` avatar + cover | Base64 data URL | Real upload to `avatars`, old object replaced |
| `SupplierOnboardingScreen` product images | Base64 data URL | Real upload to `product-media` |
| `SupplierVerificationScreen` documents | `URL.createObjectURL`, lost on reload; fake ZIP "extraction" | Real upload to private `documents`, signed-URL preview |
| `EnquiryModal` attachment | Name + size only; RFQ stored a **fabricated URL** `https://storage.nexoraluxe.com/reqs/<name>` | Real upload; real storage URL recorded |
| `PostRequirementScreen` attachments | Two **hardcoded placeholder files** that were never uploaded | Real uploads; no seeded fakes |
| `SupplierProfileScreen` RFQ artwork | `setUploadedFile('custom_formula_brief_v1.pdf')` + hardcoded "100% Uploaded" bar | Real upload with real progress |
| `SupplierProfileScreen` claim proof | `setClaimFormDoc("gst_cert_attachment.pdf")` on click | Real upload |
| `SponsoredAdManager` creative | Base64 data URL, no video upload | Real upload to `ad-creatives` / `videos` |
| `SupplierAdminPortal` certificates | Dead dropzone (no input at all) | Real upload + gallery with preview/replace/delete |
| Product galleries | Plain `<img>`, no error or loading state | `SecureImage` with loading, retry and fallback |

There were **no storage buckets, no storage policies and no media tables** in
any migration (`0002`–`0004` never mention `storage.objects`).

---

## 2. Architecture

```
Component (MediaUploader / MediaGallery / MediaPlayer)
        │
        ▼
hooks/useMediaUpload.ts        progress · cancel · retry · cleanup
hooks/useMediaLibrary.ts       list/filter the ledger
hooks/useMediaOwner.ts         who is uploading (session uid, never hardcoded)
        │
        ▼
lib/mediaService.ts            ← the ONLY module that talks to Storage
   ├─ uploadMedia()   XHR upload (real byte progress) → media_assets row
   ├─ replaceMedia()  upload new → retire old (mark_media_replaced)
   ├─ deleteMedia()   remove object → delete row (flag orphan on failure)
   ├─ createSignedUrl()  cached, auto-refreshing short-lived URLs
   └─ runStorageSelfTest()
        │
        ▼
lib/mediaConfig.ts             buckets · scopes · limits · validation · paths
lib/env.ts                     safe env access (works under Vite and Node)
        │
        ▼
Supabase Storage + storage.objects RLS + public.media_assets
```

**Rule: nothing outside `lib/mediaService.ts` calls `supabase.storage`.**

---

## 3. Buckets

| Bucket | Visibility | Kinds | Max size | Contains |
| --- | --- | --- | --- | --- |
| `avatars` | **public** | image | 5 MB | Profile photos, cover banners |
| `product-media` | **public** | image | 10 MB | Product/catalogue images, post images |
| `ad-creatives` | **public** | image | 10 MB | Sponsored ad banners, video posters |
| `videos` | **public** | video, image | 200 MB | Self-hosted reels, facility tours |
| `documents` | **private** | document, image | 25 MB | GST/ISO proofs, RFQ & enquiry attachments |

Buckets are **public only where the product genuinely requires unauthenticated
reads** (marketplace pages, ad units). Compliance documents and attachments are
private and reachable only through short-lived signed URLs.

### Path convention

```
<bucket>/<auth.uid()>/<scope>/<yyyy>/<mm>/<slug>-<rand>.<ext>
```

The first segment is **always the owner's auth uid** because every write policy
compares against it. `buildObjectPath()` refuses to build a path without a
well-formed owner id.

Scopes: `avatar`, `cover`, `product`, `post`, `ad-creative`, `video`,
`video-poster`, `compliance`, `verification`, `attachment`, `general`.

---

## 4. Permissions model

### Storage (`storage.objects`)

| Policy | Effect |
| --- | --- |
| `public_read_<bucket>` | `SELECT` to `public` for the 4 public buckets |
| `owner_write|modify|delete_<bucket>` | `INSERT`/`UPDATE`/`DELETE` only where `storage.foldername(name)[1] = auth.uid()::text` |
| `owner_read_documents` | `SELECT` on `documents` for the owner only |
| `admin_read_documents` | `SELECT` on `documents` for platform admins |
| `admin_manage_media_objects` | Admin override across all buckets |

There is **no anonymous write path anywhere**. The verification harness proves
this by attempting an unauthenticated upload on every run with credentials set.

### Ledger (`public.media_assets`)

| Operation | Who |
| --- | --- |
| `SELECT` | `visibility = 'public'` **or** `owner_id = auth.uid()` **or** admin |
| `INSERT` | `owner_id = auth.uid()` |
| `UPDATE` / `DELETE` | `owner_id = auth.uid()` **or** admin |

Admin identity comes from `public.is_platform_admin()` (JWT `app_metadata.role`
or the `platform_admins` allow-list) — never from client input.

### Client side

`MediaGallery` only renders Preview/Replace/Delete when
`canManage && (isAdmin || asset.ownerId === ownerId)`.

---

## 5. Setup

### 1. Apply the migration

Supabase Dashboard → **SQL Editor** → paste
`src/db/migrations/0005_media_storage.sql` → **Run**.

It is idempotent (`if not exists`, `on conflict do update`, `drop policy if
exists`), so re-running is safe.

The default admin is seeded as `admin@nexoraluxe.com`. Add more with:

```sql
insert into public.platform_admins (email, note)
values ('ops@nexoraluxe.com', 'Trust & safety')
on conflict (email) do nothing;
```

### 2. Environment

No new variables — the existing two are enough:

```env
VITE_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

**Never** put a `service_role` key in a `VITE_`-prefixed variable: Vite inlines
those into the browser bundle. The verification harness fails the build if a
service-role reference or JWT-shaped literal appears under `src/`.

### 3. Verify

```bash
npm install
npm run verify:media
```

With credentials exported, the same command additionally probes the live
project (table reachable, buckets present, anonymous upload blocked, private
bucket not publicly readable):

```bash
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run verify:media
```

### 4. Verify from inside the app

Open the **DB Inspector** (floating button, bottom-right) → **Storage & Media**:

- bucket inventory with visibility, kinds and size caps,
- **Run storage self-test** — a real round trip: auth → upload → ledger row →
  read back → signed URL → **cross-user RLS probe** → cleanup,
- **List my media** — everything you own, with direct open links.

The self-test cleans up after itself and is safe to run repeatedly.

---

## 6. Validation & error handling

Every file passes three gates before a single byte is sent:

1. **Scope rules** (`validateFileForScope`) — MIME/extension allow-list and
   size cap from `mediaConfig.ts`.
2. **Content sniffing** (`sniffFileHeader`) — magic-byte check that catches a
   renamed `.exe` or a PDF pretending to be a PNG.
3. **Server-side rules** — bucket `allowed_mime_types` + `file_size_limit` from
   the migration. The client rules are for instant feedback; the SQL rules are
   what actually enforce.

Failure handling:

- Upload rejected → object removed and nothing recorded (no orphan bytes).
- Upload OK but ledger insert fails → object removed, error surfaced
  ("Run migration 0005_media_storage.sql").
- Delete fails → row is flagged `orphaned` with the error message rather than
  silently leaving a broken reference.
- Signed URL expires mid-session → `SecureImage`/`MediaPlayer` re-sign once
  before showing the error state.

Uploads use `XMLHttpRequest` (not `fetch`) so progress is real byte-level
progress, with cancel, a 10-minute timeout for large videos on slow mobile
networks, and cleanup of object URLs on unmount.

---

## 7. Demo mode (no Supabase project configured)

The app keeps working, but it stops pretending:

- Uploads run through the same validation, progress and replace/delete flows,
  but blobs are kept in **IndexedDB** and the asset is flagged `isLocal`.
- Every such asset is badged **"Local demo preview — not uploaded to a
  server"** in the uploader, the gallery and the post composer.
- The Storage panel reports **"Local demo mode"** and the live checks are
  skipped rather than faked.
- Nothing anywhere shows a fake "100% Uploaded" bar or a fabricated storage
  URL any more.

---

## 8. Mobile

- `MediaPlayer` sets `playsInline`, uses native controls, honours poster
  images, and never autoplays with sound.
- Upload widgets are full-width touch targets; the file input accepts
  `capture`-friendly MIME lists.
- Reels carousels use `snap-x` scrolling with explicit prev/next buttons.
- Video upload allows up to 200 MB with a generous XHR timeout for Indian
  mobile networks.

---

## 9. Files added / changed

**Added**

```
src/db/migrations/0005_media_storage.sql
src/lib/env.ts
src/lib/mediaConfig.ts
src/lib/mediaService.ts
src/hooks/useMediaOwner.ts
src/hooks/useMediaUpload.ts
src/hooks/useMediaLibrary.ts
src/components/media/MediaUploader.tsx
src/components/media/MediaGallery.tsx
src/components/media/MediaPlayer.tsx
src/components/media/SecureImage.tsx
src/components/media/MediaLibraryModal.tsx
src/components/media/StorageHealthPanel.tsx
tests/media.test.ts
tests/media.render.test.tsx
scripts/verify-media.mjs
MEDIA.md
```

**Changed** — `App.tsx`, `BuyerDashboard`, `EditProfileModal`,
`EnquiryModal`, `PostRequirementScreen`, `SponsoredAdManager`,
`SponsoredReelsSection`, `SponsoredFullVideoSection`,
`SponsoredVideoLightboxModal`, `SponsoredReelLightboxModal`,
`SupplierAdminPortal`, `SupplierOnboardingScreen`,
`SupplierProfileScreen`, `SupplierVerificationScreen`, `ProductDetailPage`,
`DatabaseStatusModal`, `src/types.ts`, `src/lib/supabase.ts`,
`src/data/sponsoredReelsData.ts`, `package.json`.

Two pre-existing TypeScript errors (duplicate `AuthFailureKind` export in
`src/lib/supabase.ts`) were fixed so `npm run lint` now passes cleanly.
