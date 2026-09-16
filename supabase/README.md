# Supabase backend

The Postgres schema, migrations, seed data and tests behind ChessProphy.

> **The backend is optional.** With no `VITE_SUPABASE_URL` /
> `VITE_SUPABASE_ANON_KEY` configured, the app runs exactly as it always has —
> local-first, no network calls, progress in the browser's storage. Everything
> here is what you get when you _do_ connect one.

## Contents

- [Why a backend](#why-a-backend)
- [Layout](#layout)
- [Getting started](#getting-started)
- [Schema](#schema)
- [Security model](#security-model)
- [Server-side rules](#server-side-rules)
- [Seed data](#seed-data)
- [Working on the schema](#working-on-the-schema)
- [Testing](#testing)
- [Deploying](#deploying)
- [Using it from the app](#using-it-from-the-app)

## Why a backend

Three things a local-first build cannot do, in order of how much they matter:

**1. Rewards can be farmed.** In the local build, "this course pays out once" is
a check in JavaScript against a map the user can edit in DevTools. Here it is a
`UNIQUE (user_id, reward_type, reference_id)` constraint on an append-only
ledger, balances are written by a trigger rather than by the client, and the
_amount_ comes from a server-side table. There is no request a client can craft
that mints coins.

**2. Progress is trapped in one browser.** Clear the site data and everything
is gone. There is no way to study on a laptop and continue on a phone.

**3. "Community" is a single-player fiction.** ChessFlix permissions are checked
in the UI, event registrations live in one person's profile object, and the
participant counts are literals. `ARCHITECTURE.md` lists all of this as a known
limitation; this directory is the resolution.

## Layout

```
supabase/
├── config.toml            # Local stack: ports, auth, storage buckets
├── seed.sql               # GENERATED from src/data/ — do not edit by hand
├── migrations/            # Applied in filename order, never edited after merge
│   ├── …090000_extensions_and_conventions.sql   Extensions, enums, RLS helpers
│   ├── …090100_profiles.sql                     Profiles + signup trigger
│   ├── …090200_chess_catalogue.sql              Openings, variations, puzzles, games
│   ├── …090300_learning_content.sql             Courses, question banks, skill tree
│   ├── …090400_progress.sql                     Everything a learner accumulates
│   ├── …090500_economy.sql                      Ledger, wallet, grant/spend RPCs
│   ├── …090600_community.sql                    ChessFlix, submissions, view counts
│   ├── …090700_cms.sql                          Wiki, news, events, site settings
│   ├── …090800_views_and_rpc.sql                Read models, spaced repetition, search
│   └── 20260916000000_courses_cheat_sheet_object.sql  cheat_sheet is a JSON object
└── tests/                 # pgTAP
    ├── 00_schema.test.sql   Invariants: RLS everywhere, cascades, uniqueness
    ├── 01_economy.test.sql  Idempotent rewards, XP curve, spend gating
    └── 02_rls.test.sql      Isolation, from the client's perspective
```

## Getting started

Requires the [Supabase CLI](https://supabase.com/docs/guides/local-development)
and Docker.

```bash
supabase start          # boots Postgres, Auth, Storage, Studio
supabase db reset       # applies every migration, then seed.sql
```

`supabase start` prints an API URL and an anon key. Put them in `.env.local`:

```bash
cp .env.example .env.local
# VITE_SUPABASE_URL=http://127.0.0.1:54321
# VITE_SUPABASE_ANON_KEY=<the anon key it printed>
```

Then `npm run dev`. Studio is at http://127.0.0.1:54323.

| Command                        | What it does                                          |
| ------------------------------ | ----------------------------------------------------- |
| `npm run db:start` / `db:stop` | Boot or stop the local stack                          |
| `npm run db:reset`             | Re-apply every migration from scratch, then seed      |
| `npm run db:lint`              | Static checks over the SQL — no database needed       |
| `npm run db:test`              | pgTAP suite                                           |
| `npm run db:diff -- <name>`    | Capture schema changes made in Studio as a migration  |
| `npm run db:push`              | Apply pending migrations to the linked hosted project |
| `npm run db:types`             | Regenerate TypeScript types from the live schema      |
| `npm run db:seed:generate`     | Rebuild `seed.sql` from `src/data/`                   |
| `npm run db:seed:check`        | Fail if `seed.sql` has drifted (CI runs this)         |

## Schema

48 tables in four groups.

**Catalogue** — content everyone reads, admins write:
`openings`, `opening_variations`, `opening_variation_moves`, `puzzles`,
`classic_games`, `study_categories`, `courses`, `course_chapters`,
`course_practice_questions`, `daily_questions`, `quiz_questions`,
`placement_questions`, `skill_tree_nodes`, `skill_tree_prerequisites`,
`store_items`, `achievements`, `reward_rules`.

**Learner state** — one owner, RLS-scoped:
`profiles`, `puzzle_progress`, `puzzle_attempts`, `opening_progress`,
`opening_favourites`, `opening_repertoire`, `opening_academy_progress`,
`course_progress`, `skill_tree_progress`, `daily_question_state`,
`daily_question_sessions`, `daily_question_answers`, `coach_state`.

**Economy** — derived from an append-only ledger:
`wallets`, `coin_transactions`, `user_unlocks`, `user_achievements`,
`weekly_missions`.

**Community and CMS**:
`chessflix_posts`, `community_games`, `content_views`, `creator_permissions`,
`wiki_categories`, `wiki_articles`, `wiki_article_links`, `news_posts`,
`events`, `event_registrations`, `announcements`, `site_settings`,
`user_roles`.

### Modelling decisions

**Normalised where it is queried, JSONB where it is rendered.** Opening moves
are a real table — the trainer walks them ply by ply, and "which lines start
1.e4 c5" should be a query. The editorial prose (`mainIdeas`,
`strategicConcepts`, …) is one `editorial` JSONB column: eighteen `text[]`
columns would add schema churn for content that is only ever displayed as a
block.

**Aggregates and events, not aggregates alone.** `puzzle_progress` holds the
rating and streak so the dashboard is one lookup; `puzzle_attempts` keeps every
attempt so history survives and stats stay derivable. Same split for daily
questions.

**Dates where a day is meant.** A streak is a human day, not 24 hours, so
`last_solved_on` is a `date`. Instants are `timestamptz`.

## Security model

Every table has RLS enabled in the same migration that creates it, and a pgTAP
test fails the build if one ever does not.

| Data                  | Rule                                                                           |
| --------------------- | ------------------------------------------------------------------------------ |
| Catalogue             | Read published rows; admins read and write all                                 |
| Learner state         | `user_id = auth.uid()` for select, insert, update, delete                      |
| `wallets`             | **Read own only.** No write policy exists — the ledger trigger writes it       |
| `coin_transactions`   | **Read own only.** Append-only for clients; no UPDATE or DELETE policy         |
| `user_roles`          | Read own. **No write policy at all** — only the service role grants a role     |
| `creator_permissions` | Read own; admin write. Posting rights cannot be self-granted                   |
| ChessFlix posts       | Read published, or your own. Insert pins `creator_id` and `status = 'pending'` |
| Profiles              | Own, plus anyone who opted into `settings.privacy.publicProfile`               |

Four deliberate properties worth calling out:

1. **Roles are not on `profiles`.** A user can update their own profile row, so
   a `role` column there would be a one-request privilege escalation.
   `user_roles` is a separate table with no client write policy.
2. **Every view is `security_invoker = true`.** Without it a view runs as its
   owner and silently bypasses the RLS of everything beneath it — the most
   common way a Supabase schema leaks.
3. **Every `SECURITY DEFINER` function pins `search_path`.** An unpinned one is
   a textbook escalation vector.
4. **The absence of a policy is load-bearing.** `wallets` and
   `coin_transactions` have no write policy _on purpose_. Adding one would
   undo the anti-farming guarantee.

`npm run db:lint` checks all four statically, and the pgTAP suite checks them
against a live database.

## Server-side rules

Anything with a _rule_ is an RPC, not an UPDATE, so the rule lives in one place
and cannot be edited by a client.

| Function                                | Guarantee                                                                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grant_reward(type, reference, reason)` | Idempotent per `(user, type, reference)`. Amount read from `reward_rules` — the caller never states a price. Locks the wallet row, so concurrent grants cannot interleave |
| `spend_coins(item_id, reason)`          | Price, ownership and balance all checked server-side, under `FOR UPDATE` so two purchases cannot overdraw                                                                 |
| `record_puzzle_attempt(...)`            | Computes the Elo change. The client reports what happened, not what it is worth. Rating moves only on a first solve                                                       |
| `record_variation_attempt(id, correct)` | Advances the SM-2-lite schedule. The interval table is here, so reviews cannot be self-shortened                                                                          |
| `check_achievements(user)`              | Evaluates declarative criteria. Not callable by clients                                                                                                                   |
| `level_from_xp(xp)`                     | Mirrors `levelFromXP()` in `src/services/economy.js`. A pgTAP test pins both to the same boundaries                                                                       |
| `search_wiki(query, limit)`             | Full-text search in Postgres instead of downloading every article to filter in the browser                                                                                |
| `can_post_chessflix()`                  | Advisory answer for the UI. The RLS policy is what actually enforces it                                                                                                   |

## Seed data

`seed.sql` is **generated** by `scripts/generate-supabase-seed.mjs` from the
same modules the client imports. Hand-writing it would guarantee drift: someone
adds an opening to `src/data/openingRepertoire.js`, nobody remembers the seed,
and local databases quietly stop matching the app.

What it loads:

|                                       |              |
| ------------------------------------- | -----------: |
| Openings / variations / moves         | 9 / 12 / 100 |
| Puzzles                               |           10 |
| Classic games                         |           30 |
| Study categories / courses / chapters |   3 / 9 / 25 |
| Daily / quiz / placement questions    |  28 / 15 / 5 |
| Skill tree nodes / prerequisites      |      40 / 45 |
| Achievements / store items            |        6 / 3 |
| Wiki categories / articles            |        8 / 8 |

Every statement is idempotent (`on conflict … do update`), so re-running it
against a populated database updates rows in place. **It never touches learner
data.**

The generator is deterministic — timestamps derived from `Date.now()` are
emitted as `now() + interval 'N days'` rather than as an absolute instant, so
regenerating produces a byte-identical file. `npm run db:seed:check` enforces
that in CI.

It also fails if an achievement in `src/data/achievements.js` has no
server-side criteria, because a JavaScript predicate cannot cross into SQL and
silently dropping one would mean a badge that never unlocks.

## Working on the schema

**Migrations are append-only.** Once merged, a migration is history. Change the
schema by adding a new one.

```bash
supabase migration new add_puzzle_collections   # creates a timestamped file
# …write the SQL…
npm run db:lint                                 # static checks
supabase db reset                               # apply from scratch
npm run db:test                                 # pgTAP
```

Or make the change in Studio and capture it:

```bash
npm run db:diff -- add_puzzle_collections
```

Read the generated SQL before committing — `db diff` captures _everything_ that
differs, including experiments you meant to discard.

### Checklist for a new table

- [ ] `alter table … enable row level security` **in the same migration**
- [ ] At least one policy — RLS with no policy returns nothing, silently
- [ ] `user_id … references auth.users (id) on delete cascade` if user-owned
- [ ] `created_at` / `updated_at` plus the `set_updated_at` trigger
- [ ] Indexes for the queries the feature actually runs
- [ ] Explicit `grant` — the default privileges here are revoked
- [ ] A `comment on table` saying what it is for
- [ ] `npm run db:lint` passes

## Testing

```bash
npm run db:lint    # static, no database
npm run db:test    # pgTAP, needs the local stack
```

The static linter catches, in about a second: a table with no RLS, RLS with no
policy, a `SECURITY DEFINER` function with an unpinned `search_path`, a view
without `security_invoker`, unbalanced dollar-quotes or parentheses, seeds
referencing a table no migration creates, and duplicate or misordered migration
filenames.

The pgTAP suite asserts the behaviour: signup provisioning, reward idempotency
under replay _and_ under direct INSERT, the XP curve matching the client
boundary for boundary, purchase gating, and cross-user isolation exercised as
the `authenticated` role with a JWT rather than as the table owner.

## Deploying

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Before the first production deploy:

- [ ] **Email confirmations on.** `config.toml` disables them for local
      convenience; a hosted project must not.
- [ ] **Anonymous sign-ins** enabled only if you want the guest path.
- [ ] **`site_url` and redirect URLs** set to the real domain.
- [ ] **The `service_role` key is nowhere near the client.** It bypasses RLS
      entirely. It is not a `VITE_` variable, ever.
- [ ] **Grant yourself admin**, from the SQL editor — there is deliberately no
      way to do this from the app:
      `sql
insert into public.user_roles (user_id, role)
values ('<your-auth-uid>', 'admin');
`
- [ ] **Point-in-time recovery** enabled, and a restore actually rehearsed.
- [ ] **Rate limits** reviewed under Auth settings.

## Using it from the app

```js
import { isSupabaseConfigured, catalogue, progress, auth } from "@/lib/supabase";

// Local-first stays the default: with no backend configured, fall back to the
// bundled content and the storage bridge.
const openings = isSupabaseConfigured() ? await catalogue.fetchOpenings() : OPENING_REPERTOIRE;

// Rewards are idempotent server-side, so calling this twice is safe.
const result = await progress.grantReward("course_complete", courseId);
if (result.granted && result.leveledUp) showLevelUp(result.newLevel);
```

`src/lib/supabase/` is the only place that knows SQL column names. Repository
functions return data in the shape `src/data/` already exports, so a feature
switches over by changing one import — and switches back the same way.

The client SDK is loaded with a dynamic `import()`, so a project running
local-first never downloads it and the bundle budget is unaffected.

### Migrating a feature

1. Read through the repository instead of the bundled constant.
2. Keep the local path behind `isSupabaseConfigured()` until the feature is
   proven.
3. Move any _rule_ — a payout, an interval, a rating change — into an RPC. If
   the client can compute it, the client can lie about it.
