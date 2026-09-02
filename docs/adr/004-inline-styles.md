# ADR 004: Keep inline styles, add CSS custom properties for theming

- **Status:** Accepted
- **Date:** 2026-08-24

## Context

The entire UI is written with inline style objects, and colours are derived from
a `dark` boolean threaded down through props:

```jsx
function Card({ dark }) {
  const fg = dark ? "#f0f0f0" : "#111";
  const border = dark ? "#1f1f1f" : "#e8e8e8";
  return <div style={{ color: fg, border: `1px solid ${border}` }}>…</div>;
}
```

Roughly 13,000 lines are written this way, with dense hand-aligned style objects.
It is entirely consistent — but it prevents CSS-level theming, keeps style weight
in the JavaScript payload, requires `'unsafe-inline'` in the Content Security
Policy, and means components several levels deep receive `dark`, `fg`, `muted`,
`card` and `border` purely to pass them further down.

A concrete bug came from this: the CSS reset and page background lived in a
`<style>` tag inside the main shell. The landing, onboarding and maintenance
screens render _before_ that shell, so they got neither, and the browser's
default white showed above and below their content.

## Decision

We keep inline styles for component-level styling, and introduce CSS custom
properties for anything genuinely document-wide.

- **`src/styles/global.css`** holds the reset, page background tokens, shared
  keyframes, scrollbar styling and the `prefers-reduced-motion` block. It is
  loaded from `main.jsx`, so every screen gets it — including the ones that render
  before the shell.
- **`data-theme` on `<html>`**, kept in sync by `useThemeMode`, selects the token
  set. That is what fixed the white-band bug.
- **Component colours stay as props** for now.

Prettier is configured **not** to format `src/**`. Running it there would rewrite
~13k lines, destroy the hand alignment, and bury every future diff in noise.
Prettier owns docs, configs and CSS; ESLint owns correctness in `src/`.

## Alternatives considered

| Option                                               | Why not                                                                                                                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Migrate everything to CSS modules now**            | Touches every file in the repository. High regression risk, no user-visible benefit, and it would have to happen alongside the bug fixes rather than after them. |
| **Adopt Tailwind**                                   | Same objection at greater scale, plus a build-tooling dependency and a wholly different idiom from the existing code.                                            |
| **A CSS-in-JS runtime** (styled-components, Emotion) | Adds a runtime cost and a dependency to solve a problem that CSS custom properties solve for free.                                                               |
| **Format `src/` with Prettier anyway**               | Would produce a ~13,000-line diff with zero behavioural change, making `git blame` useless for the entire UI.                                                    |
| **Do nothing about globals**                         | Leaves the white-band bug and any future one like it.                                                                                                            |

## Consequences

### What this makes easier

- Global concerns have one obvious home, and it reaches every screen.
- The theme can change without re-rendering the tree, because CSS handles it.
- No large-scale rewrite, so the bug-fix work stayed reviewable.
- `git blame` on the UI still points at meaningful commits.

### What this makes harder

- Theming remains split: tokens for globals, props for components. Two mechanisms
  to know about.
- Prop drilling of `dark`/`fg`/`muted`/`card`/`border` continues.
- `'unsafe-inline'` stays in the CSP `style-src`.

### What we accept

The split is temporary and directional: new global styling uses tokens, and
component styling migrates to them incrementally rather than in one commit. The
end state is tokens throughout, which removes the prop drilling, moves style
weight into a cacheable stylesheet, and lets `'unsafe-inline'` be dropped.

## When to revisit

When enough components have migrated that the prop-threaded colours are the
minority, complete the migration and drop the `dark` prop entirely. Tracked in
[ROADMAP.md](../ROADMAP.md).
