// ── HOST STORAGE ADAPTER ──────────────────────────────────────────────────────
// The application talks to `window.storage`, the async key-value API provided by
// the artifact host it was originally written for (see lib/storage/storageBridge.js).
//
// This file is infrastructure, not application logic: it does nothing when a real
// `window.storage` is present, and otherwise supplies a localStorage-backed
// implementation of the exact same contract so the app persists normally when it
// runs as a standalone Vite app. No application code is aware of this file.
//
//   get(key) -> Promise<{ value: string } | null>
//   set(key, value) -> Promise<void>

if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? null : { value };
      } catch {
        return null;
      }
    },
    async set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* quota exceeded or storage disabled — same silent failure as the host API */
      }
    },
  };
}
