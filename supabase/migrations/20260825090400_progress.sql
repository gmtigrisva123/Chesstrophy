-- ═══════════════════════════════════════════════════════════════════════════
-- 0400 · Learner progress
-- ═══════════════════════════════════════════════════════════════════════════
-- Everything a signed-in user accumulates. Every table here carries user_id
-- and is gated by `user_id = auth.uid()` — the only policy shape that appears.
--
-- Two patterns are used deliberately:
--   · Aggregates (ratings, streaks) live in a single row per user, so the
--     dashboard is one indexed lookup.
--   · Events (puzzle attempts, question answers) are append-only rows, so
--     history is never lost to an overwrite and stats are derivable.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── Puzzles ────────────────────────────────────────────────────────────────

create table public.puzzle_progress (
  user_id           uuid    primary key references auth.users (id) on delete cascade,
  puzzle_rating     integer not null default 1200,
  current_streak    integer not null default 0,
  longest_streak    integer not null default 0,
  last_solved_on    date,
  -- Free puzzles used today, reset by the client's day rollover.
  free_used_on      date,
  free_used_count   smallint not null default 0,
  daily_puzzle_solved_on date,
  updated_at        timestamptz not null default now(),

  constraint puzzle_progress_rating_range check (puzzle_rating between 400 and 3000),
  constraint puzzle_progress_streaks_positive check (current_streak >= 0 and longest_streak >= 0),
  constraint puzzle_progress_free_used_range check (free_used_count between 0 and 3)
);

comment on table public.puzzle_progress is
  'Per-user puzzle aggregates. One row; history lives in puzzle_attempts.';

create trigger puzzle_progress_set_updated_at
  before update on public.puzzle_progress
  for each row execute function public.set_updated_at();


create table public.puzzle_attempts (
  id            uuid        primary key default extensions.gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  puzzle_id     text        not null references public.puzzles (id) on delete cascade,
  solved        boolean     not null,
  hint_used     boolean     not null default false,
  rating_delta  integer     not null default 0,
  duration_ms   integer,
  attempted_at  timestamptz not null default now(),

  constraint puzzle_attempts_duration_positive check (duration_ms is null or duration_ms >= 0)
);

comment on table public.puzzle_attempts is
  'Append-only attempt log. Solved-once accounting is derived from this, not stored.';

create index puzzle_attempts_user_idx   on public.puzzle_attempts (user_id, attempted_at desc);
-- One row per user per puzzle marks the first successful solve, which is what
-- "already solved" and the reward ledger both key on.
create unique index puzzle_attempts_first_solve_idx
  on public.puzzle_attempts (user_id, puzzle_id) where solved;


-- ── Openings (SM-2-lite spaced repetition) ─────────────────────────────────

create table public.opening_progress (
  user_id       uuid        not null references auth.users (id) on delete cascade,
  variation_id  text        not null references public.opening_variations (id) on delete cascade,
  status        public.sr_status not null default 'New',
  repetitions   integer     not null default 0,
  correct_count integer     not null default 0,
  attempt_count integer     not null default 0,
  last_seen_on  date,
  due_on        date,
  updated_at    timestamptz not null default now(),

  primary key (user_id, variation_id),
  constraint opening_progress_counts_sane
    check (repetitions >= 0 and correct_count >= 0 and attempt_count >= correct_count)
);

comment on table public.opening_progress is
  'Spaced-repetition state per variation. due_on drives the drill queue.';
comment on column public.opening_progress.due_on is
  'Next review date. NULL means never practised; past-or-today means due now.';

-- The drill queue query: "my variations due on or before today".
create index opening_progress_due_idx on public.opening_progress (user_id, due_on)
  where due_on is not null;

create trigger opening_progress_set_updated_at
  before update on public.opening_progress
  for each row execute function public.set_updated_at();


create table public.opening_favourites (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  opening_id  text        not null references public.openings (id) on delete cascade,
  created_at  timestamptz not null default now(),

  primary key (user_id, opening_id)
);

create table public.opening_repertoire (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  opening_id  text        not null references public.openings (id) on delete cascade,
  added_at    timestamptz not null default now(),

  primary key (user_id, opening_id)
);

comment on table public.opening_repertoire is 'Openings the user has adopted as their own.';


-- Concept checkpoints in the Opening Academy, and the per-stage "mark as
-- learned" flags. Namespaced by opening so the two never collide.
create table public.opening_academy_progress (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  concept_id  text        not null,
  completed_at timestamptz not null default now(),

  primary key (user_id, concept_id)
);

comment on table public.opening_academy_progress is
  'Completed concept lessons and stage checkpoints, keyed by the client''s concept id.';


-- ── Courses ────────────────────────────────────────────────────────────────

create table public.course_progress (
  user_id        uuid        not null references auth.users (id) on delete cascade,
  course_id      text        not null references public.courses (id) on delete cascade,
  last_tab       text        not null default 'learn',
  chapter_index  smallint    not null default 0,
  furthest_index smallint    not null default 0,
  -- Cheat-sheet ticks and practice answers, both sparse maps keyed by index.
  checklist      jsonb       not null default '{}'::jsonb,
  quiz           jsonb       not null default '{}'::jsonb,
  completed_at   timestamptz,
  updated_at     timestamptz not null default now(),

  primary key (user_id, course_id),
  constraint course_progress_last_tab_valid check (last_tab in ('learn', 'cheatsheet', 'practice')),
  constraint course_progress_indices_positive check (chapter_index >= 0 and furthest_index >= 0),
  constraint course_progress_furthest_is_max check (furthest_index >= chapter_index),
  constraint course_progress_checklist_is_object check (jsonb_typeof(checklist) = 'object'),
  constraint course_progress_quiz_is_object check (jsonb_typeof(quiz) = 'object')
);

