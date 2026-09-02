-- ═══════════════════════════════════════════════════════════════════════════
-- Row level security
-- ═══════════════════════════════════════════════════════════════════════════
-- Asserts isolation from the perspective the client actually uses: as the
-- `authenticated` role with a JWT, not as the table owner.
-- ═══════════════════════════════════════════════════════════════════════════

begin;
select plan(9);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('33333333-3333-4333-a333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'carol@example.test', 'x', now(), now(), now(),
   '{"provider":"email"}', '{"username":"carol"}'),
  ('44444444-4444-4444-a444-444444444444', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'dave@example.test', 'x', now(), now(), now(),
   '{"provider":"email"}', '{"username":"dave"}');

-- Carol records some progress.
insert into public.course_progress (user_id, course_id, chapter_index, furthest_index)
values ('33333333-3333-4333-a333-333333333333', 'kp-vs-k', 2, 2);

-- ── A user sees only their own rows ────────────────────────────────────────

set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-4333-a333-333333333333","role":"authenticated"}';

select is(
  (select count(*)::integer from public.course_progress),
  1, 'carol sees her own progress'
);

select is(
  (select count(*)::integer from public.wallets),
  1, 'carol sees exactly one wallet — her own'
);

set local request.jwt.claims = '{"sub":"44444444-4444-4444-a444-444444444444","role":"authenticated"}';

select is(
  (select count(*)::integer from public.course_progress),
  0, 'dave cannot see carol''s progress'
);

select throws_ok(
  $$
    insert into public.course_progress (user_id, course_id)
    values ('33333333-3333-4333-a333-333333333333', 'pins-skewers')
  $$,
  '42501',
  null,
  'dave cannot write a row owned by carol'
);

select is(
  (select count(*)::integer from public.coin_transactions),
  0, 'dave cannot read another user''s ledger'
);

-- ── The wallet is not client-writable ──────────────────────────────────────

select throws_ok(
  $$ update public.wallets set coins = 999999 $$,
  '42501',
  null,
  'a client cannot mint coins by updating its wallet'
);

-- ── Catalogue content is readable by anyone ────────────────────────────────

select ok(
  (select count(*) from public.openings) > 0,
  'an authenticated user can read the opening catalogue'
);

reset role;
set local role anon;

select ok(
  (select count(*) from public.puzzles) > 0,
  'an anonymous visitor can read published puzzles'
);

select is(
  (select count(*)::integer from public.profiles),
  0, 'an anonymous visitor sees no private profiles'
);

reset role;

select * from finish();
rollback;
