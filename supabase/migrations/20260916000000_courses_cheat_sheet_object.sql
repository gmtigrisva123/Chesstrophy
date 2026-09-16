-- ═══════════════════════════════════════════════════════════════════════════
-- 0900 · Courses — cheat_sheet is an object, not an array
-- ═══════════════════════════════════════════════════════════════════════════
-- The Cheat Sheet tab is an object of named lists — {concepts, rules,
-- mistakes, tricks} — and that is the shape src/data/studies.js, the seed
-- generator, the admin schemas and the catalogue repository all produce and
-- read. 0300 declared it as an array, so `supabase db reset` rejected every
-- seeded course with courses_cheat_sheet_is_array. Align the column with the
-- app: default `{}`, and require a JSON object.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.courses
  alter column cheat_sheet set default '{}'::jsonb;

-- Under the old constraint the only value that could ever be stored was the
-- `[]` default, so rewriting it loses nothing.
update public.courses
   set cheat_sheet = '{}'::jsonb
 where jsonb_typeof(cheat_sheet) <> 'object';

alter table public.courses
  drop constraint courses_cheat_sheet_is_array;

alter table public.courses
  add constraint courses_cheat_sheet_is_object
  check (jsonb_typeof(cheat_sheet) = 'object');

comment on column public.courses.cheat_sheet is
  'The Cheat Sheet tab: an object of named lists ({concepts, rules, mistakes, tricks}). Rendered as a unit and never queried, so JSONB rather than a table.';
