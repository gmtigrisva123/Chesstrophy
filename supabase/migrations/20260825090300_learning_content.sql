-- ═══════════════════════════════════════════════════════════════════════════
-- 0300 · Learning content — courses, question banks, skill tree, store
-- ═══════════════════════════════════════════════════════════════════════════
-- Seeded from src/data/studies.js, src/data/dailyQuestions.js,
-- src/data/learningTree.js and src/data/achievements.js.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── Study categories & courses ─────────────────────────────────────────────

create table public.study_categories (
  id            text        primary key,
  label         text        not null,
  icon          text,
  accent_colour text        not null default '#C9A84C',
  sort_order    integer     not null default 0,

  constraint study_categories_id_slug check (id ~ '^[a-z0-9][a-z0-9-]*$')
);

comment on table public.study_categories is 'Groupings shown on the Studies page.';


create table public.courses (
  id            text        primary key,
  category_id   text        not null references public.study_categories (id) on delete restrict,
  title         text        not null,
  description   text,
  difficulty    public.difficulty_level not null,
  lesson_count  smallint    not null default 0,
  estimated_time text,
  tags          text[]      not null default '{}',
  cover_image_url text,

  -- The Cheat Sheet tab: an ordered list of short reference lines. Rendered
  -- as a unit and never queried, so JSONB rather than a table.
  cheat_sheet   jsonb       not null default '[]'::jsonb,

  sort_order    integer     not null default 0,
  is_published  boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint courses_id_slug check (id ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint courses_cheat_sheet_is_array check (jsonb_typeof(cheat_sheet) = 'array')
);

comment on table public.courses is
  'A multi-chapter study. Opened through the shared CourseViewer.';

create index courses_category_idx on public.courses (category_id, sort_order) where is_published;
create index courses_tags_idx     on public.courses using gin (tags);

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();


create table public.course_chapters (
  course_id   text        not null references public.courses (id) on delete cascade,
  chapter_index smallint  not null,
  title       text        not null,
  fen         text,
  -- Ordered paragraphs. text[] rather than one blob so the reader can render
  -- them as separate blocks without re-splitting on newlines.
  body        text[]      not null default '{}',
  note        text,

  primary key (course_id, chapter_index),
  constraint course_chapters_index_positive check (chapter_index >= 0)
);

comment on table public.course_chapters is 'One lesson within a course, in reading order.';


create table public.course_practice_questions (
  course_id     text      not null references public.courses (id) on delete cascade,
  question_index smallint not null,
  prompt        text      not null,
  options       text[]    not null,
  answer_index  smallint  not null,
  explanation   text,

  primary key (course_id, question_index),
  -- The answer must actually index into the options it belongs to. Cheap to
  -- state here, and it turns a content typo into a failed seed rather than an
  -- unanswerable quiz in production.
  constraint course_practice_answer_in_range
    check (answer_index >= 0 and answer_index < coalesce(array_length(options, 1), 0)),
  constraint course_practice_options_min check (array_length(options, 1) >= 2)
);

comment on table public.course_practice_questions is
  'Practice-tab quiz. answer_index is validated against options at write time.';


-- ── Daily question bank ────────────────────────────────────────────────────

create table public.daily_questions (
  id               text     primary key,
  rating_group     public.rating_band not null,
  topic            text     not null,
  question_type    text     not null,     -- "Multiple Choice" | "Tactical Puzzle" | …
  prompt           text     not null,
  options          text[]   not null,
  answer_index     smallint not null,
  explanation      text,
  learning_note    text,
  difficulty       text,
  strength_needed  text,
  fen              text,
  is_published     boolean  not null default true,
  created_at       timestamptz not null default now(),

  constraint daily_questions_answer_in_range
    check (answer_index >= 0 and answer_index < coalesce(array_length(options, 1), 0)),
  constraint daily_questions_options_min check (array_length(options, 1) >= 2)
);

comment on table public.daily_questions is
  'Rating-banded question bank. generateDailyQuestions() draws five per session.';

create index daily_questions_group_idx on public.daily_questions (rating_group) where is_published;
create index daily_questions_topic_idx on public.daily_questions (topic);


create table public.quiz_questions (
  id           uuid     primary key default extensions.gen_random_uuid(),
  category     text     not null,     -- opening | middlegame | endgame | tactics | …
  prompt       text     not null,
  options      text[]   not null,
  answer_index smallint not null,
  explanation  text,
  is_published boolean  not null default true,

  constraint quiz_questions_answer_in_range
    check (answer_index >= 0 and answer_index < coalesce(array_length(options, 1), 0)),
  constraint quiz_questions_options_min check (array_length(options, 1) >= 2)
);

comment on table public.quiz_questions is 'Knowledge Tester bank, grouped by category.';

create index quiz_questions_category_idx on public.quiz_questions (category) where is_published;


-- Placement assessment shown once, before the Learning Tree unlocks.
create table public.placement_questions (
  id           text     primary key,
  question_type text    not null,      -- tactical | positional | endgame | …
  label        text     not null,
  prompt       text     not null,
  options      text[]   not null,
  answer_index smallint not null,
  explanation  text,
  sort_order   integer  not null default 0,

  constraint placement_questions_answer_in_range
    check (answer_index >= 0 and answer_index < coalesce(array_length(options, 1), 0))
);

comment on table public.placement_questions is
  'One-off placement assessment feeding estimated rating and play style.';


-- ── Skill tree ─────────────────────────────────────────────────────────────
-- Self-referencing tree. `requires` is a separate edge table because the graph
-- is a DAG, not a pure tree: a node may be gated behind more than one parent.

create table public.skill_tree_nodes (
  id            text        primary key,
  parent_id     text        references public.skill_tree_nodes (id) on delete cascade,
  label         text        not null,
  icon          text,
  accent_colour text,
  description   text,
  xp_reward     integer     not null default 0,
  sort_order    integer     not null default 0,

  constraint skill_tree_nodes_xp_positive check (xp_reward >= 0),
  constraint skill_tree_nodes_no_self_parent check (parent_id is null or parent_id <> id)
);

comment on table public.skill_tree_nodes is
  'Learning Tree node. parent_id gives the drawn tree; skill_tree_prerequisites gives the unlock DAG.';

create index skill_tree_nodes_parent_idx on public.skill_tree_nodes (parent_id, sort_order);


create table public.skill_tree_prerequisites (
  node_id         text not null references public.skill_tree_nodes (id) on delete cascade,
  requires_node_id text not null references public.skill_tree_nodes (id) on delete cascade,

  primary key (node_id, requires_node_id),
  constraint skill_tree_prerequisites_not_self check (node_id <> requires_node_id)
);

comment on table public.skill_tree_prerequisites is
  'Unlock edges. A node opens when every prerequisite is unlocked.';


-- ── Store & achievements ───────────────────────────────────────────────────

create table public.store_items (
  id            text        primary key,
  title         text        not null,
  description   text,
  icon          text,
  difficulty    public.difficulty_level,
  target_rating text,
  price_coins   integer     not null,
  price_real    numeric(10, 2),
  sort_order    integer     not null default 0,
  is_published  boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint store_items_price_positive check (price_coins >= 0),
  constraint store_items_price_real_positive check (price_real is null or price_real >= 0)
);

comment on table public.store_items is 'Purchasable with ProphyCoins. See spend_coins().';

create trigger store_items_set_updated_at
  before update on public.store_items
  for each row execute function public.set_updated_at();


create table public.achievements (
  id          text        primary key,
  label       text        not null,
  description text        not null,
  icon        text,
  -- Machine-readable unlock rule, evaluated by check_achievements() in 0500.
  -- Shape: {"kind": "transaction_count", "type": "course_complete", "target": 1}
  criteria    jsonb       not null,
  sort_order  integer     not null default 0,

  constraint achievements_criteria_is_object check (jsonb_typeof(criteria) = 'object'),
  constraint achievements_criteria_has_kind check (criteria ? 'kind')
);

comment on table public.achievements is
  'Unlockable badges. `criteria` is evaluated server-side so a client cannot self-award.';


-- Reward amounts, tunable without a deploy. grant_reward() reads these.
create table public.reward_rules (
  reward_type text        primary key,
  label       text        not null,
  coins       integer     not null default 0,
  xp          integer     not null default 0,
  is_enabled  boolean     not null default true,
  updated_at  timestamptz not null default now(),

  constraint reward_rules_amounts_positive check (coins >= 0 and xp >= 0)
);

comment on table public.reward_rules is
  'Server-side reward table. The client may propose a reward type; the amount comes from here.';

create trigger reward_rules_set_updated_at
  before update on public.reward_rules
  for each row execute function public.set_updated_at();


-- ── Row level security ─────────────────────────────────────────────────────

alter table public.study_categories         enable row level security;
alter table public.courses                  enable row level security;
alter table public.course_chapters          enable row level security;
alter table public.course_practice_questions enable row level security;
alter table public.daily_questions          enable row level security;
alter table public.quiz_questions           enable row level security;
alter table public.placement_questions      enable row level security;
alter table public.skill_tree_nodes         enable row level security;
alter table public.skill_tree_prerequisites enable row level security;
alter table public.store_items              enable row level security;
alter table public.achievements             enable row level security;
alter table public.reward_rules             enable row level security;

-- Reference data: readable by everyone, writable by admins.
do $$
declare
  t text;
begin
  foreach t in array array[
    'study_categories', 'course_chapters', 'course_practice_questions',
    'daily_questions', 'quiz_questions', 'placement_questions',
    'skill_tree_nodes', 'skill_tree_prerequisites', 'achievements', 'reward_rules'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || ': read', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || ': admin write', t);
  end loop;
end;
$$;

-- Published-gated tables get their own explicit policies.
create policy "courses: read published"
  on public.courses for select to anon, authenticated
  using (is_published or public.is_admin());
create policy "courses: admin write"
  on public.courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "store_items: read published"
  on public.store_items for select to anon, authenticated
  using (is_published or public.is_admin());
create policy "store_items: admin write"
  on public.store_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on
  public.study_categories, public.courses, public.course_chapters,
  public.course_practice_questions, public.daily_questions, public.quiz_questions,
  public.placement_questions, public.skill_tree_nodes, public.skill_tree_prerequisites,
  public.store_items, public.achievements, public.reward_rules
  to anon, authenticated;

grant insert, update, delete on
  public.study_categories, public.courses, public.course_chapters,
  public.course_practice_questions, public.daily_questions, public.quiz_questions,
  public.placement_questions, public.skill_tree_nodes, public.skill_tree_prerequisites,
  public.store_items, public.achievements, public.reward_rules
  to authenticated;
