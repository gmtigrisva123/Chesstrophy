-- ═══════════════════════════════════════════════════════════════════════════
-- Schema invariants
-- ═══════════════════════════════════════════════════════════════════════════
-- Run with: supabase test db
--
-- These assert the properties the schema is *for*, not that CREATE TABLE ran.
-- The most valuable one is the RLS sweep: it fails when someone adds a table
-- and forgets to secure it, which is the mistake that actually happens.
-- ═══════════════════════════════════════════════════════════════════════════

begin;
select plan(14);

-- ── Row level security is not optional ─────────────────────────────────────

select is_empty(
  $$
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not c.relrowsecurity
  $$,
  'every table in public has row level security enabled'
);

select is_empty(
  $$
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity
      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
  $$,
  'every table with RLS has at least one policy'
);

-- ── Views must not bypass the RLS of their base tables ─────────────────────

select is_empty(
  $$
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and coalesce(
        (select option_value from pg_options_to_table(c.reloptions)
         where option_name = 'security_invoker'), 'false') <> 'true'
  $$,
  'every view is security_invoker, so it cannot leak past RLS'
);

-- ── SECURITY DEFINER functions must pin their search_path ──────────────────

select is_empty(
  $$
    select p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and not exists (
        select 1 from unnest(coalesce(p.proconfig, '{}')) cfg
        where cfg like 'search_path=%'
      )
  $$,
  'every SECURITY DEFINER function pins search_path'
);

-- ── The economy's core guarantees ──────────────────────────────────────────

select has_table('public', 'coin_transactions', 'the ledger exists');

select col_is_unique(
  'public', 'coin_transactions',
  array['user_id', 'reward_type', 'reference_id'],
  'the ledger idempotency key is a unique constraint, not a convention'
);

-- The wallet must not be writable by a client; only the ledger trigger writes
-- it. That is expressed as the absence of any INSERT/UPDATE/DELETE policy.
select is(
  (select count(*)::integer
   from pg_policy p
   join pg_class c on c.oid = p.polrelid
   where c.relname = 'wallets' and p.polcmd <> 'r'),
  0,
  'wallets has no write policy: balances are derived, never client-written'
);

select is(
  (select count(*)::integer
   from pg_policy p
   join pg_class c on c.oid = p.polrelid
   where c.relname = 'coin_transactions' and p.polcmd in ('w', 'd')),
  0,
  'the ledger is append-only for clients: no UPDATE or DELETE policy'
);

-- ── Referential integrity where it matters ─────────────────────────────────

select has_fk('public', 'opening_variations', 'variations belong to an opening');
select has_fk('public', 'opening_variation_moves', 'moves belong to a variation');
select has_fk('public', 'course_chapters', 'chapters belong to a course');

-- ── Every user-owned table cascades on account deletion ────────────────────
-- A user asking to be deleted must actually be deleted.

select is_empty(
  $$
    select c.relname || '.' || a.attname
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum = con.conkey[1]
    join pg_class ref on ref.oid = con.confrelid
    join pg_namespace refn on refn.oid = ref.relnamespace
    where n.nspname = 'public'
      and con.contype = 'f'
      and refn.nspname = 'auth'
      and ref.relname = 'users'
      and a.attname = 'user_id'
      and con.confdeltype <> 'c'
  $$,
  'every user_id foreign key to auth.users cascades on delete'
);

-- ── Singletons and uniqueness ──────────────────────────────────────────────

select col_is_unique('public', 'profiles', 'username', 'usernames are unique');

select is(
  (select count(*)::integer from public.site_settings),
  1,
  'site_settings holds exactly one row'
);

select * from finish();
rollback;
