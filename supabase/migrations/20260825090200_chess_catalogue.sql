-- ═══════════════════════════════════════════════════════════════════════════
-- 0200 · Chess catalogue — openings, variations, puzzles, classic games
-- ═══════════════════════════════════════════════════════════════════════════
-- Content everyone can read and only admins can write. Seeded from src/data/
-- by scripts/generate-supabase-seed.mjs, so the ids here are the application's
-- own stable identifiers ("italian", "giuoco-piano", "potd").
--
-- Modelling note: queryable attributes are real columns; the long editorial
-- prose blocks (mainIdeas, strategicConcepts, typicalPlans, …) live in one
-- `editorial` JSONB column. They are rendered as a unit, never filtered or
-- joined on, and their shape belongs to the content team rather than to the
-- query planner. Splitting them into eighteen text[] columns would add schema
-- churn for no query benefit.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── Openings ───────────────────────────────────────────────────────────────

create table public.openings (
  id            text        primary key,
  name          text        not null,
  eco           text        not null,
  opening_group text        not null,   -- "e4 Openings" | "d4 Openings" | "Flank Openings"
  for_side      public.piece_colour not null,
  style         text        not null,   -- "Attacking", "Solid", …
  difficulty    public.difficulty_level not null,
  rating_band   text,                   -- human range, e.g. "600–1400"
  popularity    smallint    not null default 0,
  study_time    text,
  accent_colour text        not null default '#C9A84C',
  tags          text[]      not null default '{}',

  history       text,
  overview      text,

  -- Editorial sections. Validated for shape, not for content: a missing
  -- section renders as an absent block rather than an error.
  editorial     jsonb       not null default '{}'::jsonb,

  sort_order    integer     not null default 0,
  is_published  boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint openings_popularity_range check (popularity between 0 and 100),
  constraint openings_editorial_is_object check (jsonb_typeof(editorial) = 'object'),
  constraint openings_id_slug check (id ~ '^[a-z0-9][a-z0-9-]*$')
);

comment on table public.openings is
  'Opening repertoire catalogue. Seeded from src/data/openingRepertoire.js.';
comment on column public.openings.editorial is
  'Prose sections keyed by name: mainIdeas, strategicConcepts, tacticalThemes, typicalPlans, pieceDevelopment, pawnStructures, importantSquares, typicalSacrifices, commonMistakes, moveOrderTricks, transpositions, commonTraps, opponentResponses, famousPlayers, modelGames.';

create index openings_group_idx     on public.openings (opening_group, sort_order) where is_published;
create index openings_for_side_idx  on public.openings (for_side)                  where is_published;
create index openings_difficulty_idx on public.openings (difficulty)               where is_published;
create index openings_tags_idx      on public.openings using gin (tags);
create index openings_name_trgm_idx on public.openings using gin (name extensions.gin_trgm_ops);

create trigger openings_set_updated_at
  before update on public.openings
  for each row execute function public.set_updated_at();


-- ── Variations ─────────────────────────────────────────────────────────────

create table public.opening_variations (
  id          text        primary key,
  opening_id  text        not null references public.openings (id) on delete cascade,
  name        text        not null,
  difficulty  public.difficulty_level not null,
  plans       text,
  traps       text[]      not null default '{}',
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint opening_variations_id_slug check (id ~ '^[a-z0-9][a-z0-9-]*$')
);

comment on table public.opening_variations is
  'A named line inside an opening. The unit of spaced repetition — see opening_progress.';

create index opening_variations_opening_idx on public.opening_variations (opening_id, sort_order);

create trigger opening_variations_set_updated_at
  before update on public.opening_variations
  for each row execute function public.set_updated_at();


-- ── Moves ──────────────────────────────────────────────────────────────────
-- Fully normalised rather than a JSON array: the trainer walks these one ply
-- at a time, and "which lines start 1.e4 c5" is a query we want to be able to
-- answer without unnesting JSON.

create table public.opening_variation_moves (
  variation_id text       not null references public.opening_variations (id) on delete cascade,
  ply          smallint   not null,
  san          text       not null,
  explanation  text,

  primary key (variation_id, ply),
  constraint opening_variation_moves_ply_positive check (ply >= 0)
);

comment on table public.opening_variation_moves is
  'One ply of a variation, in order. ply 0 is White''s first move.';
comment on column public.opening_variation_moves.san is
  'Standard Algebraic Notation, exactly as the client engine parses it.';

create index opening_variation_moves_san_idx on public.opening_variation_moves (san);


-- ── Puzzles ────────────────────────────────────────────────────────────────

