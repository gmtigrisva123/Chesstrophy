# Performance

## The budget

The initial download is what a first-time visitor must fetch before the app can
paint: the entry chunk, the shared React vendor chunk, and the CSS.

|                    |     Gzipped |
| ------------------ | ----------: |
| Entry chunk        |      ~65 kB |
| React vendor chunk |      ~44 kB |
| CSS                |       ~1 kB |
| **Total**          | **~110 kB** |
| **Budget**         |  **220 kB** |

Enforced in CI by [`scripts/report-bundle-size.mjs`](../scripts/report-bundle-size.mjs).
A pull request that pushes the initial download over budget fails the build.

```bash
npm run analyze
```

The budget sits at roughly twice the current size on purpose. It is a tripwire
for regressions, not a target to grow into — a change that consumes a large part
of the remaining headroom should say why in the pull request.

Raising `INITIAL_BUDGET_KB` is allowed, but only with a comment in the commit
explaining what was traded for it.

## How it got here

The initial download was **343 kB gzipped**. It is now **~110 kB**, a 68%
reduction, from three changes:

### Route-level code splitting

Every screen except the dashboard is a `React.lazy` boundary, so twelve route
chunks load on first navigation instead of up front.

```js
const PuzzlesPage = lazy(() =>
  import("../features/puzzles/PuzzlesPage.jsx").then((m) => ({ default: m.PuzzlesPage })),
);
```

The dashboard, landing page and onboarding flow stay in the entry chunk: one of
them is always the first thing a visitor sees, so deferring them would only add a
round trip.

### A separate vendor chunk

React and React DOM are ~44 kB gzipped and change on their own schedule. Splitting
them out means a normal deploy invalidates only the app chunk in user caches.

```js
build: {
  rollupOptions: {
    output: { manualChunks: { "react-vendor": ["react", "react-dom"] } },
  },
}
```

### Images as files, not base64

The mascot, the background photo and the twelve piece sprites were inline base64
data URIs — about 200 kB of source, all of it in the JavaScript bundle. Base64 is
~33% larger than the binary it encodes, cannot be cached separately, and has to
be parsed as part of the script.

They are now real files. Vite fingerprints and emits them, the browser caches
them independently of the app code, and they download in parallel with it.
`assetsInlineLimit: 0` keeps even the small sprites as files, because they are
used by every board and a long-lived cache entry beats saving twelve requests
once.

## Rules that keep it

**Route additions are lazy by default.** A new screen goes in the `lazy()` block
in `ChessProphyApp.jsx` unless it is on the first-paint path.

**No inline base64 assets.** Put the file in `src/assets/images/` and import it.

**Watch what a shared module pulls in.** A single import from a large `data/`
module drags all of it into whichever chunk you are in. `npm run analyze` shows
where a chunk's weight came from.

**Prefer computing during render over an effect.** An effect that derives state
costs a second render pass for nothing.

**Hoist components out of render.** A component defined inside a parent's render
is a new type each time, so React rebuilds its entire subtree. This is a
correctness bug first — see [STYLE_GUIDE.md](STYLE_GUIDE.md) — and a performance
one second.

## Runtime characteristics

- **Nothing over the network at runtime.** All content is bundled; there is no
  API, so there is no request waterfall and no loading state to design around.
- **Persistence is synchronous from the app's point of view.** The boot gate
  hydrates an in-memory cache once, and writes flush in the background.
- **Animations are opt-out.** `prefers-reduced-motion` collapses every duration
  globally.

## Measuring

```bash
npm run analyze        # bundle composition against the budget
npm run build && npm run preview   # profile the real production build, never dev
```

For runtime work, use the React DevTools Profiler on a production build: the
development build's timings include work that never ships.

## Open opportunities

Tracked in [ROADMAP.md](ROADMAP.md):

- **`src/data/` is ~140 kB of source in the bundle.** `openingRepertoire.js` and
  `studies.js` alone are 65 kB. Loading them alongside their route rather than
  eagerly would trim the entry chunk further.
- **Inline styles ship in the JavaScript payload.** Moving to CSS custom
  properties would move that weight into a cacheable stylesheet and remove the
  need for `'unsafe-inline'` in the CSP.
- **The mascot JPEG is 97 kB.** A WebP or AVIF version with a JPEG fallback would
  cut that substantially.
- **No Lighthouse CI gate.** The bundle budget catches size regressions but not
  runtime ones.
