-- ═══════════════════════════════════════════════════════════════════════════
-- 0500 · ProphyCoins economy
-- ═══════════════════════════════════════════════════════════════════════════
-- The single most important reason this app has a backend.
--
-- In the local-storage build, "a reward pays out once" is enforced by a check
-- in JavaScript against a map the user can edit. Here it is a UNIQUE index on
-- an append-only ledger, and balances are maintained by a trigger rather than
-- written by the client. A user cannot mint coins by replaying a request,
-- editing storage, or calling the API directly:
--
--   · coin_transactions is the source of truth. It is append-only for clients
--     (no UPDATE/DELETE policy at all).
--   · wallets is derived. It has no INSERT/UPDATE policy — only the ledger
--     trigger writes it.
--   · Amounts come from reward_rules server-side. The client names a reward
--     type; it never states a price.
-- ═══════════════════════════════════════════════════════════════════════════


create table public.wallets (
  user_id         uuid        primary key references auth.users (id) on delete cascade,
  coins           integer     not null default 0,
  xp              integer     not null default 0,
  lifetime_earned integer     not null default 0,
  total_spent     integer     not null default 0,
  updated_at      timestamptz not null default now(),

  -- A negative balance would mean the ledger and the trigger disagree. Fail
  -- loudly rather than let it persist.
  constraint wallets_coins_non_negative check (coins >= 0),
  constraint wallets_xp_non_negative check (xp >= 0),
  constraint wallets_totals_non_negative check (lifetime_earned >= 0 and total_spent >= 0)
);

comment on table public.wallets is
  'Derived balance. Written only by the coin_transactions trigger — never by a client.';


create table public.coin_transactions (
  id             uuid        primary key default extensions.gen_random_uuid(),
  user_id        uuid        not null references auth.users (id) on delete cascade,

  -- What earned or spent the coins: 'course_complete', 'puzzle_solved',
  -- 'store_purchase', … Free text rather than an enum so a new reward type is
  -- a row in reward_rules, not a migration.
  reward_type    text        not null,
  -- The thing it was for: a course id, a puzzle id, a date. Together with
  -- reward_type this is the idempotency key.
  reference_id   text        not null,

  coin_delta     integer     not null,
  xp_delta       integer     not null default 0,
  reason         text,
  balance_after  integer     not null,
  created_at     timestamptz not null default now(),

  -- THE anti-farming guarantee. Calling grant_reward twice for the same
  -- (user, type, reference) raises unique_violation, which the function
  -- swallows and reports as "already claimed".
  constraint coin_transactions_idempotent unique (user_id, reward_type, reference_id),
  constraint coin_transactions_xp_non_negative check (xp_delta >= 0),
  constraint coin_transactions_balance_non_negative check (balance_after >= 0)
);

comment on table public.coin_transactions is
  'Append-only ledger. UNIQUE (user_id, reward_type, reference_id) is what makes every reward pay out at most once.';
comment on constraint coin_transactions_idempotent on public.coin_transactions is
  'Idempotency key. Do not drop: it is the only thing preventing refresh-farming.';

create index coin_transactions_user_recent_idx
  on public.coin_transactions (user_id, created_at desc);
create index coin_transactions_type_idx
  on public.coin_transactions (user_id, reward_type);


create table public.user_unlocks (
  user_id       uuid        not null references auth.users (id) on delete cascade,
  store_item_id text        not null references public.store_items (id) on delete cascade,
  unlocked_at   timestamptz not null default now(),

  primary key (user_id, store_item_id)
);

comment on table public.user_unlocks is 'Store items the user owns. Written by spend_coins() only.';


create table public.user_achievements (
  user_id        uuid        not null references auth.users (id) on delete cascade,
  achievement_id text        not null references public.achievements (id) on delete cascade,
  unlocked_at    timestamptz not null default now(),

  primary key (user_id, achievement_id)
);

comment on table public.user_achievements is 'Written by check_achievements() only.';


