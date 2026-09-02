# Architecture

This document describes how ChessProphy is structured, the rules that keep that
structure intact, and the record of how it was derived from the original
single-file implementation.

## Table of contents

- [Principles](#principles)
- [Layers](#layers)
- [The dependency rule](#the-dependency-rule)
- [Data flow](#data-flow)
- [Persistence](#persistence)
- [Rendering and routing](#rendering-and-routing)
- [Theming](#theming)
- [The refactor record](#the-refactor-record)
- [Conventions for new code](#conventions-for-new-code)
- [Known limitations](#known-limitations)

## Principles

1. **One direction of dependency.** Every import points down the layer stack,
   never up and never sideways across features. This is what makes any single
   feature removable without archaeology.
2. **Pure things stay pure.** `lib/` has no React and no storage access, so it is
   trivially testable and safe to call from anywhere.
3. **Persistence is best-effort, never fatal.** A corrupt record falls back to
   defaults and reports once. No stored value can brick the app.
4. **Ship what the first screen needs.** Everything else is fetched on demand.
5. **Fail visibly in one place.** A render error surfaces a recovery screen from
   the error boundary rather than blanking the page.

## Layers

| Layer               | Contains                                                  | May import from                   |
| ------------------- | --------------------------------------------------------- | --------------------------------- |
| `features/`         | One directory per screen. Composes everything below it.   | Everything below                  |
| `components/`       | Reusable UI with no business knowledge.                   | `hooks`, `lib`, `theme`, `assets` |
| `hooks/`            | Shared React hooks.                                       | `services`, `lib`                 |
| `services/`         | Persistent state and business rules.                      | `data`, `lib`                     |
| `data/`             | Static content: openings, lessons, puzzles, questions.    | Nothing                           |
| `lib/`              | Pure utilities. No React, no storage.                     | `lib` only                        |
| `theme/`, `assets/` | Colours, palettes, images.                                | Nothing                           |
| `platform/`         | Host-environment adapters. Infrastructure, not app logic. | Nothing                           |
| `lib/supabase/`     | Optional backend: client, auth, repositories.             | `lib` only                        |
| `app/`              | The shell: routing, skeletons, boundary wiring.           | Everything                        |

`platform/` is deliberately outside the stack. It exists to make the app run in a
host it was not written for, and nothing in `src/` imports from it — only
`main.jsx` does, for its side effect.

## The dependency rule

```
features → components → hooks → services → data → lib → theme/assets
```

This is enforced, not just documented:

- `import/no-cycle` fails CI on any circular import.
- The graph has **zero** cycles today, and the ESLint rule is what keeps it that way.

Cross-feature imports are the one exception, and there are exactly four. All are
intentional composition rather than coupling:

| From           | To               | Why                                             |
| -------------- | ---------------- | ----------------------------------------------- |
| `dashboard`    | `chessDna`       | The DNA widget is a dashboard card.             |
| `learningTree` | `dailyQuestions` | Daily questions are a tab of the learning tree. |
| `studies`      | `courses`        | Studies opens the shared `CourseViewer`.        |
| `studio`       | `chessflix`      | ChessFlix is a Studio feature.                  |

Adding a fifth needs a reason in the pull request. If two features need the same
thing, that thing belongs in `components/` or `services/`.

## Data flow

State lives in exactly one of three places, and which one is never ambiguous:

1. **Static content** → `data/`. Never changes at runtime.
2. **Persistent user state** → `services/`. Every read and write goes through a
   `loadX()` / `saveX()` pair. UI never touches storage directly.
3. **Ephemeral view state** → `useState` in the component that owns it.

The one cross-cutting channel is
[`lib/storage/adminDataEvents.js`](src/lib/storage/adminDataEvents.js): a small
pub/sub so an already-rendered page picks up a content change immediately rather
than only after navigating away and back.

## Persistence

The app is local-first with an optional Supabase backend. Both sit behind the
same service-layer API, so a feature does not know which one is answering.

### Local-first (the default)

Everything routes through `window.storage`, the asynchronous key-value API of the
artifact host this app was written for.

```
services/*.js
    │  loadX() / saveX()  — synchronous
    ▼
lib/storage/jsonStore.js  — JSON encode/decode, fallback on corruption
    │
    ▼
lib/storage/storageBridge.js  — in-memory cache, hydrated once at boot
    │
    ▼
window.storage  — async; real host API, or the localStorage adapter
```

Two things make this work:

- **The boot gate.** `App.jsx` hydrates the whole cache from `window.storage`
  before the app mounts. That is what lets every `loadX()` be a plain synchronous
  read, exactly as it was originally written against `localStorage`.
- **Write-behind.** `saveX()` updates the in-memory cache immediately and flushes
  to the host in the background. A rejected flush costs durability, not
  correctness — the session still works, it just may not survive a reload.

`jsonStore.readJson(key, createDefault)` reports a failure once per key rather
than swallowing it, so a corrupt record shows up in the console during
development instead of vanishing.

### Supabase (optional)

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, reads and writes
can go to Postgres instead:

```
features
    |
    v
services/contentSource.js     chooses local vs remote, falls back on failure
    |
    v
lib/supabase/repositories/*   maps SQL rows to the shapes src/data/ exports
    |
    v
lib/supabase/client.js        dynamic import() of the SDK, memoised per tab
    |
    v
Postgres                      RLS on every table; rules in RPCs
```

Three properties make this safe to adopt incrementally:

- **The SDK is dynamically imported.** A project with no backend configured
  never downloads it, so the bundle budget is unaffected either way.
- **`contentSource.js` is the only place that decides.** A remote failure or an
  empty table degrades to the bundled catalogue rather than to a blank screen,
  and the failure is still reported.
- **Repositories return the shapes `src/data/` already exports.** Migrating a
  feature is a one-line import change, and reverting is the same one line.

Anything carrying a _rule_ — a coin payout, a spaced-repetition interval, a
rating change — is an RPC rather than an UPDATE. If the client can compute it,
the client can lie about it. See [supabase/README.md](supabase/README.md).

## Rendering and routing

There is no router library. `app/ChessProphyApp.jsx` holds an `active` string and
maps it to a screen. The trade-off is deliberate: no URL state, no dependency, no
route configuration. If deep linking becomes a requirement, this is the single
place that changes.

Three screens sit in front of the main shell and short-circuit it:
`MaintenanceScreen`, `LandingPage`, and `OnboardingFlow`. All hooks run before
those early returns, so the hook order is stable across every branch.

Every route except the dashboard is a `React.lazy` boundary. The chunk loads on
first navigation behind a `<Suspense>` skeleton shaped like a page, and an
`<ErrorBoundary>` keyed on the active route catches anything that throws while
rendering it.

## Theming

[`hooks/useThemeMode.js`](src/hooks/useThemeMode.js) owns the colour scheme: the
persisted preference (`light` / `dark` / `system`), the resolved boolean, and the
`data-theme` attribute on `<html>`.

The attribute matters. The page background is a CSS custom property keyed off it
in [`styles/global.css`](src/styles/global.css), which means the landing,
onboarding and maintenance screens get the right background too — they render
before the main shell, so a `<style>` tag inside that shell could never reach
them.

Component colours are still passed down as props (`dark`, `fg`, `muted`, `card`,
`border`). Migrating those to CSS custom properties is tracked in
[docs/ROADMAP.md](docs/ROADMAP.md).

## The refactor record

The application began as a single 12,773-line file. It was split into 125 modules
under a constraint: **no behavioural change**.

How the split was done:

1. Every top-level declaration was copied **byte for byte** into its new module,
   along with the comments attached to it.
2. The only additions were `import` lines at the top and an `export { … }` block
   at the bottom. No original line was edited.
3. The two original React imports were replaced with per-module imports.
   `import React from "react"` was unused — the codebase never calls `React.*` —
   so it was dropped; JSX uses Vite's automatic runtime.

The split was performed with an AST tool (`acorn` + `acorn-jsx`) rather than
regex guesswork: the dependency graph was built from real `Identifier` and
`JSXIdentifier` nodes, excluding property names and object keys.

### Two placement decisions

`buildVariationFens` moved out of `lib/chess/fen.js` into
`lib/chess/variations.js`. It calls `sanToMove` (in `pgn.js`), while `pgn.js`
calls `sqName` (in `fen.js`) — a cycle between the two modules. Separating it
makes the graph fully acyclic. The function itself was not changed.

`EventJoinButton` lived in the Dashboard section of the original file but is
shared with `EventsPage`, so it went to `components/ui/` rather than
`features/dashboard/`.

### Verification

| Check                                                | Result                                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| Every original line preserved, exactly once          | 0 non-blank lines lost (only the 2 old React imports dropped)                 |
| Per-module syntax (acorn-jsx)                        | 125 / 125 valid                                                               |
| Imports resolve and named exports exist              | 0 errors                                                                      |
| Circular dependencies (Tarjan SCC)                   | 0                                                                             |
| `npm run build`                                      | Succeeded — 149 modules, exit 0                                               |
| Bundle AST: string literal count                     | Exact match                                                                   |
| Bundle AST: numeric literal count                    | Exact match                                                                   |
| Bundle AST: identifier count                         | 41,538 = 41,538, matching after normalising bundler-renumbered React bindings |
| Real jsdom render, DOM HTML compared to the original | **Byte-identical (7,688 bytes, empty diff)**                                  |

That last check is the strongest evidence: the original and the split version
produce the same DOM tree.

### What changed afterwards

The split preserved behaviour exactly, including its bugs. A subsequent pass
fixed them; the notable ones are recorded in [CHANGELOG.md](CHANGELOG.md):

- Conditional hooks in the ChessFlix post form, which crashed React whenever the
  permission flag changed between renders.
- `PuzzleBoard` ignoring the live position it was handed, so solved puzzles
  showed pieces that had never moved.
- Twenty-three components defined inside a parent's render, which remounted their
  subtrees on every keystroke — including the one that made the rating input lose
  focus after a single character.
- A `key` passed through a spread object in `MoveList`.
- Global reset and page background scoped inside the main shell, so the screens
  rendered before it showed the browser's default white.

## Conventions for new code

- **Never define a component inside another component's render.** It is a new
  type on every render, so React destroys and rebuilds the whole subtree. Hoist it
  to module scope and pass what it needs as props.
- **All hooks before any early return.** Conditional hooks change the hook count
  between renders, which is a hard crash rather than a subtle bug.
- **Keys are real identifiers, not array indices,** wherever the list can be
  reordered or filtered.
- **`lib/` stays pure.** No React, no storage, no `window` beyond feature
  detection.
- **Static data belongs in `data/`.** Anything that reads or writes persistent
  state belongs in `services/`.
- **New modules get JSDoc on exported functions,** and a `// @ts-check` pragma
  once the annotations are complete. That ratchet only ever tightens.

## Known limitations

These are deliberate, current trade-offs rather than oversights:

- **The backend is built but not yet adopted.** `supabase/` holds a complete
  schema and `src/lib/supabase/` a tested client layer, but the feature screens
  still read the bundled constants in `src/data/` and persist through the
  storage bridge. `services/contentSource.js` is the seam; migrating a feature
  is a one-line import change, done deliberately per feature rather than in one
  sweep. Until a feature moves, its permission checks remain client-side.
- **No URL routing.** Navigation state is in memory, so the back button does not
  move between screens and pages cannot be linked to.
- **Inline styles throughout.** Every component computes its own colours from a
  `dark` prop. It works and is consistent, but it prevents CSS-level theming and
  keeps the styling in the JavaScript payload.
- **`checkJs` is off globally.** JSX components infer every destructured prop as
  required, so a blanket type check buries real findings. Modules opt in
  individually as their JSDoc is completed.
