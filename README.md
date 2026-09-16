<div align="center">

# ChessProphy

**An AI-assisted chess learning platform — opening trainer, structured courses, daily puzzles, a coaching layer, and a personalised learning tree.**

[![CI](https://github.com/gmtigrisva123/Chesstrophy/actions/workflows/ci.yml/badge.svg)](https://github.com/gmtigrisva123/Chesstrophy/actions/workflows/ci.yml)
[![CodeQL](https://github.com/gmtigrisva123/Chesstrophy/actions/workflows/codeql.yml/badge.svg)](https://github.com/gmtigrisva123/Chesstrophy/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520.19-brightgreen.svg)](.nvmrc)

[Getting started](#getting-started) · [Architecture](ARCHITECTURE.md) · [Contributing](CONTRIBUTING.md) · [Docs](docs/)

</div>

---

## What it is

ChessProphy is a single-page React application for learning chess. Everything runs
in the browser: there is no backend, no account server, and no network call at
runtime. Progress is persisted per browser through a key-value storage bridge
(see [Data & persistence](#data--persistence)).

| Area                   | What it does                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**          | Personalised home: streaks, level, recommended courses, upcoming events.                                            |
| **Puzzles**            | Daily puzzles and a Puzzle of the Day, with an Elo-style puzzle rating.                                             |
| **Openings**           | An opening library with per-variation spaced repetition (SM-2-lite), plus Learn and Practice modes on a real board. |
| **Studies & Courses**  | Multi-chapter courses with Learn / Cheat Sheet / Practice tabs.                                                     |
| **Learning Tree & AI** | A skill graph that unlocks as you progress, with daily questions and a placement assessment.                        |
| **Chess DNA**          | Six derived skill scores computed from your actual puzzle, opening and question history.                            |
| **ChessWiki**          | A cross-linked chess encyclopedia with interactive positions.                                                       |
| **Classic Games**      | Thirty annotated games from world champions, with an analysis board.                                                |
| **Prophy Store**       | A virtual-currency economy backed by an idempotent transaction ledger.                                              |

## Getting started

**Prerequisites:** Node.js ≥ 20.19 (the version in [`.nvmrc`](.nvmrc)) and npm ≥ 10.

```bash
git clone https://github.com/gmtigrisva123/Chesstrophy.git
cd Chesstrophy
npm install
npm run dev
```

The dev server prints a local URL (`http://localhost:5173` by default; set `PORT`
to override). Hot module replacement is on — edits appear without a reload.

### Commands

| Command                    | What it does                                                     |
| -------------------------- | ---------------------------------------------------------------- |
| `npm run dev`              | Start the Vite dev server with HMR.                              |
| `npm run build`            | Produce an optimised production build in `dist/`.                |
| `npm run preview`          | Serve the production build locally, exactly as it will ship.     |
| `npm run lint`             | Run ESLint across the repository.                                |
| `npm run lint:fix`         | Apply every auto-fixable lint rule.                              |
| `npm run format`           | Format docs, configs and CSS with Prettier.                      |
| `npm run format:check`     | Verify formatting without writing (what CI runs).                |
| `npm run typecheck`        | Run the TypeScript compiler as a static analyser over JSDoc.     |
| `npm test`                 | Run the test suite once.                                         |
| `npm run test:watch`       | Re-run affected tests as you edit.                               |
| `npm run test:coverage`    | Run tests and write a coverage report to `coverage/`.            |
| `npm run analyze`          | Build, then report bundle sizes against the budget.              |
| `npm run db:start`         | Boot the local Supabase stack (needs the CLI and Docker).        |
| `npm run db:reset`         | Apply every migration from scratch, then the seed.               |
| `npm run db:lint`          | Static checks over the SQL — no database needed.                 |
| `npm run db:test`          | Run the pgTAP suite.                                             |
| `npm run db:seed:generate` | Rebuild `supabase/seed.sql` from `src/data/`.                    |
| `npm run verify`           | Everything CI checks: lint → types → SQL → seed → tests → build. |

Run `npm run verify` before opening a pull request. A Git pre-push hook runs the
same gates automatically.

## Architecture at a glance

```
src/
├── main.jsx                # Entry point — mounts <App /> into #root
├── App.jsx                 # Boot gate: hydrates storage, then renders the app shell
│
├── app/                    # Application shell: routing, skeletons, error boundary wiring
├── platform/               # Host-environment adapters (infrastructure, not app logic)
│
├── assets/                 # Images and the piece set
├── styles/                 # Global stylesheet (reset, tokens, shared keyframes)
├── theme/                  # Board palette, level colours, academy theme
├── data/                   # Static content: openings, lessons, puzzles, questions
├── services/               # Persistent state and business logic
├── lib/                    # Pure utilities — no React, no storage access
│   ├── chess/              # Engine, PGN, FEN, evaluation, sound
│   ├── format/             # Markdown, time
│   ├── media/              # Image compression, video embeds
│   ├── storage/            # Key-value bridge, JSON persistence, admin pub/sub
│   └── supabase/           # Optional backend: client, auth, repositories
├── hooks/                  # Shared React hooks
├── components/             # Reusable, domain-agnostic components
│   ├── chess/              # Boards, pieces, arrows, evaluation bar
│   ├── layout/             # Sidebar, topbar, mobile drawer
│   ├── feedback/           # Error boundary
│   ├── ui/                 # Badges, progress bars, toasts, charts
│   └── icons/
└── features/               # One directory per screen
    ├── dashboard/  openings/  courses/  studies/  puzzles/
    ├── wiki/  games/  chessflix/  studio/  store/  profile/
    ├── learningTree/  chessDna/  dailyQuestions/
    └── onboarding/  landing/  events/  news/  maintenance/
```

Dependencies flow in **one direction only**, and the graph is verified acyclic by
`import/no-cycle` in CI:

```
features → components → hooks → services → data → lib → theme/assets
```

[`ARCHITECTURE.md`](ARCHITECTURE.md) covers the reasoning, the module boundaries,
and the record of how this structure was derived from the original single file.

## Data & persistence

The app is **local-first**, with an **optional Supabase backend**.

### Local-first (the default)

With no environment configured, the app reads and writes through
`window.storage`, an asynchronous key-value API
provided by the artifact host it was originally written for
(see [`src/lib/storage/storageBridge.js`](src/lib/storage/storageBridge.js)).

When it runs as a standalone Vite app,
[`src/platform/storageAdapter.js`](src/platform/storageAdapter.js) supplies an
equivalent `localStorage`-backed implementation — and only when `window.storage`
is not already present. No application code is aware of that file.

Every service persists exactly one JSON document under one key, through
[`src/lib/storage/jsonStore.js`](src/lib/storage/jsonStore.js). Persistence is
best-effort by design: a corrupt or unreadable record falls back to defaults and
reports once, so one bad entry can never brick the app.

### Supabase (optional)

[`supabase/`](supabase/) holds a complete Postgres schema — 48 tables, row level
security on every one of them, and seed data generated from `src/data/`.

```bash
supabase start && supabase db reset   # boot the stack and load the schema
cp .env.example .env.local            # then paste in the printed URL and anon key
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` and the same calls read
from Postgres instead. Leave them unset and nothing changes — the Supabase SDK
is loaded with a dynamic `import()`, so a local-first project never downloads it
and the bundle budget is unaffected.

What the backend adds that a browser cannot:

- **Rewards cannot be farmed.** "Pays out once" becomes a `UNIQUE` constraint on
  an append-only ledger rather than a JavaScript check against editable storage.
  Balances are written by a trigger; amounts come from a server-side table.
- **Progress follows the user**, across devices and past a cleared cache.
- **Community features become real** — ChessFlix permissions are enforced by a
  policy rather than by the UI, and event registrations are actual rows, so the
  participant counts stop being literals.

[`supabase/README.md`](supabase/README.md) covers the schema, the security
model, the server-side rules and the deployment checklist.

## Admin panel

Open **`/#/admin`** (there is no link for ordinary visitors; once you are
signed in an "Admin panel" entry appears at the bottom of the sidebar). It is a
separate shell in [`src/features/admin/`](src/features/admin/), loaded only when
that route is visited.

**Who gets in** depends on whether a backend is configured:

| Mode   | When                                 | Gate                                                                                                                                                                                                                                                              |
| ------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remote | Supabase env vars are set            | Sign in with the account that holds `admin` or `moderator` in `public.user_roles`. Roles are granted only in the database ([`supabase/README.md`](supabase/README.md) → _Grant yourself admin_), and every catalogue table's RLS re-checks `is_admin()` on write. |
| Local  | No backend (the local-first default) | A passcode you create on first visit, stored as a salted SHA-256 hash in the browser, with a lockout after five failed attempts. This protects the screens, not the data — everything already lives in that browser.                                              |

**What it manages** — every section of the content store, through one
schema-driven editor ([`adminSchemas.js`](src/features/admin/adminSchemas.js)):
news, events, announcements, custom puzzles (solutions are played through the
engine before they can be saved, and FENs render a live board), store items,
community studies and openings, courses, lessons, resources, the AI placement
quiz, wiki categories and articles. Plus:

- **Moderation** — the ChessFlix review queue, posting policy, and community games.
- **Site settings** — identity, landing page copy and features, social links,
  SEO, maintenance mode, the dashboard banner and section order.
- **Economy** — reward amounts per activity, and an audited wallet adjustment.
- **Users** — member directory in remote mode; this device's learner locally.
- **Activity log** — who changed what, when (last 500 actions, exportable).
- **Data & security** — JSON backup/restore, factory reset, passcode change.

`⌘K` / `Ctrl+K` opens a command palette that jumps to any section, creates a
record, or finds one by title. Edits apply to every open page instantly.

## Performance

The initial download is budgeted and enforced in CI by
[`scripts/report-bundle-size.mjs`](scripts/report-bundle-size.mjs).

|                    |                      gzipped |
| ------------------ | ---------------------------: |
| Entry chunk        |                       ~65 kB |
| React vendor chunk |                       ~44 kB |
| CSS                |                        ~1 kB |
| **Initial total**  | **~110 kB** (budget: 220 kB) |

Every route other than the dashboard is loaded on first navigation via
`React.lazy`, and images ship as fingerprinted files rather than inline base64 so
the browser can cache them independently of the app code.

## Browser support

The two most recent versions of Chrome, Edge, Firefox and Safari, on desktop and
mobile. The layout is responsive from 320 px upward, and the app honours
`prefers-color-scheme` and `prefers-reduced-motion`.

## Contributing

Bug reports, features and pull requests are all welcome. Start with
[`CONTRIBUTING.md`](CONTRIBUTING.md) — it covers the branch and commit
conventions, the review checklist, and how to run the same gates CI runs.

Everyone taking part is expected to follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Please do not open a public issue for a vulnerability. [`SECURITY.md`](SECURITY.md)
explains how to report one privately and what to expect afterwards.

## Documentation

| Document                                           | What is in it                                                |
| -------------------------------------------------- | ------------------------------------------------------------ |
| [ARCHITECTURE.md](ARCHITECTURE.md)                 | Module layout, dependency rules, and the refactor record.    |
| [supabase/README.md](supabase/README.md)           | Database schema, security model, migrations and deployment.  |
| [CONTRIBUTING.md](CONTRIBUTING.md)                 | How to set up, branch, commit, test and get a change merged. |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)           | Expected conduct and how to report a problem.                |
| [SECURITY.md](SECURITY.md)                         | Supported versions and private vulnerability reporting.      |
| [CHANGELOG.md](CHANGELOG.md)                       | Notable changes, newest first.                               |
| [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md)         | Code conventions specific to this codebase.                  |
| [docs/TESTING.md](docs/TESTING.md)                 | What is tested, how, and what to write for a new change.     |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)           | How a build reaches production.                              |
| [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)     | The a11y bar and how to verify a change against it.          |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md)         | The bundle budget and the rules that keep it.                |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Fixes for the problems people actually hit.                  |
| [docs/ROADMAP.md](docs/ROADMAP.md)                 | What is planned, and what is deliberately not.               |
| [docs/adr/](docs/adr/)                             | Architecture decision records.                               |

## License

[MIT](LICENSE) © ChessProphy contributors.
