-- ============================================================================
-- NEXORA LUXE — PHASE 5: MEDIA / STORAGE FOUNDATION
-- Supabase Storage buckets, storage RLS policies, media_assets ledger,
-- admin helper functions.
--
-- DESIGN PRINCIPLES
--   1. IDEMPOTENT — safe to run repeatedly (`if not exists` / `on conflict`).
--   2. LEAST PRIVILEGE — public buckets are read-only to anonymous users;
--      every write is scoped to the owner's own folder (<uid>/...).
--   3. NO SERVICE-ROLE IN SQL — nothing here needs it, and nothing here
--      grants blanket access. bucket/object RLS IS the authorization boundary.
--   4. PRIVATE BY DEFAULT — compliance documents, verification proofs and
--      RFQ attachments live in a private bucket and are only reachable via
--      short-lived signed URLs.
--
-- HOW TO APPLY
--   Supabase Dashboard -> SQL Editor -> paste this file -> Run
--   (or `supabase db execute --file src/db/migrations/0005_media_storage.sql`)
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 0. ADMIN HELPER
--    There is no `admin` role in this app's auth.users, and the legacy
--    `public.users` table is not linked to auth.users, so admin identity is
--    resolved from (a) the JWT app_metadata claim or (b) an explicit
--    allow-list table. Both are checked by a STABLE function so policies stay
--    readable.
-- ---------------------------------------------------------------------------
create table if not exists public.platform_admins (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

insert into public.platform_admins (email, note)
values ('admin@nexoraluxe.com', 'Nexora Luxe platform administrator')
on conflict (email) do nothing;

alter table public.platform_admins enable row level security;
-- No policies: this table is intentionally unreadable by clients. It is only
-- ever consulted through the SECURITY DEFINER function below.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or exists (
      select 1
      from public.platform_admins pa
      where lower(pa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. STORAGE BUCKETS
--    `public = true`  -> anonymous GET via getPublicUrl()/CDN. Required for
--                        avatars, product photos, ad creatives and videos,
--                        which render on unauthenticated marketplace pages.
--    `public = false` -> `documents`: every read must be a signed URL.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',       'avatars',       true,  5242880,
    array['image/jpeg','image/png','image/webp','image/avif','image/gif']),
  ('product-media', 'product-media', true,  10485760,
    array['image/jpeg','image/png','image/webp','image/avif','image/gif']),
  ('ad-creatives',  'ad-creatives',  true,  10485760,
    array['image/jpeg','image/png','image/webp','image/avif','image/gif']),
  ('videos',        'videos',        true,  209715200,
    array['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp']),
  ('documents',     'documents',     false, 26214400,
    array['application/pdf','image/jpeg','image/png','image/webp',
          'application/zip','application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 2. STORAGE RLS POLICIES
--    Path convention enforced by every write policy:
--        <bucket>/<auth.uid()>/<scope>/<filename>
--    `storage.foldername(name)[1]` is the first path segment.
-- ---------------------------------------------------------------------------

-- 2a. PUBLIC BUCKETS — anyone may read (marketplace pages are anonymous).
drop policy if exists "public_read_avatars" on storage.objects;
create policy "public_read_avatars" on storage.objects
  for select to public using (bucket_id = 'avatars');

drop policy if exists "public_read_product_media" on storage.objects;
create policy "public_read_product_media" on storage.objects
  for select to public using (bucket_id = 'product-media');

drop policy if exists "public_read_ad_creatives" on storage.objects;
create policy "public_read_ad_creatives" on storage.objects
  for select to public using (bucket_id = 'ad-creatives');

drop policy if exists "public_read_videos" on storage.objects;
create policy "public_read_videos" on storage.objects
  for select to public using (bucket_id = 'videos');

-- 2b. OWNER WRITES (all buckets) — insert/update/delete only inside own folder.
drop policy if exists "owner_write_avatars" on storage.objects;
create policy "owner_write_avatars" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_modify_avatars" on storage.objects;
create policy "owner_modify_avatars" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_delete_avatars" on storage.objects;
create policy "owner_delete_avatars" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_write_product_media" on storage.objects;
create policy "owner_write_product_media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_modify_product_media" on storage.objects;
create policy "owner_modify_product_media" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_delete_product_media" on storage.objects;
create policy "owner_delete_product_media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_write_ad_creatives" on storage.objects;
create policy "owner_write_ad_creatives" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'ad-creatives' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_modify_ad_creatives" on storage.objects;
create policy "owner_modify_ad_creatives" on storage.objects
  for update to authenticated
  using (bucket_id = 'ad-creatives' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'ad-creatives' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_delete_ad_creatives" on storage.objects;
create policy "owner_delete_ad_creatives" on storage.objects
  for delete to authenticated
  using (bucket_id = 'ad-creatives' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_write_videos" on storage.objects;
create policy "owner_write_videos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_modify_videos" on storage.objects;
create policy "owner_modify_videos" on storage.objects
  for update to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_delete_videos" on storage.objects;
create policy "owner_delete_videos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2c. PRIVATE BUCKET `documents` — owner-only read/write, no anonymous access.
drop policy if exists "owner_read_documents" on storage.objects;
create policy "owner_read_documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "admin_read_documents" on storage.objects;
create policy "admin_read_documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and public.is_platform_admin());

drop policy if exists "owner_write_documents" on storage.objects;
create policy "owner_write_documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_modify_documents" on storage.objects;
create policy "owner_modify_documents" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_delete_documents" on storage.objects;
create policy "owner_delete_documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2d. ADMIN OVERRIDE — lets moderation remove abusive public media.
drop policy if exists "admin_manage_media_objects" on storage.objects;
create policy "admin_manage_media_objects" on storage.objects
  for all to authenticated
  using (bucket_id in ('avatars','product-media','ad-creatives','videos','documents')
         and public.is_platform_admin())
  with check (bucket_id in ('avatars','product-media','ad-creatives','videos','documents')
         and public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 3. MEDIA LEDGER — one row per stored object.
--    Storage alone cannot answer "which objects belong to this product?" or
--    "what did user X upload?" without listing folders. This table is the
--    queryable index the UI reads from.
-- ---------------------------------------------------------------------------
create table if not exists public.media_assets (
  id                uuid primary key default uuid_generate_v4(),
  owner_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bucket            text not null,
  path              text not null,
  public_url        text,
  media_kind        text not null check (media_kind in ('image','video','document')),
  visibility        text not null default 'private' check (visibility in ('public','private')),
  scope             text not null default 'general',
  entity_type       text,
  entity_id         text,
  mime_type         text not null,
  byte_size         bigint not null check (byte_size >= 0),
  original_name     text,
  checksum          text,
  width             integer,
  height            integer,
  duration_seconds  numeric(10,2),
  status            text not null default 'ready'
                      check (status in ('uploading','ready','failed','orphaned','deleted')),
  error_message     text,
  replaced_by       uuid references public.media_assets(id) on delete set null,
  replaced_at       timestamptz,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  constraint media_assets_bucket_path_key unique (bucket, path),
  constraint media_assets_bucket_check check (
    bucket in ('avatars','product-media','ad-creatives','videos','documents')
  )
);

create index if not exists idx_media_assets_owner
  on public.media_assets (owner_id, created_at desc);
create index if not exists idx_media_assets_entity
  on public.media_assets (entity_type, entity_id);
create index if not exists idx_media_assets_scope
  on public.media_assets (scope, owner_id);
create index if not exists idx_media_assets_status
  on public.media_assets (status) where status <> 'ready';

create or replace function public.set_media_assets_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_media_assets_updated_at on public.media_assets;
create trigger trg_media_assets_updated_at
  before update on public.media_assets
  for each row execute function public.set_media_assets_updated_at();

alter table public.media_assets enable row level security;

-- Read: public assets are visible to everyone; private assets only to the
-- owner (or an admin).
drop policy if exists media_assets_select on public.media_assets;
create policy media_assets_select on public.media_assets
  for select using (
    visibility = 'public'
    or owner_id = auth.uid()
    or public.is_platform_admin()
  );

-- Insert: you may only create rows you own.
drop policy if exists media_assets_insert on public.media_assets;
create policy media_assets_insert on public.media_assets
  for insert to authenticated
  with check (owner_id = auth.uid());

-- Update: owner or admin.
drop policy if exists media_assets_update on public.media_assets;
create policy media_assets_update on public.media_assets
  for update to authenticated
  using (owner_id = auth.uid() or public.is_platform_admin())
  with check (owner_id = auth.uid() or public.is_platform_admin());

-- Delete: owner or admin.
drop policy if exists media_assets_delete on public.media_assets;
create policy media_assets_delete on public.media_assets
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 4. CONVENIENCE VIEWS
-- ---------------------------------------------------------------------------
create or replace view public.media_storage_usage as
  select
    owner_id,
    count(*)                                              as asset_count,
    count(*) filter (where media_kind = 'image')          as image_count,
    count(*) filter (where media_kind = 'video')          as video_count,
    count(*) filter (where media_kind = 'document')       as document_count,
    coalesce(sum(byte_size), 0)                           as total_bytes
  from public.media_assets
  where status = 'ready' and deleted_at is null
  group by owner_id;

-- ---------------------------------------------------------------------------
-- 5. REPLACE FLOW HELPER
--    Marks the previous asset as replaced so a deleted-and-reuploaded avatar
--    or product photo leaves an auditable trail instead of a dangling URL.
-- ---------------------------------------------------------------------------
create or replace function public.mark_media_replaced(
  p_old_asset_id uuid,
  p_new_asset_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.media_assets
     set replaced_by = p_new_asset_id,
         replaced_at = now(),
         status      = 'deleted',
         deleted_at  = now()
   where id = p_old_asset_id
     and (owner_id = auth.uid() or public.is_platform_admin());
end;
$$;

revoke all on function public.mark_media_replaced(uuid, uuid) from public;
grant execute on function public.mark_media_replaced(uuid, uuid) to authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
