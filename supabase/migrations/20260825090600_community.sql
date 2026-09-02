-- ═══════════════════════════════════════════════════════════════════════════
-- 0600 · Community content — ChessFlix, submitted games, view counting
-- ═══════════════════════════════════════════════════════════════════════════
-- User-generated content. The permission model that ARCHITECTURE.md lists as a
-- known limitation ("ChessFlix permission checks are client-side") is resolved
-- here: posting rights are a row in creator_permissions that only an admin can
-- write, and the RLS policy — not the UI — is what enforces it.
-- ═══════════════════════════════════════════════════════════════════════════


create table public.creator_permissions (
  user_id     uuid        primary key references auth.users (id) on delete cascade,
  can_post    boolean     not null default true,
  granted_at  timestamptz not null default now(),
  granted_by  uuid        references auth.users (id) on delete set null,
  note        text
);

comment on table public.creator_permissions is
  'ChessFlix posting rights. Like user_roles, it has no client write policy — only an admin may grant.';

create or replace function public.can_post_chessflix()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.creator_permissions cp
    where cp.user_id = (select auth.uid()) and cp.can_post
  ) or public.is_admin();
$$;

comment on function public.can_post_chessflix() is
  'Server-side answer to "may I post?". Replaces the client-side check in src/services/chessflix.js.';


create table public.chessflix_posts (
  id            uuid        primary key default extensions.gen_random_uuid(),
  creator_id    uuid        not null references auth.users (id) on delete cascade,
  title         text        not null,
  description   text        not null,
  media_type    text        not null,
  media_url     text        not null,
  thumbnail_url text,
  category      text,
  status        public.publication_status not null default 'pending',
  is_featured   boolean     not null default false,
  view_count    integer     not null default 0,
  moderated_by  uuid        references auth.users (id) on delete set null,
  moderated_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint chessflix_posts_media_type_valid check (media_type in ('video', 'image')),
  constraint chessflix_posts_title_length check (length(title) between 3 and 140),
  constraint chessflix_posts_description_length check (length(description) between 3 and 2000),
  -- Videos are hosted links; images are uploaded to Storage. Either way the
  -- value must be a URL we would actually render, not a javascript: payload.
  constraint chessflix_posts_media_url_scheme check (media_url ~* '^https?://'),
  constraint chessflix_posts_view_count_positive check (view_count >= 0)
);

comment on table public.chessflix_posts is
  'Community video/image posts. `status` is the moderation gate; only admins may change it.';

create index chessflix_posts_published_idx on public.chessflix_posts (created_at desc)
  where status = 'published';
create index chessflix_posts_creator_idx   on public.chessflix_posts (creator_id, created_at desc);
create index chessflix_posts_category_idx  on public.chessflix_posts (category)
  where status = 'published';

create trigger chessflix_posts_set_updated_at
  before update on public.chessflix_posts
  for each row execute function public.set_updated_at();


create table public.community_games (
  id           uuid        primary key default extensions.gen_random_uuid(),
  submitter_id uuid        not null references auth.users (id) on delete cascade,
  player_name  text        not null,
  opponent_name text,
  player_rating integer,
  event        text,
  played_on    date,
  result       public.game_result,
  pgn          text        not null,
  description  text,
  status       public.publication_status not null default 'published',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint community_games_pgn_length check (length(pgn) between 10 and 20000),
  constraint community_games_rating_range
    check (player_rating is null or player_rating between 100 and 3500)
);

comment on table public.community_games is 'Games submitted by members for review.';

create index community_games_recent_idx on public.community_games (created_at desc)
  where status = 'published';

create trigger community_games_set_updated_at
  before update on public.community_games
  for each row execute function public.set_updated_at();


-- ── De-duplicated view counting ────────────────────────────────────────────
-- The local build counted a view once per browser session via sessionStorage.
-- Here it is once per user per item, enforced by the primary key, and the
-- counter is bumped by a trigger so a client cannot inflate it.

