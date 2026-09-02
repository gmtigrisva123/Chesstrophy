# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **A corrupted FEN broke the "Pin to Win" puzzle.** A stray space inside
  `src/data/puzzles.js` (`…/2NBP N2/…`) split the board field, so only six of
  eight ranks parsed and the board rendered 40 squares with the pieces shifted.
  Nothing threw — it simply drew the wrong position. Found by the CHECK
  constraint added with the Supabase schema, and now covered by a test that
  validates every FEN in the bundled content.
- **Puzzle boards did not update as you played.** `PuzzleBoard` derived its own
  position from the `fen` prop and silently ignored the `board` prop it was
  handed. `PuzzleSolver` kept the live position in `board` and never updated
  `fen`, so pieces never visibly moved even though the puzzle was correctly
  scored as solved. `PuzzleBoard` now renders the position it is given.
- **Castling rendered as a king teleporting past a stationary rook.**
  `applySimpleMove` moved only the king. It now relocates the rook too.
- **React crashed when ChessFlix posting permission changed.**
  `ChessFlixPostForm` called `useState` after an early `return` on `!canPost`, so
  flipping that flag changed the hook count between renders. The permission gate
  and the editor are now separate components.
- **Inputs lost focus after a single keystroke.** Twenty-three components were
  defined inside a parent's render, making them a new component type on every
  render and remounting their whole subtree. The rating input in Daily Questions
  was the most visible casualty. All are now at module scope.
- **A white band appeared above and below the landing, onboarding and
  maintenance screens.** The CSS reset and page background lived in a `<style>`
  tag inside the main shell, which those screens render before. Both now come
  from a document-level stylesheet keyed on a `data-theme` attribute.
- **React key warning in `MoveList`.** `key` was passed through a spread object,
  which React 18 warns about and React 19 ignores outright.
- **Silent data loss on corrupt storage.** Twenty-nine `catch {}` blocks
  swallowed every persistence failure. Reads and writes now go through
  `lib/storage/jsonStore.js`, which falls back to defaults and reports once per
  key.
- Removed a redundant `answerTimes` state in Daily Questions that triggered an
  extra render per answer while never being read.

### Added

- **Supabase backend (optional).** A complete Postgres schema under
  [`supabase/`](supabase/): 48 tables, row level security on every one, seed
  data generated from `src/data/`, and a pgTAP suite. The app stays local-first
  — with no `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` configured nothing
  changes, and the SDK is never even downloaded. What it adds:
  - **Rewards can no longer be farmed.** "Pays out once" is now a `UNIQUE`
    constraint on an append-only ledger instead of a JavaScript check against
    editable storage; balances are written by a trigger and amounts come from a
    server-side table, so no crafted request can mint coins.
  - **Rules moved server-side**: `grant_reward`, `spend_coins`,
    `record_puzzle_attempt` (Elo) and `record_variation_attempt` (spaced
    repetition). The client reports what happened, not what it is worth.
  - **ChessFlix posting rights** are enforced by an RLS policy rather than by
    the UI, resolving a limitation `ARCHITECTURE.md` had listed as known.
  - **Guests get a real anonymous user**, so guest progress can be upgraded to
    a full account without losing anything.
  - Wiki search runs in Postgres instead of downloading every article to filter
    in the browser.
- **`scripts/generate-supabase-seed.mjs`** derives `supabase/seed.sql` from the
  same modules the client imports, so seeds cannot drift from the app. It is
  deterministic (`db:seed:check` enforces that in CI) and fails if an
  achievement has no server-side criteria.
- **`scripts/lint-supabase-sql.mjs`** catches the classic Supabase mistakes
  without needing a database: a table with no RLS, RLS with no policy, a
  `SECURITY DEFINER` function with an unpinned `search_path`, a view missing
  `security_invoker`, unbalanced dollar-quotes, and seeds referencing a
  non-existent table.
- **`src/services/contentSource.js`**, the seam between bundled and remote
  content, with fallback when a backend read fails or returns nothing.
- **Error boundary.** A render error now shows a recovery screen scoped to the
  current route instead of blanking the page.
- **Route-level code splitting.** Every screen except the dashboard loads on
  first navigation behind a page-shaped `<Suspense>` skeleton.
- **Test suite.** 81 tests across the chess engine, FEN helpers, the storage
  layer, the economy ledger, the profile service, and component regressions for
  each bug above.
- **`useThemeMode` hook** owning the colour scheme and the `data-theme`
  attribute, replacing ad-hoc theme state in the app shell.
- **Bundle budget**, enforced in CI by `scripts/report-bundle-size.mjs`.
- **CI/CD**: lint, type check, tests on Node 20 and 22, build with budget
  enforcement, a database job (SQL lint, seed drift check, migrations applied
  from scratch, pgTAP), CodeQL, dependency review, GitHub Pages deployment, and
  a gated release workflow.
- **Repository infrastructure**: ESLint flat config, Prettier, Vitest, TypeScript
  as a JSDoc analyser, Husky hooks, lint-staged, Dependabot, issue and pull
  request templates, `CODEOWNERS`, and `.editorconfig`.
- Full English documentation set: `README`, `ARCHITECTURE`, `CONTRIBUTING`,
  `SECURITY`, `CODE_OF_CONDUCT`, `SUPPORT`, and `docs/`.

### Changed

- **Initial download cut from 343 kB to ~110 kB gzipped**, a 68% reduction:
  route-level code splitting, a separate React vendor chunk, and images shipped
  as fingerprinted files rather than inline base64 (the mascot alone was 133 kB
  of base64 in the JavaScript bundle).
- FEN-to-board parsing was duplicated across five components; all now use
  `lib/chess/fen.js`.
- Two superseded layout functions in `treeLayout.js` were replaced by the ones
  the learning tree actually renders with, which also removed three
  `exhaustive-deps` warnings.
- Chess pieces expose readable alternative text ("White knight") instead of the
  raw FEN letter.
- `vite.config.js` honours `PORT`, and `.claude/launch.json` no longer hard-codes
  absolute paths.

### Removed

- 46 unused variables, parameters and props, including a dead `showWidget` helper
  whose config keys matched no dashboard section.

## [1.0.0] — 2026-08-24

### Added

- Initial release. The application was split from a single 12,773-line file into
  125 modules with no behavioural change; see
  [ARCHITECTURE.md](ARCHITECTURE.md#the-refactor-record) for the verification
  record.

[Unreleased]: https://github.com/gmtigrisva123/Chesstrophy/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/gmtigrisva123/Chesstrophy/releases/tag/v1.0.0
