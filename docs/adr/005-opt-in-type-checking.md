# ADR 005: Opt-in type checking with `// @ts-check`

- **Status:** Accepted
- **Date:** 2026-08-24

## Context

The codebase is plain JavaScript. We wanted the class of bug a type checker
catches — misspelled imports, wrong call signatures, property access on the wrong
shape — without a TypeScript migration.

Turning on `checkJs: true` across `src/` was tried first. It produced hundreds of
errors, and almost none of them were real. The dominant pattern:

```jsx
function ToolBtn({ active, onClick, title, children, accent, border, dark }) { … }

// TypeScript infers every destructured prop as *required*, so every call site
// that omits an optional prop is an error:
<ToolBtn title="Flip board" onClick={flip} />
//  ✗ Property 'active' is missing in type … but required in type …
```

That is not a bug — `active` is legitimately optional. Fixing it properly means
annotating every component's props, which is a large, low-yield change to make in
one pass. Meanwhile the genuine findings were buried.

## Decision

`checkJs` is **off globally**. Modules opt in individually by adding a
`// @ts-check` pragma as their first line, once their JSDoc is complete:

```js
// @ts-check
import { __cacheGet, __cacheSet } from "./storageBridge.js";
```

`npm run typecheck` runs `tsc --noEmit` and enforces the annotations in every
opted-in module. `tsconfig.json` also gives editors path-alias resolution and
IntelliSense across the whole project regardless.

Currently opted in: `src/lib/storage/jsonStore.js`,
`src/features/learningTree/treeLayout.js`.

**The ratchet only tightens.** Adding a module to the list is a welcome
contribution. Removing a `// @ts-check` is not — if a module's types are failing,
the types are the thing to fix.

## Alternatives considered

| Option                                                      | Why not                                                                                                                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Full TypeScript migration**                               | The right long-term answer, and far too large to do alongside a bug-fix pass. It also cannot be done incrementally _and_ usefully without exactly the per-file opt-in this ADR describes. |
| **`checkJs: true` everywhere**                              | Tried. Hundreds of false positives from JSX prop inference drown the real findings, which means the check gets ignored, which means it does nothing.                                      |
| **`checkJs: true` with `strict: false` and rules disabled** | Disabling enough rules to quiet the noise also disables the checks worth having.                                                                                                          |
| **No type checking at all**                                 | Leaves misspelled imports and wrong signatures to be caught at runtime, or not at all.                                                                                                    |
| **JSDoc without enforcement**                               | Unenforced annotations drift out of date and become actively misleading.                                                                                                                  |

## Consequences

### What this makes easier

- `npm run typecheck` is green, so a failure means something real. A check nobody
  trusts is worse than no check.
- Each newly annotated module is a permanent gain — it cannot silently regress.
- The migration is incremental: any contributor can annotate one module without
  coordinating with anyone.
- Editors get IntelliSense and alias resolution project-wide today.

### What this makes harder

- Coverage is partial, and which modules are covered is not obvious without
  looking. The list is documented in
  [TESTING.md](../TESTING.md#type-checking-as-a-second-net).
- Contributors need to know the pragma exists. Documented in
  [STYLE_GUIDE.md](../STYLE_GUIDE.md#jsdoc-and-types) and
  [CONTRIBUTING.md](../../CONTRIBUTING.md).

### What we accept

Most of the codebase is unchecked today, and will be for a while. Partial
enforcement that people trust beats total enforcement that people suppress.

## When to revisit

When a clear majority of `lib/` and `services/` carries `// @ts-check`, flip
`checkJs` to `true` and use `// @ts-nocheck` on the remainder — inverting the
default. A full TypeScript migration becomes worth costing at that point too.
