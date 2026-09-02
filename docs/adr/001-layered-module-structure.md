# ADR 001: Layered module structure with a one-way dependency rule

- **Status:** Accepted
- **Date:** 2026-08-24

## Context

The application began as one 12,773-line file containing 261 top-level
declarations: React components, chess logic, static content, persistence
helpers, and theme constants, interleaved.

At that size the practical problems were not aesthetic. Any change required
reading around it for unrelated context. Nothing could be tested in isolation
because nothing could be imported in isolation. Two people could not work in
different areas without conflicting. And no tool could tell you what a given
function actually depended on.

The split needed a structure, and the structure needed to be enforceable —
otherwise it degrades into folders that describe where files happened to land.

## Decision

Code is organised into layers, and **dependencies flow in one direction only**:

```
features → components → hooks → services → data → lib → theme/assets
```

| Layer               | Contains                              | May import from                   |
| ------------------- | ------------------------------------- | --------------------------------- |
| `features/`         | One directory per screen              | Everything below                  |
| `components/`       | Reusable UI, no business knowledge    | `hooks`, `lib`, `theme`, `assets` |
| `hooks/`            | Shared React hooks                    | `services`, `lib`                 |
| `services/`         | Persistent state and business rules   | `data`, `lib`                     |
| `data/`             | Static content                        | Nothing                           |
| `lib/`              | Pure utilities — no React, no storage | `lib` only                        |
| `theme/`, `assets/` | Colours, palettes, images             | Nothing                           |

`import/no-cycle` enforces acyclicity in CI. Cross-feature imports require a
justification in the pull request; there are currently four, all deliberate
composition.

## Alternatives considered

| Option                                                              | Why not                                                                                                                                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Leave it as one file**                                            | Every problem above compounds with every change.                                                                                                                           |
| **Group by technical kind** (`components/`, `utils/`, `constants/`) | Says nothing about what may depend on what. A "utils" folder ends up importing from components within months.                                                              |
| **Feature-first with no shared layers**                             | Chess logic and the piece set are used by nine screens. Duplicating them, or letting features import from each other freely, recreates the tangle at a larger granularity. |
| **A monorepo with enforced package boundaries**                     | Genuinely enforceable, and far too heavy for a single frontend app.                                                                                                        |

## Consequences

### What this makes easier

- A file's dependencies are predictable from its location.
- `lib/` is trivially testable: no DOM, no mocks, no setup.
- A feature can be deleted by deleting its directory.
- New contributors have a mechanical answer to "where does this go?".

### What this makes harder

- Adding something shared means deciding which layer owns it, rather than
  dropping it next to its first caller.
- A component that needs business logic has to receive it as props rather than
  importing a service, which lengthens some prop lists.

### What we accept

Some prop drilling, particularly for theme values. ADR 004 addresses that
specifically rather than by weakening the layering.

## When to revisit

If cross-feature imports pass roughly ten, the boundary between "feature" and
"shared" has drifted and needs redrawing — not the rule relaxed.
