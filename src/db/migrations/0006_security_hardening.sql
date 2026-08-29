-- ============================================================================
-- NEXORA LUXE — MIGRATION 0006: SECURITY HARDENING & IDENTITY CONSOLIDATION
-- ============================================================================
-- Requires: 0001 (base schema), 0002 (RLS), 0004 (onboarding), 0005 (media).
--
-- Fixes three defects found by `npm run verify:sql`, which executes every
-- migration against a real PostgreSQL engine and enforces the policies
-- behaviourally:
--
--   1. CRITICAL — approve_supplier_onboarding() was SECURITY DEFINER with no
--      caller check. ANY authenticated user (and by default grant, anon) could
--      call it to mark any supplier `is_verified = TRUE` / 'Nexora Verified',
--      bypassing RLS entirely. Because `is_verified` gates the products,
--      rfqs_enquiries, quotes, messages and follow_ups write policies, this was
--      a full authorization bypass — not just a cosmetic badge forgery.
--
--   2. HIGH — is_verified_supplier() was SECURITY DEFINER without a pinned
--      search_path, leaving it open to search-path injection.
--
--   3. CRITICAL — profiles_buyer.user_id, profiles_supplier.user_id,
--      messages.sender_id and messages.receiver_id had foreign keys to the
--      legacy public.users table, which the application never populates
--      (Supabase Auth owns auth.users). Every profile create and every message
--      insert was therefore rejected by Postgres with a foreign-key violation,
--      regardless of RLS. Repointed to auth.users(id).
--
-- Safe to re-run. Migration numbering is append-only: projects that already
-- applied 0004 get the hardened function by running this file.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. GUARD THE APPROVAL FUNCTION
--    SECURITY DEFINER runs as the owner (bypasses RLS), so the function body
--    MUST perform its own authorization check. Order of operations:
--      - pin search_path so object references cannot be hijacked
--      - require a platform admin (JWT app_metadata role OR platform_admins)
--      - revoke the implicit PUBLIC execute grant, grant only authenticated
-- ---------------------------------------------------------------------------
create or replace function public.approve_supplier_onboarding(
  profile_id uuid,
  notes text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Only platform administrators can approve supplier onboarding.'
      using errcode = '42501';  -- insufficient_privilege
  end if;

  update public.profiles_supplier
     set onboarding_status  = 'approved',
         verification_level = 'Nexora Verified',
         is_verified        = true,
         reviewed_at        = now(),
         approved_at        = now(),
         verification_notes = notes,
         updated_at         = now()
   where id = profile_id;

  if not found then
    raise exception 'Supplier profile % not found.', profile_id
      using errcode = 'P0002';  -- no_data_found
  end if;
end;
$$;

revoke all on function public.approve_supplier_onboarding(uuid, text) from public;
revoke all on function public.approve_supplier_onboarding(uuid, text) from anon;
grant execute on function public.approve_supplier_onboarding(uuid, text) to authenticated;

-- Also harden the reject path if a future migration adds one; today the only
-- state transitions are the guarded approval above and the owner-scoped
-- INSERT policy, which is constrained to onboarding_status = 'business_pending'.

-- ---------------------------------------------------------------------------
-- 2. PIN search_path ON THE VERIFIED-SUPPLIER HELPER
-- ---------------------------------------------------------------------------
create or replace function public.is_verified_supplier(supplier_profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
      from public.profiles_supplier
     where id = supplier_profile_id
       and user_id = auth.uid()
       and is_verified = true
  );
end;
$$;

revoke all on function public.is_verified_supplier(uuid) from public;
grant execute on function public.is_verified_supplier(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. REPOINT USER-ID FOREIGN KEYS TO auth.users
--    GoTrue is the single source of identity; public.users is a legacy table
--    that nothing writes to. Re-aim the four FKs at the real user table so a
--    Supabase Auth signup can actually create a profile or send a message.
--    Constraint names are preserved so downstream tooling is unaffected.
-- ---------------------------------------------------------------------------
do $$
declare
  fk record;
begin
  for fk in
    select tc.table_name, tc.constraint_name, kcu.column_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name
       and tc.table_schema = kcu.table_schema
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_name = tc.constraint_name
       and ccu.table_schema = tc.table_schema
     where tc.constraint_type = 'FOREIGN KEY'
       and tc.table_schema = 'public'
       and ccu.table_name = 'users'
       and ccu.table_schema = 'public'
       and kcu.column_name in ('user_id', 'sender_id', 'receiver_id')
  loop
    execute format('alter table public.%I drop constraint %I', fk.table_name, fk.constraint_name);
    execute format(
      'alter table public.%I add constraint %I foreign key (%I) references auth.users(id) on delete cascade',
      fk.table_name, fk.constraint_name, fk.column_name
    );
    raise notice 'repointed %.% -> auth.users(id)', fk.table_name, fk.column_name;
  end loop;
end
$$;

-- The legacy table is now unreferenced. It is intentionally NOT dropped here:
-- src/lib/supabase.ts still upserts into it via syncAllDataToSupabase, and
-- dropping it would turn a permissions error into a hard 404 for that button.
-- Remove it once that sync path is deleted (see GAP-ANALYSIS.md H1).

-- ---------------------------------------------------------------------------
-- 4. INDEXES THE REPOINTED FKs RELY ON
--    Postgres does not index foreign keys automatically.
-- ---------------------------------------------------------------------------
create index if not exists idx_profiles_buyer_user_id on public.profiles_buyer (user_id);
create index if not exists idx_profiles_supplier_user_id on public.profiles_supplier (user_id);
create index if not exists idx_messages_sender_id on public.messages (sender_id);
create index if not exists idx_messages_receiver_id on public.messages (receiver_id);
create index if not exists idx_messages_conversation_id on public.messages (conversation_id);
create index if not exists idx_products_supplier_id on public.products (supplier_id);
create index if not exists idx_rfqs_buyer_id on public.rfqs_enquiries (buyer_id);
create index if not exists idx_rfqs_supplier_id on public.rfqs_enquiries (supplier_id);
create index if not exists idx_quotes_rfq_id on public.quotes (rfq_id);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
