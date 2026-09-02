-- ═══════════════════════════════════════════════════════════════════════════
-- 0800 · Views and remaining RPCs
-- ═══════════════════════════════════════════════════════════════════════════
-- Read models the client would otherwise assemble with several round trips,
-- and the write paths whose rules must not live on the client.
--
-- Every view is created WITH (security_invoker = true). Without it a view runs
-- as its owner and silently bypasses the RLS of the tables underneath — the
-- single most common way a Supabase schema leaks data.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── Derived stats ──────────────────────────────────────────────────────────

create view public.user_topic_stats
with (security_invoker = true) as
  select
    a.user_id,
    a.topic,
    count(*)::integer                                   as answered,
    count(*) filter (where a.is_correct)::integer       as correct,
    round(avg(a.seconds_taken))::integer                as avg_seconds,
    round(100.0 * count(*) filter (where a.is_correct) / nullif(count(*), 0))::integer as accuracy_pct
  from public.daily_question_answers a
  group by a.user_id, a.topic;

comment on view public.user_topic_stats is
  'Per-topic accuracy, derived from the answer log rather than stored and kept in sync.';


create view public.opening_mastery
with (security_invoker = true) as
  select
    p.user_id,
    v.opening_id,
    count(*)::integer                                          as tracked_variations,
    count(*) filter (where p.status in ('Good', 'Strong', 'Mastered'))::integer as strong_variations,
    count(*) filter (where p.status = 'Mastered')::integer      as mastered_variations,
    round(
      100.0 * sum(
        case p.status
          when 'New' then 0 when 'Learning' then 0.25 when 'Good' then 0.6
          when 'Strong' then 0.85 when 'Mastered' then 1 end
      ) / nullif(count(*), 0)
    )::integer as mastery_pct
  from public.opening_progress p
  join public.opening_variations v on v.id = p.variation_id
  group by p.user_id, v.opening_id;

comment on view public.opening_mastery is
  'Weighted mastery percentage per opening, matching getOpeningProgress() on the client.';


create view public.due_variations
with (security_invoker = true) as
  select
    p.user_id,
    p.variation_id,
    v.opening_id,
    o.name    as opening_name,
    v.name    as variation_name,
    p.status,
    p.due_on
  from public.opening_progress p
  join public.opening_variations v on v.id = p.variation_id
  join public.openings o on o.id = v.opening_id
  where p.due_on is not null and p.due_on <= current_date
  order by p.due_on, v.sort_order;

comment on view public.due_variations is
  'The drill queue: everything due today or overdue, oldest first.';


-- Public participant counts without exposing who registered. The view is
-- security_invoker, so it still cannot read rows the caller may not see —
-- which is why the count comes from a SECURITY DEFINER function instead.
create or replace function public.event_participant_count(target_event uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*)::integer
  from public.event_registrations r
  where r.event_id = target_event;
$$;

comment on function public.event_participant_count(uuid) is
  'Aggregate registration count. SECURITY DEFINER so a count is public while the roster is not.';


create view public.events_with_counts
with (security_invoker = true) as
  select
    e.*,
    public.event_participant_count(e.id) as participant_count
  from public.events e;

comment on view public.events_with_counts is
  'Events plus a participant count. Row visibility still follows the events RLS policy.';


-- Opt-in leaderboard: only users who made their profile public appear.
create view public.leaderboard
with (security_invoker = true) as
  select
    p.id                       as user_id,
    p.username,
    p.avatar,
    w.xp,
    public.level_from_xp(w.xp) as level,
    pp.puzzle_rating,
    pp.longest_streak
  from public.profiles p
  join public.wallets w on w.user_id = p.id
  left join public.puzzle_progress pp on pp.user_id = p.id
  where coalesce((p.settings -> 'privacy' ->> 'publicProfile')::boolean, false)
  order by w.xp desc;

comment on view public.leaderboard is
  'Opt-in only. A user appears here exactly when settings.privacy.publicProfile is true.';


