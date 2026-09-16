-- ═══════════════════════════════════════════════════════════════════════════
-- 1000 · Profiles — username uniqueness as a constraint
-- ═══════════════════════════════════════════════════════════════════════════
-- 0100 enforced unique usernames with a bare unique index. That is the same
-- guarantee at the storage level, but it is invisible to pg_constraint — so
-- `col_is_unique('profiles', 'username')` in tests/00_schema.test.sql fails,
-- and information_schema tooling cannot see the rule either. Promote the
-- existing index to a table constraint; no data changes and the index (and
-- its name) are kept.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.profiles
  add constraint profiles_username_key unique using index profiles_username_key;
