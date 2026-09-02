-- ═══════════════════════════════════════════════════════════════════════════
-- Economy behaviour
-- ═══════════════════════════════════════════════════════════════════════════
-- The anti-farming guarantee is the reason this schema has a backend, so it
-- gets tested against a real database rather than reasoned about.
-- ═══════════════════════════════════════════════════════════════════════════

begin;
select plan(16);

-- ── Fixtures ───────────────────────────────────────────────────────────────
-- Two users, created the way Supabase creates them, so the signup triggers run.

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-4111-a111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'alice@example.test', 'x', now(), now(), now(),
   '{"provider":"email"}', '{"username":"alice"}'),
  ('22222222-2222-4222-a222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'bob@example.test', 'x', now(), now(), now(),
   '{"provider":"email"}', '{"username":"bob"}');

-- ── Signup provisioning ────────────────────────────────────────────────────

select is(
  (select count(*)::integer from public.profiles
   where id = '11111111-1111-4111-a111-111111111111'),
  1, 'signup creates a profile'
);

select is(
  (select username::text from public.profiles
   where id = '11111111-1111-4111-a111-111111111111'),
  'alice', 'the requested username is used when it is free'
);

select is(
  (select count(*)::integer from public.wallets
   where user_id = '11111111-1111-4111-a111-111111111111'),
  1, 'signup creates a wallet'
);

select is(
  (select coins from public.wallets where user_id = '11111111-1111-4111-a111-111111111111'),
  0, 'a new wallet starts at zero'
);

-- ── The XP curve matches the client ────────────────────────────────────────
-- These are the exact boundaries in levelFromXP() (src/services/economy.js).
-- If the two ever disagree, a user's level changes when the backend is enabled.

select is(public.level_from_xp(0),     1,  'level 1 at 0 XP');
select is(public.level_from_xp(499),   1,  'still level 1 just below the threshold');
select is(public.level_from_xp(500),   2,  'level 2 at 500 XP');
select is(public.level_from_xp(14000), 11, 'level 11 at the top of the table');
select is(public.level_from_xp(16500), 12, 'past the table, every 2500 XP is a level');

-- ── Idempotent rewards ─────────────────────────────────────────────────────

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-a111-111111111111","role":"authenticated"}';

select is(
  (public.grant_reward('course_complete', 'kp-vs-k', 'Course completed') ->> 'granted')::boolean,
  true, 'the first grant succeeds'
);

select is(
  (public.grant_reward('course_complete', 'kp-vs-k', 'Course completed') ->> 'reason'),
  'already_claimed', 'the same (type, reference) cannot pay out twice'
);

reset role;

select is(
  (select count(*)::integer from public.coin_transactions
   where user_id = '11111111-1111-4111-a111-111111111111'
     and reward_type = 'course_complete'),
  1, 'only one ledger row exists after the replay'
);

select is(
  (select coins from public.wallets where user_id = '11111111-1111-4111-a111-111111111111'),
  (select coins from public.reward_rules where reward_type = 'course_complete'),
  'the wallet reflects exactly one payout'
);

-- ── Spending is gated server-side ──────────────────────────────────────────

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-a222-222222222222","role":"authenticated"}';

select is(
  (public.spend_coins('store1') ->> 'error'),
  'insufficient', 'a purchase beyond the balance is refused'
);

reset role;

select is(
  (select count(*)::integer from public.user_unlocks
   where user_id = '22222222-2222-4222-a222-222222222222'),
  0, 'a refused purchase unlocks nothing'
);

-- ── Ledger invariants hold under direct manipulation ───────────────────────

select throws_ok(
  $$
    insert into public.coin_transactions
      (user_id, reward_type, reference_id, coin_delta, xp_delta, balance_after)
    values
      ('11111111-1111-4111-a111-111111111111', 'course_complete', 'kp-vs-k', 999, 0, 999)
  $$,
  '23505',
  null,
  'the unique constraint rejects a duplicate award even when inserted directly'
);

select * from finish();
rollback;
