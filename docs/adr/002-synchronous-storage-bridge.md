# ADR 002: Synchronous storage facade over an async host API

- **Status:** Accepted
- **Date:** 2026-08-24

## Context

Every persistence call in the application was originally written against
`localStorage`, which is synchronous:

```js
function loadProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : defaultProfile();
}
```

The host environment the app targets does not provide `localStorage`. It provides
`window.storage`, an asynchronous key-value API:

```js
await window.storage.get(key); // -> { value } | null
await window.storage.set(key, value);
```

Roughly eighty call sites read persisted state synchronously during render.
Making them async would mean introducing a loading state into every component
that reads a profile, an economy balance or a progress record — which is most of
them.

## Decision

We hydrate an in-memory cache from `window.storage` **once, before the app
mounts**, and every `loadX()` / `saveX()` reads and writes that cache
synchronously. Writes flush to the host in the background.

```
services/*.js          loadX() / saveX()          — synchronous
       ▼
lib/storage/jsonStore.js   JSON encode/decode, fallback on corruption
       ▼
lib/storage/storageBridge.js   in-memory cache, hydrated once at boot
       ▼
window.storage             async host API (or the localStorage adapter)
```

`App.jsx` is the boot gate: it renders a skeleton until hydration completes.

Two supporting pieces:

- **`platform/storageAdapter.js`** supplies a `localStorage`-backed
  implementation of the same contract when `window.storage` is absent, so the app
  runs as a standalone Vite app. It does nothing when a real host API exists, and
  no application code knows it is there.
- **`lib/storage/jsonStore.js`** owns encode, decode and failure handling.
  Persistence is best-effort: a corrupt record falls back to the caller's default
  and reports once per key, rather than throwing or being silently swallowed.

## Alternatives considered

| Option                                   | Why not                                                                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Make every read async**                | Eighty call sites, each gaining a loading state. It would have doubled the size of the persistence-touching code for no user-visible benefit — the data is a few hundred kilobytes and loads in milliseconds. |
| **A React context holding all state**    | Would work, but every service becomes a hook, so nothing can be tested without a renderer, and `lib` purity is lost.                                                                                          |
| **Suspense for data fetching**           | Right shape, wrong scale. The whole dataset loads in one pass at boot; per-read suspense buys nothing.                                                                                                        |
| **Write straight through on every save** | Rejected: a save during a rapid interaction would block on an async round trip. Write-behind costs durability on an abrupt close, which is acceptable for progress data.                                      |

## Consequences

### What this makes easier

- Services stay plain synchronous functions: no hooks, no mocks, no renderer to
  test them.
- Components read persisted state during render with no loading state.
- The host API is swappable — `storageAdapter.js` is the only file that knows
  which implementation is in play.

### What this makes harder

- Every persisted key must be listed in `STORAGE_KEYS` for the boot hydration to
  find it. Forgetting is a silent bug: the read returns the default.
- Nothing sees changes another tab makes, because the cache is per-tab.

### What we accept

- A brief skeleton at boot while hydration runs.
- A write lost if the tab closes between the cache update and the flush. For
  progress data, that trade is worth the interaction latency it buys.
- Two exported names (`__cacheGet`, `__bootstrapStorage`) that application code
  must not call. The underscore prefix marks them; nothing enforces it.

## When to revisit

If persisted state grows past a few megabytes, boot hydration becomes visible and
this needs to become lazy or per-key. If real accounts arrive, this whole layer is
replaced by a server-backed client and the decision is moot.