create table public.weekly_missions (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  week_start  date        not null,
  progress    jsonb       not null default '{}'::jsonb,
  is_claimed  boolean     not null default false,
  claimed_at  timestamptz,
  updated_at  timestamptz not null default now(),

  primary key (user_id, week_start),
  constraint weekly_missions_progress_is_object check (jsonb_typeof(progress) = 'object'),
  constraint weekly_missions_claim_consistent
    check ((is_claimed and claimed_at is not null) or (not is_claimed and claimed_at is null))
);

create trigger weekly_missions_set_updated_at
  before update on public.weekly_missions
  for each row execute function public.set_updated_at();


-- ── Balance maintenance ────────────────────────────────────────────────────

create or replace function public.apply_transaction_to_wallet()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.wallets as w (user_id, coins, xp, lifetime_earned, total_spent)
  values (
    new.user_id,
    greatest(new.coin_delta, 0),
    new.xp_delta,
    greatest(new.coin_delta, 0),
    greatest(-new.coin_delta, 0)
  )
  on conflict (user_id) do update set
    coins           = w.coins + new.coin_delta,
    xp              = w.xp + new.xp_delta,
    lifetime_earned = w.lifetime_earned + greatest(new.coin_delta, 0),
    total_spent     = w.total_spent + greatest(-new.coin_delta, 0),
    updated_at      = now();

  return new;
end;
$$;

comment on function public.apply_transaction_to_wallet() is
  'AFTER INSERT on coin_transactions: folds the delta into the derived wallet balance.';

create trigger coin_transactions_apply_to_wallet
  after insert on public.coin_transactions
  for each row execute function public.apply_transaction_to_wallet();


-- ── XP curve ───────────────────────────────────────────────────────────────
-- Mirrors levelFromXP() in src/services/economy.js. Kept IMMUTABLE so it can
-- be used in indexes and generated columns later.

create or replace function public.level_from_xp(total_xp integer)
returns integer
language plpgsql
immutable
as $$
declare
  thresholds constant integer[] := array[0, 500, 1200, 2100, 3200, 4500, 6000, 7700, 9600, 11700, 14000];
  level      integer := 1;
  i          integer;
begin
  if total_xp is null or total_xp < 0 then
    return 1;
  end if;

  for i in 2 .. array_length(thresholds, 1) loop
    if total_xp >= thresholds[i] then
      level := i;
    else
      exit;
    end if;
  end loop;

  -- Past the table, every 2,500 XP is another level.
  if total_xp >= thresholds[array_length(thresholds, 1)] then
    level := array_length(thresholds, 1)
           + floor((total_xp - thresholds[array_length(thresholds, 1)]) / 2500.0)::integer;
  end if;

  return level;
end;
$$;

comment on function public.level_from_xp(integer) is
  'XP to level. Must stay in step with levelFromXP() in src/services/economy.js — covered by supabase/tests/economy.test.sql.';


-- ── Achievements ───────────────────────────────────────────────────────────

create or replace function public.check_achievements(target_user uuid)
returns setof text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  rec       record;
  wallet    public.wallets%rowtype;
  is_earned boolean;
  measured  integer;
