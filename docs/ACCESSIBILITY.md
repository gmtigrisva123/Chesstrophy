# Accessibility

Chess is played by people with a wide range of vision, motor control and
attention. A learning platform that only works for some of them is not finished.

## The bar

**WCAG 2.1 Level AA**, with these as non-negotiable:

|              |                                                                      |
| ------------ | -------------------------------------------------------------------- |
| **Keyboard** | Every interactive element reachable and operable without a mouse.    |
| **Focus**    | Always visible, and in an order that matches the visual layout.      |
| **Contrast** | 4.5:1 for body text, 3:1 for large text and UI boundaries.           |
| **Names**    | Every control has an accessible name — visible text or `aria-label`. |
| **Motion**   | `prefers-reduced-motion` is honoured.                                |
| **Zoom**     | Usable at 200% without horizontal scrolling.                         |

An accessibility barrier is filed as a **bug**, not an enhancement. There is a
[dedicated issue template](../.github/ISSUE_TEMPLATE/accessibility.yml).

## What is already in place

- **Semantic controls.** Interactive elements are `<button>`, so keyboard
  activation, focus and role come for free.
- **Named icon buttons.** Board toolbars, move navigation and nav items all carry
  `aria-label` or `title`.
- **Meaningful piece alternatives.** A piece announces "White knight", not the
  raw FEN letter `N`.
- **State exposed to assistive technology.** Toggles use `aria-pressed`, the
  active nav item uses `aria-current="page"`, the current ply uses
  `aria-current="step"`.
- **Live regions.** Route loading uses `role="status"` with `aria-live="polite"`;
  the error boundary uses `role="alert"`.
- **Associated labels.** Every `<label>` is bound to its control by `htmlFor`.
- **Reduced motion.** A `@media (prefers-reduced-motion: reduce)` block in
  `src/styles/global.css` collapses animation and transition durations globally.
- **Colour scheme.** `data-theme` plus `color-scheme` means form controls and
  scrollbars follow the chosen theme, and `prefers-color-scheme` is respected in
  system mode.
- **Automated linting.** `eslint-plugin-jsx-a11y` runs on every commit and in CI.

## Verifying a change

### Keyboard

Put the mouse down and use the feature:

- <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> reach everything interactive.
- <kbd>Enter</kbd> and <kbd>Space</kbd> activate buttons.
- Focus is always visible.
- Focus order follows the visual order.
- Focus never gets trapped anywhere without an escape.

### Screen reader

Free, and quicker than expected once you have done it twice:

| Platform | Reader                            | Start                                        |
| -------- | --------------------------------- | -------------------------------------------- |
| macOS    | VoiceOver                         | <kbd>Cmd</kbd>+<kbd>F5</kbd>                 |
| Windows  | [NVDA](https://www.nvaccess.org/) | <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd>  |
| Linux    | Orca                              | <kbd>Super</kbd>+<kbd>Alt</kbd>+<kbd>S</kbd> |

Listen for: does every control announce a name and a role? Is state (pressed,
current, disabled) announced? Does anything announce as "button" with no name?

### Automated

```bash
npm run lint                     # jsx-a11y rules
npx @axe-core/cli http://localhost:5173   # against a running dev server
```

Chrome DevTools → Lighthouse → Accessibility gives a quick score. Treat all of
these as a floor: they catch roughly a third of real barriers.

### Zoom and contrast

- Browser zoom to 200%: no horizontal scrolling, no clipped text.
- Check both themes. Light mode is where contrast failures usually hide.
- Reduce the viewport to 375 px and confirm nothing overflows.

## Known gaps

Honest, and tracked in [ROADMAP.md](ROADMAP.md):

| Gap                                                                                     | Impact                                                                                                     |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Boards are not keyboard operable.** Squares respond to click and drag only.           | A keyboard-only user cannot play a puzzle or a variation. This is the most significant barrier in the app. |
| **Boards have no accessible summary.** A screen reader hears 64 images, not a position. | Position and move history are not conveyed non-visually.                                                   |
| **No skip link.**                                                                       | Keyboard users tab through the full sidebar on every navigation.                                           |
| **Focus is not managed on route change.**                                               | A screen reader is not told the page changed.                                                              |
| **Contrast is unaudited in light mode.**                                                | Some muted text may fall below 4.5:1.                                                                      |
| **`autoFocus` on three wizard steps.**                                                  | Justified inline — each is the sole control on its step — but it does move focus on load.                  |

## Patterns to follow

```jsx
// Icon-only button — always name it.
<button onClick={flip} aria-label="Flip board">⇅</button>

// Toggle — expose the state, not just the styling.
<button aria-pressed={soundOn} onClick={toggle}>🔊</button>

// Current item in a set.
<button aria-current={isActive ? "page" : undefined}>Puzzles</button>

// Loading region.
<div role="status" aria-live="polite" aria-busy="true">
  <span className="visually-hidden">Loading page…</span>
</div>

// Error region.
<div role="alert">Something went wrong</div>

// Decorative image — empty alt, so it is skipped rather than announced.
<img src={mascot} alt="" />

// Meaningful image.
<img src={piece} alt="White knight" />

// Label bound to its control.
<label htmlFor="pgn">PGN</label>
<textarea id="pgn" />
```

## Reporting a barrier

Use the [accessibility issue template](../.github/ISSUE_TEMPLATE/accessibility.yml).
Tell us what you could not do, what you were using, and where. You do not need to
know the WCAG criterion — describing the barrier is enough.