-- ── Spaced repetition ──────────────────────────────────────────────────────
-- The SM-2-lite ladder, moved server-side so the schedule cannot be edited by
-- the client. Mirrors nextSrStatus()/SR_INTERVALS in openingProgress.js.

create or replace function public.next_sr_status(current_status public.sr_status, was_correct boolean)
returns public.sr_status
language sql
immutable
as $$
  select case
    when was_correct then
      case current_status
        when 'New' then 'Learning'::public.sr_status
        when 'Learning' then 'Good'::public.sr_status
        when 'Good' then 'Strong'::public.sr_status
        else 'Mastered'::public.sr_status
      end
    else
      -- A miss drops one rung, never below Learning: a line you have seen is
      -- not new again.
      case current_status
        when 'Mastered' then 'Strong'::public.sr_status
        when 'Strong' then 'Good'::public.sr_status
        when 'Good' then 'Learning'::public.sr_status
        else 'Learning'::public.sr_status
      end
  end;
$$;


create or replace function public.sr_interval_days(status public.sr_status)
returns integer
language sql
immutable
as $$
  select case status
    when 'New' then 0 when 'Learning' then 1 when 'Good' then 3
    when 'Strong' then 7 when 'Mastered' then 21 end;
$$;


create or replace function public.record_variation_attempt(
  p_variation_id text,
  p_was_correct  boolean
)
returns public.opening_progress
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller     uuid := (select auth.uid());
  next_state public.sr_status;
  result     public.opening_progress;
begin
  if caller is null then
    raise exception 'record_variation_attempt requires an authenticated user' using errcode = '42501';
  end if;

  if not exists (select 1 from public.opening_variations where id = p_variation_id) then
    raise exception 'unknown variation: %', p_variation_id using errcode = '23503';
  end if;

  insert into public.opening_progress as op (
    user_id, variation_id, status, repetitions, correct_count, attempt_count, last_seen_on, due_on
  )
  values (
    caller, p_variation_id,
    public.next_sr_status('New', p_was_correct),
    1,
    case when p_was_correct then 1 else 0 end,
    1,
    current_date,
    current_date + public.sr_interval_days(public.next_sr_status('New', p_was_correct))
  )
  on conflict (user_id, variation_id) do update set
    status        = public.next_sr_status(op.status, p_was_correct),
    repetitions   = op.repetitions + 1,
    correct_count = op.correct_count + case when p_was_correct then 1 else 0 end,
    attempt_count = op.attempt_count + 1,
    last_seen_on  = current_date,
    due_on        = current_date
                    + public.sr_interval_days(public.next_sr_status(op.status, p_was_correct))
  returning * into result;

  return result;
end;
$$;

comment on function public.record_variation_attempt(text, boolean) is
  'Advances the SM-2-lite schedule for one variation. The interval table lives here, not on the client.';


-- ── Puzzle scoring ─────────────────────────────────────────────────────────
-- Elo update computed server-side: the client reports what happened, not what
-- it should be worth.

