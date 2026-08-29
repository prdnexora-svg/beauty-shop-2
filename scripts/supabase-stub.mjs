// ============================================================================
// NEXORA LUXE — SUPABASE PLATFORM STUB (for offline migration testing)
//
// A real Supabase project ships schemas that live OUTSIDE the migrations
// folder: `auth` (GoTrue), `storage` (Storage API) and the anon/authenticated/
// service_role database roles. This module recreates them faithfully enough
// that RLS policy evaluation against them is REAL — `auth.uid()` reads the
// same `request.jwt.*` GUCs GoTrue sets, and `storage.foldername()` has the
// same semantics as the platform function.
//
// Used only by scripts/verify-sql.mjs (devDependency, never shipped).
// ============================================================================

/** Roles GoTrue/PostgREST use. `service_role` bypasses RLS by design. */
export const ROLES_SQL = `
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

grant usage on schema public to anon, authenticated, service_role;
`;

/**
 * `uuid-ossp` is not bundled with PGlite. Supabase installs it into the
 * `extensions` schema and also exposes `public.uuid_generate_v4()`. We provide
 * both backed by the built-in `gen_random_uuid()` (PG13+). This substitutes the
 * UUID *source* only — no DDL, constraint or policy logic changes.
 */
export const EXTENSIONS_SQL = `
create schema if not exists extensions;

create or replace function extensions.uuid_generate_v4() returns uuid
language sql volatile
as $$ select gen_random_uuid() $$;

create or replace function public.uuid_generate_v4() returns uuid
language sql volatile
as $$ select gen_random_uuid() $$;

grant usage on schema extensions to anon, authenticated, service_role;
`;

export const AUTH_SQL = `
create schema if not exists auth;

create table if not exists auth.users (
  id uuid not null unique primary key,
  aud varchar(255) null,
  role varchar(255) null,
  email varchar(255) null unique,
  encrypted_password varchar(255) null,
  email_confirmed_at timestamptz null,
  phone text null,
  created_at timestamptz null,
  updated_at timestamptz null,
  raw_app_meta_data jsonb null,
  raw_user_meta_data jsonb null,
  is_super_admin bool null,
  deleted_at timestamptz null
);

-- GoTrue injects the JWT into per-request GUCs; RLS reads it through these.
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    ),
    ''
  )::uuid;
$$;

create or replace function auth.role() returns text
language sql stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.role', true),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    ),
    ''
  )::text;
$$;

create or replace function auth.email() returns text
language sql stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.email', true),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
    ),
    ''
  )::text;
$$;

create or replace function auth.jwt() returns jsonb
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant select on table auth.users to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;
grant execute on function auth.email() to anon, authenticated, service_role;
grant execute on function auth.jwt() to anon, authenticated, service_role;
`;

export const STORAGE_SQL = `
create schema if not exists storage;

create table if not exists storage.buckets (
  id text not null primary key,
  name text not null,
  owner uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  public boolean default false,
  avif_autodetection boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  owner_id text
);

create table if not exists storage.objects (
  id uuid not null default extensions.uuid_generate_v4() primary key,
  bucket_id text references storage.buckets,
  name text,
  owner uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_accessed_at timestamptz default now(),
  metadata jsonb,
  path_tokens text[] generated always as (string_to_array(name, '/'::text)) stored,
  version text,
  owner_id text
);

create unique index if not exists bname on storage.objects (bucket_id, name);

create or replace function storage.foldername(name text) returns text[]
language plpgsql
as $$
declare
  _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts;
end
$$;

alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;

grant usage on schema storage to anon, authenticated, service_role;
grant all on storage.buckets to postgres, service_role;
grant all on storage.objects to postgres, service_role;
grant select on storage.buckets to anon, authenticated;
-- Supabase grants DML on storage.objects broadly and lets RLS be the gate.
grant select, insert, update, delete on storage.objects to anon, authenticated;
grant execute on function storage.foldername(text) to anon, authenticated, service_role;
`;

/**
 * After migrations run, grant DML on public tables the way Supabase's default
 * privileges do. Without this, RLS tests fail on GRANT rather than policy.
 */
export const PUBLIC_GRANTS_SQL = `
do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t.tablename);
    execute format('grant usage, select on all sequences in schema public to anon, authenticated');
  end loop;
end
$$;

grant execute on all functions in schema public to anon, authenticated;
grant usage on schema public to anon, authenticated;
`;

/** Emulate one request: role + JWT claims. Must run inside a transaction. */
export function requestContext({ role, sub = '', email = '', appRole = null }) {
  const claims = {
    sub: sub || undefined,
    role: role || undefined,
    email: email || undefined,
    app_metadata: appRole ? { role: appRole } : {},
  };
  const json = JSON.stringify(claims).replace(/'/g, "''");
  return `
    set local role '${role}';
    set local request.jwt.claims = '${json}';
    set local request.jwt.claim.sub = '${sub}';
    set local request.jwt.claim.role = '${role}';
    set local request.jwt.claim.email = '${email}';
  `;
}
