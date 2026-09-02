import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// ── window.storage ────────────────────────────────────────────────────────────
// The app persists through `window.storage`, the async key-value API of the
// host it was written for (see src/platform/storageAdapter.js). Tests get a
// fresh in-memory implementation of that same contract per test, so no test can
// observe another's writes.
let store = new Map();

beforeEach(() => {
  store = new Map();
  vi.stubGlobal("storage", {
    get: vi.fn(async (key) => (store.has(key) ? { value: store.get(key) } : null)),
    set: vi.fn(async (key, value) => { store.set(key, value); }),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// jsdom implements neither of these, and several components call them on mount.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
