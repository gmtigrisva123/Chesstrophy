# Testing

## Running tests

```bash
npm test                      # once, the way CI runs it
npm run test:watch            # re-run affected tests as you edit
npm run test:ui               # browser UI for exploring the suite
npm run test:coverage         # write a coverage report to coverage/
npm test -- src/lib/chess     # a single directory
npm test -- -t "castling"     # tests whose name matches
```

## Stack

| Tool                                                            | Role                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [Vitest](https://vitest.dev)                                    | Runner. Shares the Vite config, so aliases and transforms match the app exactly. |
| [jsdom](https://github.com/jsdom/jsdom)                         | DOM implementation.                                                              |
| [Testing Library](https://testing-library.com/react)            | Renders components and queries them the way a user perceives them.               |
| [jest-dom](https://github.com/testing-library/jest-dom)         | DOM matchers — `toBeInTheDocument`, `toHaveAttribute`.                           |
| [user-event](https://testing-library.com/docs/user-event/intro) | Realistic interaction: real focus, key sequences, pointer events.                |
| `@vitest/coverage-v8`                                           | Coverage via V8's native instrumentation.                                        |

Configuration lives in the `test` block of [`vite.config.js`](../vite.config.js).

## Layout

Tests sit next to the code they cover:

```
src/lib/chess/engine.js
src/lib/chess/engine.test.js
src/components/chess/PuzzleBoard.jsx
src/components/chess/PuzzleBoard.test.jsx
```

Co-location keeps a test visible when the module it covers is edited, and makes
it obvious when a module has none.

## The environment

[`tests/setup.js`](../tests/setup.js) runs before every file and provides:

**A fresh `window.storage` per test.** The app persists through this async
key-value API. Each test gets a clean in-memory implementation of the same
contract, so no test can observe another's writes.

```js
import { beforeEach } from "vitest";
import { __bootstrapStorage } from "../lib/storage/storageBridge.js";

beforeEach(async () => {
  // Hydrates the in-memory cache the way App.jsx does at boot.
  await __bootstrapStorage();
});
```

**Stubs jsdom lacks:** `window.matchMedia` and `ResizeObserver`, both of which
components call on mount.

**Automatic cleanup:** unmounting, un-stubbing globals, and restoring spies after
every test.

## What to test, by layer

### `lib/` — pure functions

Highest value per line. These have no dependencies and are used everywhere, so
test the edges rather than the happy path.

```js
it("relocates the rook when the king castles kingside", () => {
  const after = applySimpleMove(fenBoard(POSITION), nameToSq("e8"), nameToSq("g8"));
  expect(after[nameToSq("f8")]).toBe("r");
  expect(after[nameToSq("h8")]).toBeNull();
});
```

### `services/` — persistent state

Test through the public `loadX` / `saveX` surface, never the storage internals.
The valuable cases are the invariants:

```js
// Idempotency is what stops refresh-farming.
it("is idempotent per (type, referenceId)", () => {
  grantReward("course_complete", "kp-vs-k", { coins: 100, xp: 250 });
  expect(grantReward("course_complete", "kp-vs-k", { coins: 100, xp: 250 })).toBeNull();
  expect(loadEconomy().coins).toBe(100);
});

// Back-compat: a profile stored before a field existed must pick up its default.
it("back-fills fields added after a profile was stored", () => {
  saveProfile({ username: "Legacy" });
  expect(loadProfile().themeMode).toBe(defaultProfile().themeMode);
});
```

### `components/` — what the user perceives

Assert on rendered output, not internal state. If the implementation is rewritten
and the behaviour is unchanged, the test should still pass.

```js
// ✓ What the user sees.
expect(screen.getByRole("button", { name: "Post Content" })).toBeInTheDocument();

// ✗ Couples the test to the implementation.
expect(wrapper.state.title).toBe("");
```

Prefer accessible queries, in this order: `getByRole` → `getByLabelText` →
`getByText` → `getByTestId`. A query that is hard to write is usually the
component telling you it is hard to use.

## Testing a bug fix

Every bug fix gets a test that **fails before the fix and passes after it**, with
a comment naming the bug. Verify it fails first — a regression test that never
could have failed protects nothing.

```jsx
// Regression: the editor's useState calls used to sit *after* an early return
// on !canPost, so flipping the flag changed the hook count between renders and
// crashed React with "Rendered more hooks than during the previous render".
it("survives canPost flipping between renders", () => {
  const { rerender } = render(<ChessFlixPostForm canPost={false} {...props} />);
  expect(() => rerender(<ChessFlixPostForm canPost {...props} />)).not.toThrow();
});
```

## Coverage

Coverage is reported, not gated. A number does not tell you whether the important
paths are covered, and a threshold mostly produces tests written to satisfy it.

What we do care about:

| Area              | Expectation                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `src/lib/`        | High. Pure, widely used, cheap to test.                          |
| `src/services/`   | Every invariant covered — idempotency, migrations, spend gating. |
| `src/components/` | Shared primitives and anything with a fixed bug.                 |
| `src/features/`   | Interactive logic. Presentational markup is not worth pinning.   |
| `src/data/`       | Excluded. It is content, not code.                               |

```bash
npm run test:coverage
open coverage/index.html
```

## Type checking as a second net

`npm run typecheck` runs `tsc` over the JSDoc. `checkJs` is off globally — JSX
components infer every destructured prop as required, so a blanket check buries
real findings under false positives.

Modules opt in individually with a `// @ts-check` pragma once their annotations
are complete:

```js
// @ts-check
import { __cacheGet, __cacheSet } from "./storageBridge.js";
```

Currently opted in: `src/lib/storage/jsonStore.js`,
`src/features/learningTree/treeLayout.js`. Adding a module to that list is a
welcome contribution. Removing one is not.

## What is not tested yet

Honest gaps, tracked in [ROADMAP.md](ROADMAP.md):

- **No end-to-end tests.** Full user journeys — onboarding through to solving a
  puzzle — are verified manually. Playwright is the intended tool.
- **No visual regression tests.** Theme and layout changes are checked by eye
  against both colour schemes.
- **The larger feature screens** (`LearningTreePage`, `DailyQuestionsSection`)
  have logic worth covering that has none.
