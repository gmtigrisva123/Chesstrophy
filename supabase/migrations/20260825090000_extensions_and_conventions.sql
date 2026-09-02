-- ═══════════════════════════════════════════════════════════════════════════
-- 0000 · Extensions, conventions and shared helpers
-- ═══════════════════════════════════════════════════════════════════════════
-- Everything later migrations rely on: extensions, enum types, the audit
-- column trigger, and the authorisation helpers used by every RLS policy.
--
-- Conventions used throughout this schema:
--   · snake_case identifiers; plural table names; `id` primary keys.
--   · Catalogue tables (content everyone reads) keep the application's own
--     text ids — "italian", "potd" — because seeds are generated from
--     src/data/ and those ids are already stable, referenced identifiers.
--   · User-owned tables use uuid primary keys and always carry `user_id`
--     referencing auth.users with ON DELETE CASCADE, so deleting an account
--     really removes the data.
--   · RLS is enabled on every table in the same migration that creates it.
--     Never rely on a follow-up migration for this.
--   · Timestamps are timestamptz. Dates that mean "a calendar day for this
--     user" are `date`, because a streak is a human day, not 24 hours.
-- ═══════════════════════════════════════════════════════════════════════════

-- Supabase provisions `extensions` for us; be explicit so a bare Postgres
-- also works.
create schema if not exists extensions;

create extension if not exists "pgcrypto"  with schema extensions;  -- gen_random_uuid()
create extension if not exists "citext"    with schema extensions;  -- case-insensitive usernames
create extension if not exists "pg_trgm"   with schema extensions;  -- fuzzy search over the wiki


-- ── Shared enums ───────────────────────────────────────────────────────────
-- Enums rather than free text: these are closed sets the UI switches on, and
-- a typo in a seed should fail the load rather than render a blank badge.

create type public.piece_colour as enum ('white', 'black');

create type public.difficulty_level as enum ('Beginner', 'Intermediate', 'Advanced', 'Expert');

-- The six bands classifyRating() maps a numeric rating onto.
create type public.rating_band as enum ('Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert', 'Master');

-- SM-2-lite spaced-repetition ladder. Order matters: the interval table and
-- nextSrStatus() both walk it, so keep it in ascending mastery order.
create type public.sr_status as enum ('New', 'Learning', 'Good', 'Strong', 'Mastered');

create type public.game_result as enum ('1-0', '0-1', '1/2-1/2', '*');

create type public.publication_status as enum ('draft', 'pending', 'published', 'rejected', 'archived');

create type public.app_role as enum ('member', 'moderator', 'admin');


-- ── Audit columns ──────────────────────────────────────────────────────────

-- Keeps `updated_at` honest. Attached by every table that has the column;
-- doing it in the database rather than the client means an admin editing a
-- row in Studio gets the same behaviour as the app.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger: stamps updated_at with the transaction timestamp.';


-- ── Authorisation helpers ──────────────────────────────────────────────────
--
-- Roles live in their own table rather than on `profiles`. A user can update
-- their own profile row, so a `role` column there would be a one-request
-- privilege escalation. This table has no INSERT/UPDATE/DELETE policy at all,
-- which means only the service role (and a database superuser) can grant a
-- role — exactly the property we want.

create table public.user_roles (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  role        public.app_role not null,
  granted_at  timestamptz not null default now(),
  granted_by  uuid        references auth.users (id) on delete set null,

  primary key (user_id, role)
);

comment on table public.user_roles is
  'Role grants. Deliberately has no write policy: only the service role may grant a role.';

alter table public.user_roles enable row level security;

-- A user may read their own grants (the UI hides admin-only affordances with
-- this), and nothing else.
create policy "user_roles: read own"
  on public.user_roles
  for select
  to authenticated
  using (user_id = (select auth.uid()));


-- `stable` (not `volatile`) so Postgres may cache the result within a
-- statement; `security definer` so the check works from inside a policy on a
-- table the caller cannot read. search_path is pinned — a mutable search_path
-- on a SECURITY DEFINER function is a well-known escalation vector.
create or replace function public.has_role(target_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = target_role
  );
$$;

comment on function public.has_role(public.app_role) is
  'True when the current user holds the given role. Used by admin RLS policies.';


create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role in ('admin', 'moderator')
  );
$$;

comment on function public.is_admin() is
  'True for admins and moderators — the two roles allowed to edit catalogue content.';


-- ── Default privileges ─────────────────────────────────────────────────────
-- Start from "no access" and grant deliberately. Supabase's defaults are
-- generous; RLS still gates every row, but an explicit grant list means a
-- table added without a policy is inaccessible rather than wide open.

-- Revoke CREATE, not USAGE: anon/authenticated must never be able to add
-- objects to the schema, but revoking USAGE outright would also cut off
-- Supabase's own internal roles.
revoke create on schema public from public;
grant usage on schema public to anon, authenticated, service_role;

alter default privileges in schema public
  revoke all on tables from anon, authenticated;
alter default privileges in schema public
  revoke all on functions from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;

grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.is_admin() to authenticated;
