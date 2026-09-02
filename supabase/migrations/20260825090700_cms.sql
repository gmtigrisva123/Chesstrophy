-- ═══════════════════════════════════════════════════════════════════════════
-- 0700 · Editorial content — wiki, news, events, site settings
-- ═══════════════════════════════════════════════════════════════════════════
-- The tables the (removed) Admin Portal used to write into. Modelled properly
-- rather than as one `cp_admin_data` JSON blob, so each kind of content can be
-- queried, indexed and secured on its own terms.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── ChessWiki ──────────────────────────────────────────────────────────────

create table public.wiki_categories (
  id          text        primary key,
  label       text        not null,
  icon        text,
  description text,
  sort_order  integer     not null default 0,

  constraint wiki_categories_id_slug check (id ~ '^[a-z0-9][a-z0-9-]*$')
);


create table public.wiki_articles (
  id             text        primary key,
  category_id    text        not null references public.wiki_categories (id) on delete restrict,
  title          text        not null,
  short_description text,
  content        text        not null default '',
  fen            text,
  move_sequence  text,
  image_url      text,
  tags           text[]      not null default '{}',
  is_featured    boolean     not null default false,
  show_puzzles_cta boolean   not null default false,
  show_opening_tool_cta boolean not null default false,
  puzzle_theme_hint text,
  view_count     integer     not null default 0,
  status         public.publication_status not null default 'published',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint wiki_articles_id_slug check (id ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint wiki_articles_view_count_positive check (view_count >= 0)
);

comment on table public.wiki_articles is
  'Encyclopedia entry. Body is Markdown, rendered by src/lib/format/markdown.js.';

create index wiki_articles_category_idx on public.wiki_articles (category_id)
  where status = 'published';
create index wiki_articles_popular_idx  on public.wiki_articles (view_count desc)
  where status = 'published';
create index wiki_articles_tags_idx     on public.wiki_articles using gin (tags);
-- Full-text search over title and summary. A GIN index on the generated
-- tsvector keeps search server-side instead of pulling every article to the
-- client to filter, which is what the local build had to do.
create index wiki_articles_search_idx on public.wiki_articles
  using gin (to_tsvector('english', title || ' ' || coalesce(short_description, '') || ' ' || content));

create trigger wiki_articles_set_updated_at
  before update on public.wiki_articles
  for each row execute function public.set_updated_at();


-- Cross-links between articles and other content. One table with a `kind`
-- discriminator rather than three near-identical link tables.
create table public.wiki_article_links (
  article_id  text not null references public.wiki_articles (id) on delete cascade,
  link_kind   text not null,
  target_id   text not null,
  sort_order  integer not null default 0,

  primary key (article_id, link_kind, target_id),
  constraint wiki_article_links_kind_valid
    check (link_kind in ('article', 'chessflix', 'lesson', 'opening', 'course'))
);

comment on table public.wiki_article_links is
  'Related content shown under an article. Not a foreign key: targets live in several tables.';


-- ── News, events, announcements ────────────────────────────────────────────

create table public.news_posts (
  id           uuid        primary key default extensions.gen_random_uuid(),
  title        text        not null,
  content      text        not null default '',
  cover_url    text,
  author       text,
  tags         text[]      not null default '{}',
  published_at timestamptz,
  status       public.publication_status not null default 'published',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index news_posts_published_idx on public.news_posts (published_at desc nulls last)
  where status = 'published';

create trigger news_posts_set_updated_at
  before update on public.news_posts
  for each row execute function public.set_updated_at();


create table public.events (
  id             uuid        primary key default extensions.gen_random_uuid(),
  title          text        not null,
  description    text,
  banner_url     text,
  event_type     text,
  organizer      text,
  starts_at      timestamptz,
  register_url   text,
  participant_cap integer,
  is_featured    boolean     not null default false,
  status         public.publication_status not null default 'published',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint events_participant_cap_positive check (participant_cap is null or participant_cap > 0)
);

create index events_upcoming_idx on public.events (starts_at)
  where status = 'published';

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();


-- RSVPs. The primary key is the "join once" rule; the local build kept this in
-- a profile map, which meant it could not be counted across users.
create table public.event_registrations (
  event_id      uuid        not null references public.events (id) on delete cascade,
  user_id       uuid        not null references auth.users (id) on delete cascade,
  registered_at timestamptz not null default now(),

  primary key (event_id, user_id)
);

comment on table public.event_registrations is
  'One RSVP per user per event. Real registrations, so participant counts are now truthful.';

create index event_registrations_user_idx on public.event_registrations (user_id);


create table public.announcements (
  id         uuid        primary key default extensions.gen_random_uuid(),
  title      text        not null,
  body       text        not null,
  scope      text        not null default 'Global',
  is_active  boolean     not null default true,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  created_at timestamptz not null default now(),

  constraint announcements_window_ordered check (ends_at is null or ends_at > starts_at)
);

create index announcements_active_idx on public.announcements (starts_at desc) where is_active;


-- ── Site settings ──────────────────────────────────────────────────────────
-- A single row, guarded so a second can never be inserted. Reads are hot (the
-- landing page and every page title) and writes are rare.

create table public.site_settings (
  id             boolean     primary key default true,
  site_name      text        not null default 'ChessProphy',
  tagline        text        not null default 'AI-Powered Chess Learning Platform',
  seo_title      text,
  hero_title     text,
  hero_subtitle  text,
  hero_cta_label text,
  primary_colour text        not null default '#2563EB',
  accent_colour  text        not null default '#C9A84C',
  discord_url    text,
  youtube_url    text,
  twitter_url    text,
  maintenance_mode boolean   not null default false,
  banner_active  boolean     not null default false,
  banner_text    text,
  banner_colour  text        not null default '#2563EB',
  homepage       jsonb       not null default '{}'::jsonb,
  updated_at     timestamptz not null default now(),

  -- Singleton: `id` may only ever be true, so a second row violates the PK.
  constraint site_settings_singleton check (id),
  constraint site_settings_homepage_is_object check (jsonb_typeof(homepage) = 'object')
);

comment on table public.site_settings is
  'Single-row site configuration. The CHECK plus the PK make it a true singleton.';
comment on column public.site_settings.homepage is
  'Landing page content: features, stats, testimonials. Edited as a unit, never queried.';

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();


-- ── View counter trigger ───────────────────────────────────────────────────
-- Defined in 0600; attached here now that wiki_articles exists.

create trigger content_views_increment
  after insert on public.content_views
  for each row execute function public.increment_view_count();


-- ── Row level security ─────────────────────────────────────────────────────

alter table public.wiki_categories      enable row level security;
alter table public.wiki_articles        enable row level security;
alter table public.wiki_article_links   enable row level security;
alter table public.news_posts           enable row level security;
alter table public.events               enable row level security;
alter table public.event_registrations  enable row level security;
alter table public.announcements        enable row level security;
alter table public.site_settings        enable row level security;

do $$
declare
  t text;
begin
  -- Published-gated editorial tables.
  foreach t in array array['wiki_articles', 'news_posts', 'events']
  loop
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (status = ''published'' or public.is_admin())',
      t || ': read published', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || ': admin write', t);
  end loop;

  -- Always-readable reference tables.
  foreach t in array array['wiki_categories', 'wiki_article_links', 'site_settings']
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

-- Announcements are time-windowed rather than status-gated.
create policy "announcements: read active"
  on public.announcements for select to anon, authenticated
  using (
    (is_active and starts_at <= now() and (ends_at is null or ends_at > now()))
    or public.is_admin()
  );
create policy "announcements: admin write"
  on public.announcements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Registrations: your own are yours; counts come from the public view in 0800.
create policy "event_registrations: read own"
  on public.event_registrations for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "event_registrations: insert own"
  on public.event_registrations for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "event_registrations: delete own"
  on public.event_registrations for delete to authenticated
  using (user_id = (select auth.uid()));

grant select on
  public.wiki_categories, public.wiki_articles, public.wiki_article_links,
  public.news_posts, public.events, public.announcements, public.site_settings
  to anon, authenticated;

grant insert, update, delete on
  public.wiki_categories, public.wiki_articles, public.wiki_article_links,
  public.news_posts, public.events, public.announcements, public.site_settings
  to authenticated;

grant select, insert, delete on public.event_registrations to authenticated;
