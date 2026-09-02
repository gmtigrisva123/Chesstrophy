-- ═══════════════════════════════════════════════════════════════════════════
-- 0100 · Profiles
-- ═══════════════════════════════════════════════════════════════════════════
-- One row per auth.users row, created by a trigger so a profile can never be
-- missing. Mirrors defaultProfile() in src/services/profile.js.
-- ═══════════════════════════════════════════════════════════════════════════

create table public.profiles (
  id                  uuid        primary key references auth.users (id) on delete cascade,

  -- Identity. `username` is citext + unique so "Magnus" and "magnus" cannot
  -- both exist; the length and charset rules match the onboarding validator.
  username            extensions.citext not null,
  display_name        text,
  bio                 text,
  avatar              text        not null default '♞',

  -- Linked accounts, for importing games later. Not verified — they are a
  -- label the user typed, and nothing grants access based on them.
  chesscom_username   text,
  lichess_username    text,

  -- Onboarding answers (see src/data/onboarding.js).
  chess_level         text,
  improvement_areas   text[]      not null default '{}',
  daily_training_time text,
  onboarding_completed boolean    not null default false,
  is_guest            boolean     not null default false,

  -- Presentation preference. 'system' resolves against prefers-color-scheme
  -- on the client; see src/hooks/useThemeMode.js.
  theme_mode          text        not null default 'dark',

  -- Notification/privacy/language preferences. JSONB because this is a bag of
  -- client-only toggles that changes shape with the UI and is never queried
  -- by the server — the exact case JSONB is for.
  settings            jsonb       not null default jsonb_build_object(
                                    'notifications', jsonb_build_object(
                                      'rewards', true, 'streakReminders', true, 'weeklyMissions', true),
                                    'privacy', jsonb_build_object('publicProfile', false),
                                    'language', 'en'
                                  ),

  -- Client-side UI state that must survive a device change.
  dismissed_onboarding boolean    not null default false,
  has_seen_landing     boolean    not null default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint profiles_username_format
    check (length(username) between 3 and 24 and username ~ '^[A-Za-z0-9_.-]+$'),
  constraint profiles_theme_mode_valid
    check (theme_mode in ('light', 'dark', 'system')),
  constraint profiles_bio_length
    check (bio is null or length(bio) <= 280),
  constraint profiles_settings_is_object
    check (jsonb_typeof(settings) = 'object')
);

comment on table public.profiles is
  'Public-facing user profile. One row per auth user, created by handle_new_user().';
comment on column public.profiles.settings is
  'Client preference bag (notifications, privacy, language). Never read server-side.';
comment on column public.profiles.is_guest is
  'True for anonymous sign-ins. Their data is real and secured identically; the flag only drives UI copy.';

create unique index profiles_username_key on public.profiles (username);
-- Supports the "is this username taken?" lookup during onboarding, and
-- prefix search on the member directory.
create index profiles_username_trgm_idx on public.profiles using gin ((username::text) extensions.gin_trgm_ops);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- A profile is visible to its owner, to admins, and to everyone else only
-- when the user has opted into a public profile.
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: read public"
  on public.profiles for select to anon, authenticated
  using (coalesce((settings -> 'privacy' ->> 'publicProfile')::boolean, false));

create policy "profiles: read all as admin"
  on public.profiles for select to authenticated
  using (public.is_admin());

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No INSERT policy on purpose: rows come from handle_new_user() only, so a
-- client cannot create a profile for a user id it does not own.
-- No DELETE policy on purpose: deleting the auth user cascades.

grant select, update on public.profiles to authenticated;
grant select on public.profiles to anon;


-- ── Provisioning ───────────────────────────────────────────────────────────
-- Runs inside the signup transaction. If this raises, the signup is rolled
-- back — which is correct: a user without a profile would break every screen.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  candidate  text;
  suffix     integer := 0;
begin
  -- Prefer the name supplied at signup, fall back to the email local part,
  -- then to a generic name. Anonymous sign-ins have neither.
  candidate := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'player'
  );

  -- Normalise to the charset the CHECK constraint allows.
  candidate := regexp_replace(candidate, '[^A-Za-z0-9_.-]', '', 'g');
  if length(candidate) < 3 then
    candidate := 'player';
  end if;
  candidate := left(candidate, 20);

  -- Usernames are unique; append a counter rather than failing the signup.
  while exists (select 1 from public.profiles p where p.username = candidate::extensions.citext) loop
    suffix := suffix + 1;
    candidate := left(regexp_replace(candidate, '[0-9]+$', ''), 16) || suffix::text;
  end loop;

  insert into public.profiles (id, username, is_guest)
  values (
    new.id,
    candidate::extensions.citext,
    -- Read through to_jsonb so this works whether or not the running Supabase
    -- version has the is_anonymous column.
    coalesce((to_jsonb(new) ->> 'is_anonymous')::boolean, false)
  );

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'AFTER INSERT on auth.users: provisions the profile (and, via 0500, the wallet).';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