create or replace function public.record_puzzle_attempt(
  p_puzzle_id   text,
  p_solved      boolean,
  p_hint_used   boolean default false,
  p_duration_ms integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller        uuid := (select auth.uid());
  puzzle        public.puzzles%rowtype;
  progress      public.puzzle_progress%rowtype;
  expected      numeric;
  delta         integer;
  already_solved boolean;
  new_rating    integer;
  new_streak    integer;
begin
  if caller is null then
    raise exception 'record_puzzle_attempt requires an authenticated user' using errcode = '42501';
  end if;

  select * into puzzle from public.puzzles where id = p_puzzle_id and is_published;
  if not found then
    raise exception 'unknown puzzle: %', p_puzzle_id using errcode = '23503';
  end if;

  select * into progress from public.puzzle_progress where user_id = caller for update;
  if not found then
    insert into public.puzzle_progress (user_id) values (caller)
    on conflict (user_id) do nothing;
    select * into progress from public.puzzle_progress where user_id = caller for update;
  end if;

  already_solved := exists (
    select 1 from public.puzzle_attempts a
    where a.user_id = caller and a.puzzle_id = p_puzzle_id and a.solved
  );

  -- Standard Elo with K = 32. A hint halves a win; a loss is capped at -2 so a
  -- hard puzzle never wipes out a session.
  expected := 1.0 / (1.0 + power(10.0, (puzzle.rating - progress.puzzle_rating) / 400.0));
  delta := round(32 * ((case when p_solved then 1 else 0 end) - expected));
  if p_solved and p_hint_used then
    delta := greatest(1, round(delta * 0.5));
  elsif not p_solved then
    delta := least(-2, delta);
  end if;

  -- Rating only moves the first time a puzzle is solved; re-solving a known
  -- puzzle is practice, not a rated result.
  if already_solved then
    delta := 0;
  end if;

  insert into public.puzzle_attempts (user_id, puzzle_id, solved, hint_used, rating_delta, duration_ms)
  values (caller, p_puzzle_id, p_solved, p_hint_used, delta, p_duration_ms)
  on conflict do nothing;

  new_rating := greatest(400, least(3000, progress.puzzle_rating + delta));

  new_streak := progress.current_streak;
  if p_solved then
    new_streak := case
      when progress.last_solved_on = current_date then progress.current_streak
      when progress.last_solved_on = current_date - 1 then progress.current_streak + 1
      else 1
    end;
  end if;

  update public.puzzle_progress set
    puzzle_rating  = new_rating,
    current_streak = new_streak,
    longest_streak = greatest(longest_streak, new_streak),
    last_solved_on = case when p_solved then current_date else last_solved_on end,
    daily_puzzle_solved_on =
      case when p_solved and puzzle.is_daily then current_date else daily_puzzle_solved_on end
  where user_id = caller;

  return jsonb_build_object(
    'ratingDelta',   delta,
    'rating',        new_rating,
    'streak',        new_streak,
    'alreadySolved', already_solved
  );
end;
$$;

comment on function public.record_puzzle_attempt(text, boolean, boolean, integer) is
  'Records an attempt and computes the Elo change server-side. The client reports the outcome, not the reward.';


-- ── Wiki search ────────────────────────────────────────────────────────────

create or replace function public.search_wiki(query text, max_results integer default 20)
returns setof public.wiki_articles
language sql
stable
set search_path = public, pg_temp
as $$
  select a.*
  from public.wiki_articles a
  where a.status = 'published'
    and (
      to_tsvector('english', a.title || ' ' || coalesce(a.short_description, '') || ' ' || a.content)
        @@ plainto_tsquery('english', query)
      or a.title ilike '%' || query || '%'
    )
  order by
    ts_rank(
      to_tsvector('english', a.title || ' ' || coalesce(a.short_description, '') || ' ' || a.content),
      plainto_tsquery('english', query)
    ) desc,
    a.view_count desc
  limit greatest(1, least(coalesce(max_results, 20), 100));
$$;

comment on function public.search_wiki(text, integer) is
  'Full-text wiki search. Not SECURITY DEFINER, so the caller''s RLS still applies.';


-- ── Grants ─────────────────────────────────────────────────────────────────

grant select on
  public.user_topic_stats, public.opening_mastery, public.due_variations,
  public.events_with_counts, public.leaderboard
  to anon, authenticated;

grant execute on function public.next_sr_status(public.sr_status, boolean) to authenticated;
grant execute on function public.sr_interval_days(public.sr_status) to authenticated;
grant execute on function public.record_variation_attempt(text, boolean) to authenticated;
grant execute on function public.record_puzzle_attempt(text, boolean, boolean, integer) to authenticated;
grant execute on function public.event_participant_count(uuid) to anon, authenticated;
grant execute on function public.search_wiki(text, integer) to anon, authenticated;