create table public.puzzles (
  id           text        primary key,
  title        text        not null,
  description  text,
  theme        text,
  rating       integer     not null,
  fen          text        not null,

  -- Full ply-by-ply line: even indices are the player's moves, odd indices the
  -- opponent's forced replies (auto-played). Long-algebraic, e.g. 'd1e2'.
  solution     text[]      not null,

  tags         text[]      not null default '{}',
  -- Exactly one puzzle may be the Puzzle of the Day; enforced by the partial
  -- unique index below rather than by convention.
  is_daily     boolean     not null default false,
  is_published boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint puzzles_rating_range   check (rating between 400 and 3000),
  constraint puzzles_solution_nonempty check (array_length(solution, 1) >= 1),
  -- Postgres forbids subqueries in CHECK, so validate the flattened list:
  -- every element must be a long-algebraic move, optionally with a promotion.
  constraint puzzles_solution_format
    check (array_to_string(solution, ' ') ~ '^[a-h][1-8][a-h][1-8][qrbn]?( [a-h][1-8][a-h][1-8][qrbn]?)*$'),
  constraint puzzles_fen_shape check (fen ~ '^[1-8pnbrqkPNBRQK/]+ [wb] ')
);

comment on table public.puzzles is
  'Tactical puzzle catalogue. Seeded from src/data/puzzles.js.';
comment on column public.puzzles.solution is
  'Long-algebraic plies. Even indices are the solver''s moves; odd indices are auto-played replies.';

create unique index puzzles_single_daily_idx on public.puzzles (is_daily) where is_daily;
create index puzzles_rating_idx on public.puzzles (rating) where is_published;
create index puzzles_tags_idx   on public.puzzles using gin (tags);

create trigger puzzles_set_updated_at
  before update on public.puzzles
  for each row execute function public.set_updated_at();


-- ── Classic games ──────────────────────────────────────────────────────────

create table public.classic_games (
  id            integer     primary key,
  white_player  text        not null,
  black_player  text        not null,
  white_rating  integer,
  black_rating  integer,
  event         text,
  played_year   smallint,
  result        public.game_result not null,
  opening_name  text,
  eco           text,
  description   text,
  pgn           text        not null,
  is_published  boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint classic_games_year_range check (played_year is null or played_year between 1400 and 2200),
  constraint classic_games_rating_range check (
    (white_rating is null or white_rating between 100 and 3500) and
    (black_rating is null or black_rating between 100 and 3500)
  )
);

comment on table public.classic_games is
  'Annotated master games. Seeded from src/data/classicGames.js.';

create index classic_games_year_idx   on public.classic_games (played_year desc) where is_published;
create index classic_games_eco_idx    on public.classic_games (eco)              where is_published;
create index classic_games_white_trgm on public.classic_games using gin (white_player extensions.gin_trgm_ops);
create index classic_games_black_trgm on public.classic_games using gin (black_player extensions.gin_trgm_ops);

create trigger classic_games_set_updated_at
  before update on public.classic_games
  for each row execute function public.set_updated_at();


-- ── Row level security ─────────────────────────────────────────────────────
-- Identical shape for all five catalogue tables: the world reads published
-- rows, admins read and write everything. Written out per table rather than
-- generated in a loop so `\d+` and a code review both show the real policy.

alter table public.openings                enable row level security;
alter table public.opening_variations      enable row level security;
alter table public.opening_variation_moves enable row level security;
alter table public.puzzles                 enable row level security;
alter table public.classic_games           enable row level security;

create policy "openings: read published"
  on public.openings for select to anon, authenticated
  using (is_published or public.is_admin());
create policy "openings: admin write"
  on public.openings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "opening_variations: read"
  on public.opening_variations for select to anon, authenticated
  using (exists (select 1 from public.openings o
                 where o.id = opening_id and (o.is_published or public.is_admin())));
create policy "opening_variations: admin write"
  on public.opening_variations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "opening_variation_moves: read"
  on public.opening_variation_moves for select to anon, authenticated
  using (exists (select 1
                 from public.opening_variations v
                 join public.openings o on o.id = v.opening_id
                 where v.id = variation_id and (o.is_published or public.is_admin())));
create policy "opening_variation_moves: admin write"
  on public.opening_variation_moves for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "puzzles: read published"
  on public.puzzles for select to anon, authenticated
  using (is_published or public.is_admin());
create policy "puzzles: admin write"
  on public.puzzles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "classic_games: read published"
  on public.classic_games for select to anon, authenticated
  using (is_published or public.is_admin());
create policy "classic_games: admin write"
  on public.classic_games for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.openings, public.opening_variations, public.opening_variation_moves,
                public.puzzles, public.classic_games
  to anon, authenticated;
grant insert, update, delete on public.openings, public.opening_variations,
                public.opening_variation_moves, public.puzzles, public.classic_games
  to authenticated;