begin
  select * into wallet from public.wallets where user_id = target_user;
  if not found then
    return;
  end if;

  for rec in
    select a.id, a.criteria
    from public.achievements a
    where not exists (
      select 1 from public.user_achievements ua
      where ua.user_id = target_user and ua.achievement_id = a.id
    )
  loop
    is_earned := false;

    case rec.criteria ->> 'kind'
      when 'transaction_count' then
        -- An optional `reference` narrows the match to one specific award,
        -- which is how "reach a 7-day streak" differs from "any streak award".
        select count(*) into measured
        from public.coin_transactions t
        where t.user_id = target_user
          and t.reward_type = rec.criteria ->> 'type'
          and (
            not (rec.criteria ? 'reference')
            or t.reference_id = rec.criteria ->> 'reference'
          );
        is_earned := measured >= coalesce((rec.criteria ->> 'target')::integer, 1);

      when 'lifetime_earned' then
        is_earned := wallet.lifetime_earned >= coalesce((rec.criteria ->> 'target')::integer, 0);

      when 'unlock_count' then
        select count(*) into measured
        from public.user_unlocks u where u.user_id = target_user;
        is_earned := measured >= coalesce((rec.criteria ->> 'target')::integer, 1);

      when 'level' then
        is_earned := public.level_from_xp(wallet.xp) >= coalesce((rec.criteria ->> 'target')::integer, 1);

      else
        -- Unknown criteria kind: never award. A typo in seed data must not
        -- hand out badges.
        is_earned := false;
    end case;

    if is_earned then
      insert into public.user_achievements (user_id, achievement_id)
      values (target_user, rec.id)
      on conflict do nothing;
      return next rec.id;
    end if;
  end loop;
end;
$$;

comment on function public.check_achievements(uuid) is
  'Evaluates unclaimed achievements for a user and awards any that now qualify. Returns the newly awarded ids.';


-- ── Reward grant ───────────────────────────────────────────────────────────
-- The only supported way for a client to earn coins.