create table public.content_views (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  content_kind text        not null,
  content_id   text        not null,
  viewed_at    timestamptz not null default now(),

  primary key (user_id, content_kind, content_id),
  constraint content_views_kind_valid check (content_kind in ('chessflix', 'wiki_article'))
);

comment on table public.content_views is
  'One row per user per item. The PK is what makes a refresh not re-count.';

create or replace function public.increment_view_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.content_kind = 'chessflix' then
    update public.chessflix_posts
      set view_count = view_count + 1
      where id = new.content_id::uuid;
  elsif new.content_kind = 'wiki_article' then
    update public.wiki_articles
      set view_count = view_count + 1
      where id = new.content_id;
  end if;
  return new;
end;
$$;

comment on function public.increment_view_count() is
  'AFTER INSERT on content_views: bumps the counter. Runs once per (user, item) because of the PK.';

-- The trigger itself is created in 0700, after wiki_articles exists.


-- ── Row level security ─────────────────────────────────────────────────────

alter table public.creator_permissions enable row level security;
alter table public.chessflix_posts     enable row level security;
alter table public.community_games     enable row level security;
alter table public.content_views       enable row level security;

create policy "creator_permissions: read own"
  on public.creator_permissions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "creator_permissions: admin write"
  on public.creator_permissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Anyone may read published posts; a creator may always read their own,
-- including while pending.
create policy "chessflix_posts: read published"
  on public.chessflix_posts for select to anon, authenticated
  using (status = 'published');
create policy "chessflix_posts: read own"
  on public.chessflix_posts for select to authenticated
  using (creator_id = (select auth.uid()) or public.is_admin());

-- Posting requires a permission row. The WITH CHECK also pins creator_id to
-- the caller, so a permitted creator cannot post as someone else, and pins
-- status to 'pending' so nobody can self-publish.
create policy "chessflix_posts: insert when permitted"
  on public.chessflix_posts for insert to authenticated
  with check (
    creator_id = (select auth.uid())
    and public.can_post_chessflix()
    and status = 'pending'
  );

-- A creator may edit their own copy, but not promote it or feature it.
create policy "chessflix_posts: update own pending"
  on public.chessflix_posts for update to authenticated
  using (creator_id = (select auth.uid()) and status in ('pending', 'rejected'))
  with check (
    creator_id = (select auth.uid())
    and status in ('pending', 'rejected')
    and not is_featured
  );

create policy "chessflix_posts: delete own"
  on public.chessflix_posts for delete to authenticated
  using (creator_id = (select auth.uid()) or public.is_admin());

create policy "chessflix_posts: admin moderate"
  on public.chessflix_posts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "community_games: read published"
  on public.community_games for select to anon, authenticated
  using (status = 'published' or submitter_id = (select auth.uid()) or public.is_admin());
create policy "community_games: insert own"
  on public.community_games for insert to authenticated
  with check (submitter_id = (select auth.uid()));
create policy "community_games: update own"
  on public.community_games for update to authenticated
  using (submitter_id = (select auth.uid()))
  with check (submitter_id = (select auth.uid()));
create policy "community_games: delete own"
  on public.community_games for delete to authenticated
  using (submitter_id = (select auth.uid()) or public.is_admin());

create policy "content_views: read own"
  on public.content_views for select to authenticated
  using (user_id = (select auth.uid()));
create policy "content_views: insert own"
  on public.content_views for insert to authenticated
  with check (user_id = (select auth.uid()));

grant select on public.chessflix_posts, public.community_games to anon, authenticated;
grant select on public.creator_permissions to authenticated;
grant insert, update, delete on public.chessflix_posts, public.community_games to authenticated;
grant insert, update, delete on public.creator_permissions to authenticated;
grant select, insert on public.content_views to authenticated;
grant execute on function public.can_post_chessflix() to authenticated;