comment on table public.course_progress is
  'Per-course reading position and answers. updated_at drives "Continue Learning".';

-- Powers getMostRecentCourse() without a sort over the whole table.
create index course_progress_recent_idx on public.course_progress (user_id, updated_at desc);

create trigger course_progress_set_updated_at
  before update on public.course_progress
  for each row execute function public.set_updated_at();


-- ── Skill tree ─────────────────────────────────────────────────────────────

create table public.skill_tree_progress (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  node_id     text        not null references public.skill_tree_nodes (id) on delete cascade,
  progress    smallint    not null default 0,
  unlocked_at timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  primary key (user_id, node_id),
  constraint skill_tree_progress_range check (progress between 0 and 100)
);

comment on table public.skill_tree_progress is
  'A row exists only for unlocked nodes. progress = 100 means mastered.';

create trigger skill_tree_progress_set_updated_at
  before update on public.skill_tree_progress
  for each row execute function public.set_updated_at();


-- ── Daily questions ────────────────────────────────────────────────────────

create table public.daily_question_state (
  user_id         uuid    primary key references auth.users (id) on delete cascade,
  rating_source   text,                       -- Chess.com | Lichess | FIDE | Other
  user_rating     integer,
  rating_group    public.rating_band,
  setup_completed boolean not null default false,
  current_streak  integer not null default 0,
  longest_streak  integer not null default 0,
  last_session_on date,
  total_answered  integer not null default 0,
  total_correct   integer not null default 0,
  xp              integer not null default 0,
  badges          text[]  not null default '{}',
  updated_at      timestamptz not null default now(),

  constraint daily_question_state_rating_range
    check (user_rating is null or user_rating between 100 and 3000),
  constraint daily_question_state_totals_sane
    check (total_answered >= total_correct and total_correct >= 0)
);

create trigger daily_question_state_set_updated_at
  before update on public.daily_question_state
  for each row execute function public.set_updated_at();


create table public.daily_question_sessions (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  session_date date        not null,
  -- The five ids drawn for the day, in order. Stored so a refresh resumes the
  -- same session rather than redrawing.
  question_ids text[]      not null,
  current_index smallint   not null default 0,
  is_complete  boolean     not null default false,
  score        smallint,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  primary key (user_id, session_date),
  constraint daily_question_sessions_index_range
    check (current_index >= 0 and current_index <= coalesce(array_length(question_ids, 1), 0))
);

comment on table public.daily_question_sessions is
  'One session per user per calendar day. The PK is what makes the day idempotent.';

create trigger daily_question_sessions_set_updated_at
  before update on public.daily_question_sessions
  for each row execute function public.set_updated_at();


create table public.daily_question_answers (
  id            uuid        primary key default extensions.gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  session_date  date        not null,
  question_id   text        not null references public.daily_questions (id) on delete cascade,
  topic         text        not null,
  selected_index smallint   not null,
  is_correct    boolean     not null,
  seconds_taken integer,
  answered_at   timestamptz not null default now(),

  -- One answer per question per session; a double-submit is a no-op.
  unique (user_id, session_date, question_id),
  constraint daily_question_answers_seconds_positive
    check (seconds_taken is null or seconds_taken >= 0)
);

comment on table public.daily_question_answers is
  'Append-only answer log. Topic accuracy is derived from this — see user_topic_stats.';

create index daily_question_answers_topic_idx on public.daily_question_answers (user_id, topic);


-- ── Coaching state ─────────────────────────────────────────────────────────

create table public.coach_state (
  user_id           uuid    primary key references auth.users (id) on delete cascade,
  placement_done    boolean not null default false,
  estimated_rating  integer,
  player_style      text,
  cognitive_profile jsonb   not null default '{}'::jsonb,
  learning_path     jsonb   not null default '{}'::jsonb,
  weekly_goals      jsonb   not null default '[]'::jsonb,
  completed_goals   text[]  not null default '{}',
  dismissed_insights text[] not null default '{}',
  sessions_completed integer not null default 0,
  updated_at        timestamptz not null default now(),

  constraint coach_state_rating_range
    check (estimated_rating is null or estimated_rating between 100 and 3000)
);

comment on table public.coach_state is
  'Placement results and coaching plan. JSONB where the shape is owned by the coaching UI.';

create trigger coach_state_set_updated_at
  before update on public.coach_state
  for each row execute function public.set_updated_at();


-- ── Row level security ─────────────────────────────────────────────────────
-- Every table above has the same rule: you may read and write your own rows,
-- and nothing else. Generated so it cannot drift table to table, then asserted
-- by supabase/tests/rls.test.sql.

do $$
declare
  t text;
begin
  foreach t in array array[
    'puzzle_progress', 'puzzle_attempts',
    'opening_progress', 'opening_favourites', 'opening_repertoire',
    'opening_academy_progress', 'course_progress', 'skill_tree_progress',
    'daily_question_state', 'daily_question_sessions', 'daily_question_answers',
    'coach_state'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))',
      t || ': read own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))',
      t || ': insert own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || ': update own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))',
      t || ': delete own', t);

    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;