create or replace function public.grant_reward(
  p_reward_type  text,
  p_reference_id text,
  p_reason       text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller        uuid := (select auth.uid());
  rule          public.reward_rules%rowtype;
  previous_xp   integer := 0;
  new_balance   integer;
  new_xp        integer;
  tx            public.coin_transactions%rowtype;
  awarded       text[];
begin
  if caller is null then
    raise exception 'grant_reward requires an authenticated user'
      using errcode = '42501';
  end if;

  if p_reference_id is null or length(trim(p_reference_id)) = 0 then
    raise exception 'grant_reward requires a reference id' using errcode = '22023';
  end if;

  select * into rule from public.reward_rules where reward_type = p_reward_type;
  if not found then
    raise exception 'unknown reward type: %', p_reward_type using errcode = '22023';
  end if;
  if not rule.is_enabled then
    return jsonb_build_object('granted', false, 'reason', 'reward_disabled');
  end if;

  -- Lock the wallet row so two concurrent grants cannot both read the same
  -- starting balance. The ledger's unique index handles replay; this handles
  -- interleaving.
  select coins, xp into new_balance, previous_xp
  from public.wallets where user_id = caller for update;

  if not found then
    insert into public.wallets (user_id) values (caller)
    on conflict (user_id) do nothing;
    new_balance := 0;
    previous_xp := 0;
  end if;

  begin
    insert into public.coin_transactions (
      user_id, reward_type, reference_id, coin_delta, xp_delta, reason, balance_after
    )
    values (
      caller, p_reward_type, p_reference_id, rule.coins, rule.xp,
      coalesce(p_reason, rule.label), new_balance + rule.coins
    )
    returning * into tx;
  exception
    when unique_violation then
      -- Already claimed. Not an error: the completion screen may legitimately
      -- re-render, and the caller wants a definite answer either way.
      return jsonb_build_object('granted', false, 'reason', 'already_claimed');
  end;

  select coins, xp into new_balance, new_xp from public.wallets where user_id = caller;
  select coalesce(array_agg(a), '{}'::text[]) into awarded from public.check_achievements(caller) a;

  return jsonb_build_object(
    'granted',          true,
    'transactionId',    tx.id,
    'coins',            rule.coins,
    'xp',               rule.xp,
    'balance',          new_balance,
    'totalXp',          new_xp,
    'previousLevel',    public.level_from_xp(previous_xp),
    'newLevel',         public.level_from_xp(new_xp),
    'leveledUp',        public.level_from_xp(new_xp) > public.level_from_xp(previous_xp),
    'newAchievements',  to_jsonb(awarded)
  );
end;
$$;

comment on function public.grant_reward(text, text, text) is
  'Idempotent reward grant. Amounts come from reward_rules; the caller never states a price.';


-- ── Spend ──────────────────────────────────────────────────────────────────

create or replace function public.spend_coins(
  p_store_item_id text,
  p_reason        text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller      uuid := (select auth.uid());
  item        public.store_items%rowtype;
  balance     integer;
  awarded     text[];
begin
  if caller is null then
    raise exception 'spend_coins requires an authenticated user' using errcode = '42501';
  end if;

  select * into item
  from public.store_items
  where id = p_store_item_id and is_published;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'unknown_item');
  end if;

  if exists (select 1 from public.user_unlocks u
             where u.user_id = caller and u.store_item_id = item.id) then
    return jsonb_build_object('ok', false, 'error', 'already_owned');
  end if;

  -- Lock before checking: without FOR UPDATE, two concurrent purchases could
  -- both see a sufficient balance and overdraw.
  select coins into balance from public.wallets where user_id = caller for update;
  if not found then
    insert into public.wallets (user_id) values (caller) on conflict (user_id) do nothing;
    balance := 0;
  end if;

  if balance < item.price_coins then
    return jsonb_build_object(
      'ok', false, 'error', 'insufficient',
      'need', item.price_coins - balance
    );
  end if;

  insert into public.coin_transactions (
    user_id, reward_type, reference_id, coin_delta, xp_delta, reason, balance_after
  )
  values (
    caller, 'store_purchase', item.id, -item.price_coins, 0,
    coalesce(p_reason, 'Purchased ' || item.title), balance - item.price_coins
  );

  insert into public.user_unlocks (user_id, store_item_id) values (caller, item.id);

  select coalesce(array_agg(a), '{}'::text[]) into awarded from public.check_achievements(caller) a;
  select coins into balance from public.wallets where user_id = caller;

  return jsonb_build_object(
    'ok', true, 'balance', balance, 'itemId', item.id,
    'newAchievements', to_jsonb(awarded)
  );
end;
$$;

comment on function public.spend_coins(text, text) is
  'Server-gated purchase: price, ownership and balance are all checked here, never client-side.';


-- ── Wallet provisioning ────────────────────────────────────────────────────
-- Separate trigger from handle_new_user() so the two concerns can fail and be
-- reasoned about independently.

create or replace function public.handle_new_user_wallet()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.puzzle_progress (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.daily_question_state (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.coach_state (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_wallet
  after insert on auth.users
  for each row execute function public.handle_new_user_wallet();


-- ── Row level security ─────────────────────────────────────────────────────

alter table public.wallets           enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.user_unlocks      enable row level security;
alter table public.user_achievements enable row level security;
alter table public.weekly_missions   enable row level security;

-- Read-only to their owner. The absence of INSERT/UPDATE/DELETE policies is
-- deliberate and is the security property: these tables are written only by
-- the SECURITY DEFINER functions above.
create policy "wallets: read own"
  on public.wallets for select to authenticated
  using (user_id = (select auth.uid()));

create policy "coin_transactions: read own"
  on public.coin_transactions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_unlocks: read own"
  on public.user_unlocks for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_achievements: read own"
  on public.user_achievements for select to authenticated
  using (user_id = (select auth.uid()));

-- Weekly mission progress is client-tracked, so it is writable by its owner.
-- The payout still goes through grant_reward().
create policy "weekly_missions: read own"
  on public.weekly_missions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "weekly_missions: write own"
  on public.weekly_missions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select on public.wallets, public.coin_transactions,
                public.user_unlocks, public.user_achievements
  to authenticated;
grant select, insert, update, delete on public.weekly_missions to authenticated;

grant execute on function public.grant_reward(text, text, text) to authenticated;
grant execute on function public.spend_coins(text, text) to authenticated;
grant execute on function public.level_from_xp(integer) to anon, authenticated;
-- check_achievements is called *by* the two functions above; a client has no
-- reason to invoke it directly.
revoke execute on function public.check_achievements(uuid) from public, anon, authenticated;
