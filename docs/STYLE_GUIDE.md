# Style guide

Conventions specific to this codebase. General JavaScript style is handled by
ESLint and Prettier — this document covers the decisions a linter cannot make for
you.

## Contents

- [React](#react)
- [State](#state)
- [Styling](#styling)
- [Modules and imports](#modules-and-imports)
- [Naming](#naming)
- [Comments](#comments)
- [JSDoc and types](#jsdoc-and-types)
- [Accessibility](#accessibility)

## React

### Never define a component inside another component

This is the single most consequential rule here, because breaking it produces
bugs that look like something else entirely.

```jsx
// ✗ `Card` is a *different function* on every render of Page. React compares
//    component types by identity, sees a new type, and destroys the entire
//    subtree — including DOM state like focus, scroll position, and in-flight
//    CSS transitions.
function Page({ dark }) {
  const Card = ({ children }) => <div style={{ background: dark ? "#111" : "#fff" }}>{children}</div>;
  return (
    <Card>
      <input />
    </Card>
  ); // this input loses focus on every keystroke
}

// ✓ Stable type. Pass what it closed over as props.
function Card({ children, background }) {
  return <div style={{ background }}>{children}</div>;
}
```

When a hoisted component needs many theme values, bundle them into one prop
rather than threading six:

```jsx
const cardTheme = { fg, muted, card, border };
return items.map((item) => <ItemCard key={item.id} item={item} theme={cardTheme} />);
```

`react/no-unstable-nested-components` catches this.

### All hooks before any early return

```jsx
// ✗ Hook count changes when `ready` flips → "Rendered more hooks than during
//    the previous render", a hard crash.
function Panel({ ready }) {
  if (!ready) return <Skeleton />;
  const [value, setValue] = useState("");
}

// ✓ Split the gate from the gated component.
function Panel({ ready }) {
  return ready ? <PanelBody /> : <Skeleton />;
}
```

### Keys

Use a stable identifier. An array index is acceptable only when the list is
fixed — never for anything filtered, sorted, or reordered, where React will reuse
the wrong DOM node and carry state across items.

```jsx
{
  moves.map((move) => <Chip key={move.id} move={move} />);
} // ✓
{
  errors.map((message) => <li key={message}>{message}</li>);
} // ✓ text is unique
{
  items.map((item, i) => <Row key={i} item={item} />);
} // only if fixed
```

Never pass `key` through a spread object — React 18 warns, React 19 drops it:

```jsx
const props = { key: id, onClick };
<button {...props} />          // ✗
<button key={id} {...props} /> // ✓
```

### Effects

An effect exists to synchronise with something outside React. Deriving a value
from props or state is not that — compute it during render.

```jsx
// ✗ An extra render for something derivable.
const [total, setTotal] = useState(0);
useEffect(() => setTotal(items.length * 2), [items]);

// ✓
const total = items.length * 2;
```

Always return a cleanup for subscriptions, timers and listeners.

## State

Three places, and which one is never ambiguous:

| Kind                                         | Where                                      |
| -------------------------------------------- | ------------------------------------------ |
| Static content that never changes at runtime | `src/data/`                                |
| Persistent user state                        | `src/services/`, via `loadX()` / `saveX()` |
| Ephemeral view state                         | `useState` in the component that owns it   |

UI code never touches storage directly. If a component imports from
`lib/storage/`, that is a layering violation — the read belongs in a service.

## Styling

The codebase uses inline style objects. This is a legacy of its origin as a
single file; it is consistent, so keep it consistent.

- Colours come from the `dark` prop and the shared palettes in `src/theme/`.
- Genuinely document-wide rules — reset, tokens, shared keyframes, scrollbars —
  live in `src/styles/global.css`. Nothing component-specific belongs there.
- Media queries need a class, so scope them to a `<style>` tag in the component
  that owns them.

New global CSS should use the `--cp-*` custom properties keyed off `data-theme`,
which is how the page background already works.

## Modules and imports

Every module ends with an explicit export block. It makes the public surface of a
file readable at a glance:

```js
export { loadProfile, saveProfile };
```

Imports are ordered — external packages, then internal, then relative — and
alphabetised within each group. `import/order` enforces it and `--fix` sorts it
for you.

Include the file extension: `./profile.js`, not `./profile`. The build resolves
either, but the explicit form matches the ESM specification and keeps editor
tooling honest.

The `@/` alias maps to `src/`. Prefer relative imports within a feature and the
alias when reaching across the tree.

## Naming

| Kind                   | Convention                                            | Example                                  |
| ---------------------- | ----------------------------------------------------- | ---------------------------------------- |
| Component file         | `PascalCase.jsx`                                      | `PuzzleBoard.jsx`                        |
| Non-component module   | `camelCase.js`                                        | `jsonStore.js`                           |
| Component              | `PascalCase`                                          | `function MoveList() {}`                 |
| Function, variable     | `camelCase`                                           | `loadProfile`                            |
| Module constant        | `SCREAMING_SNAKE_CASE`                                | `LEVEL_THRESHOLDS`                       |
| Storage key            | `SCREAMING_SNAKE_CASE`, value prefixed `chessprophy_` | `PROFILE_KEY = "chessprophy_profile"`    |
| Boolean                | Reads as a predicate                                  | `isLearned`, `hasSeenLanding`, `canPost` |
| Event handler prop     | `on` + event                                          | `onOpenVariation`                        |
| Event handler function | `handle` + event                                      | `handleSquareClick`                      |

Underscore-prefixed exports (`__cacheGet`, `__bootstrapStorage`) mark
infrastructure that application code must not call directly.

## Comments

Comments explain **why**, never what. The code already says what it does.

```js
// ✗ Restates the code.
// Loop through the moves and apply each one.

// ✓ Records the constraint that shaped the code.
// Side to move is fixed for the whole puzzle: the player always plays the
// puzzle's colour and the opponent's replies are auto-played from `solution`.
```

Comments worth writing:

- **The constraint.** "The boot gate loads all persisted data before mount, so
  every `loadX()` can stay synchronous."
- **The trade-off.** "Module scope so the toolbar is not rebuilt on every move."
- **The bug.** "This ignored the `board` prop, so solved puzzles showed pieces
  that had never moved."
- **The deliberate absence.** "Not read here rather than guessing a mapping."

## JSDoc and types

Exported functions get JSDoc. Document the _contract_, not the obvious:

```js
/**
 * Reads and parses the JSON document stored under `key`.
 *
 * @template T
 * @param {string} key - Storage key.
 * @param {() => T} createDefault - Builds the value used when nothing is stored
 *   or the stored value cannot be parsed. Called lazily.
 * @returns {T} The parsed document, or a freshly built default.
 */
```

For a component with destructured props, document the props object as a whole —
one `@param {object} props` plus `props.*` entries, or an inline object type.
Documenting the destructured names directly is a JSDoc error.

Once a module's annotations are complete, add `// @ts-check` as its first line.
`npm run typecheck` starts enforcing them from that point on. This ratchet only
ever tightens — never remove a `// @ts-check`.

## Accessibility

- Interactive elements are `<button>`, not `<div onClick>`.
- Icon-only buttons carry `aria-label` (or `title`, which the linter accepts).
- Every `<label>` is associated with its control via `htmlFor` / `id`.
- Images that convey meaning have descriptive `alt`; decorative ones use `alt=""`.
- Toggles expose `aria-pressed`; the active nav item exposes `aria-current`.
- Loading regions use `role="status"` with `aria-live="polite"`.
- Error states use `role="alert"`.

`jsx-a11y` catches most of this. When a rule is genuinely wrong for a line,
disable it inline **with the reason**:

```jsx
/* eslint-disable-next-line jsx-a11y/no-autofocus --
   Sole interactive element of this wizard step; focusing it is expected
   behaviour rather than a focus steal. */
```

A bare `eslint-disable` with no reason will be asked about in review.
