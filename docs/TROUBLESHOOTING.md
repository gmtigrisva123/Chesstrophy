# Troubleshooting

Problems people actually hit, and what fixes them.

## Setup

### `npm install` fails on an engine check

```
npm error engine Unsupported engine
```

Node is older than 20.19. Check with `node --version`, then:

```bash
nvm use            # reads .nvmrc
# or
nvm install 20.19.0 && nvm use 20.19.0
```

### `npm ci` fails but `npm install` works

`npm ci` requires the lockfile to match `package.json` exactly. If you edited
dependencies by hand, run `npm install` once to regenerate the lockfile and
commit the result.

### Install succeeds but nothing runs

A partially-written `node_modules` from an interrupted install:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Dev server

### Port 5173 is already in use

Another Vite server is running. Either stop it, or pick a different port:

```bash
PORT=5174 npm run dev
```

`vite.config.js` reads `PORT`, so this works without editing anything.

### Changes do not appear in the browser

1. Check the terminal for a build error — HMR stops applying updates after one.
2. Hard reload: <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>.
3. Clear Vite's cache: `rm -rf node_modules/.vite && npm run dev`.

### The app shows the landing page every time

`hasSeenLanding` lives in storage. Clearing site data — or a browser in private
mode, where `localStorage` writes are dropped — resets it. This is expected.

To reset deliberately, run in the browser console:

```js
Object.keys(localStorage)
  .filter((k) => k.startsWith("chessprophy_") || k.startsWith("cp_"))
  .forEach((k) => localStorage.removeItem(k));
location.reload();
```

## Build

### `npm run build` fails with an unresolved import

Almost always a case mismatch or a missing extension. Imports in this codebase
include the extension: `./profile.js`, not `./profile`. macOS filesystems are
case-insensitive, so `./Profile.js` resolves locally and fails in CI on Linux.

### The build succeeds but the deployed page is blank

Wrong base path. Assets are requested from `/assets/…` while the site is served
from `/<repo>/`. Build with the base path set:

```bash
npm run build -- --base /Chesstrophy/
```

The [Pages workflow](../.github/workflows/deploy.yml) does this automatically.

### Bundle budget failure

```
✗ Initial bundle is over budget by 12.4 kB gzip.
```

Run `npm run analyze` and read the "Initial download" section. Usually one of:

- A new route was added eagerly instead of via `lazy()`.
- Something in the entry chunk now imports a large `data/` module.
- A new dependency landed in the entry chunk.

See [PERFORMANCE.md](PERFORMANCE.md).

## Tests

### `window.storage is not defined`

The test needs the storage stub. [`tests/setup.js`](../tests/setup.js) installs it
per test, but code that reads at import time needs the cache hydrated first:

```js
beforeEach(async () => {
  await __bootstrapStorage();
});
```

### `matchMedia is not a function`

jsdom does not implement it. The setup file stubs it — check that the test file is
matched by `include` in the `test` block of `vite.config.js`.

### A test passes alone but fails in the suite

State leaking between tests. Every test gets a fresh `window.storage`, but a
module-level cache in the code under test persists across a file. Call
`__bootstrapStorage()` in `beforeEach`, and prefer testing through the public API
rather than reaching into module state.

### `Rendered more hooks than during the previous render`

A real bug, not a test problem: a hook is being called after an early return. See
the [style guide](STYLE_GUIDE.md#all-hooks-before-any-early-return).

## Lint and types

### CI fails on lint but it passes locally

CI runs with `--max-warnings=0`. Reproduce it exactly:

```bash
npm run lint -- --max-warnings=0
```

### `format:check` fails on a file you did not touch

Run `npm run format` and commit the result. Note that `src/**` is deliberately
excluded from Prettier — see the explanation in
[`.prettierignore`](../.prettierignore).

### `typecheck` reports errors in a file with no types

That file has a `// @ts-check` pragma. The errors are real. Fix the JSDoc rather
than removing the pragma — see
[STYLE_GUIDE.md](STYLE_GUIDE.md#jsdoc-and-types).

## Runtime

### An input loses focus after each keystroke

A component is defined inside a parent's render, so React destroys and rebuilds
the subtree on every state change. Hoist it to module scope. This is the most
common cause of "the UI feels wrong but nothing errors" in this codebase — see
[STYLE_GUIDE.md](STYLE_GUIDE.md#never-define-a-component-inside-another-component).

### A board does not update after a move

The board is rendering a stale position. Confirm the live position is being
passed down rather than re-derived from a starting FEN — the exact bug behind
[the `PuzzleBoard` fix](../CHANGELOG.md).

### A page shows the recovery screen

The error boundary caught a render error. In development the screen includes the
stack; the browser console has the full component trace. Fix the underlying
throw — the boundary is a safety net, not a solution.

### Progress does not survive a reload

Check the console for `[storage] failed to write …`. Common causes: private
browsing, a full storage quota, or storage disabled by policy. The app keeps
working from its in-memory cache in that session, it just cannot persist.

## Still stuck?

Open a [discussion](https://github.com/gmtigrisva123/Chesstrophy/discussions) with
your Node version, OS, browser, and the exact output as text. See
[SUPPORT.md](../SUPPORT.md).
