# ADR 003: Switch-based navigation instead of a router library

- **Status:** Accepted
- **Date:** 2026-08-24

## Context

The application has thirteen top-level screens. Navigation state currently lives
in a single `active` string in the app shell, mapped to a component by a `switch`:

```jsx
const [active, setActive] = useState("Home");

switch (active) {
  case "Home":
    return <Dashboard dark={dark} setActive={setActive} />;
  case "Puzzles":
    return <PuzzlesPage dark={dark} />;
  // …
}
```

This came from the original single-file implementation, where a router was not
an option. The question when splitting the file was whether to keep it.

## Decision

We keep switch-based navigation for now, and treat adding a router as a scoped,
deliberate change rather than something to do in passing.

The navigation logic is confined to `app/ChessProphyApp.jsx`. Features receive
`setActive` as a prop and never import navigation state, so the migration surface
is one file plus the prop threading.

## Alternatives considered

| Option                                    | Why not _yet_                                                                                                                                                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React Router**                          | ~10 kB gzipped and a real API surface, for a benefit — URLs — that nothing currently requires. Adding it during the file split would have mixed a behavioural change into a refactor that was verified to have none. |
| **A hash router hand-rolled**             | Most of the complexity of a router with none of the maturity.                                                                                                                                                        |
| **`navigation` API / `history` directly** | Same objection, plus browser support work.                                                                                                                                                                           |

## Consequences

### What this makes easier

- Zero dependencies and zero configuration for navigation.
- Navigation state is one variable in one file, trivially readable.
- No base-path or fallback configuration needed at deploy time.

### What this makes harder

- **No deep links.** No screen can be bookmarked, shared or linked to.
- **The back button does not navigate.** It leaves the app.
- **No route-level analytics** without threading an extra call through.
- **State is lost on reload** — the app returns to the dashboard.

### What we accept

These are real product limitations, not just technical ones. We accept them at
the current stage: the app is a personal learning tool used in a single sitting,
and no user need for linking has surfaced. This is recorded as a known limitation
in [ARCHITECTURE.md](../../ARCHITECTURE.md) and as planned work in
[ROADMAP.md](../ROADMAP.md) so it stays visible rather than becoming invisible
through familiarity.

## When to revisit

Any one of these makes the decision wrong:

- Users need to share a link to a specific course, opening or puzzle.
- Back-button behaviour is reported as a bug more than once.
- Route-level analytics become a requirement.
- Screens grow nested navigation deep enough that a second `switch` appears
  inside a feature.
