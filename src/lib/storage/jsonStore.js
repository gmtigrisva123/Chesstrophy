// @ts-check
import { __cacheGet, __cacheSet } from "./storageBridge.js";

// ── JSON PERSISTENCE HELPERS ──────────────────────────────────────────────────
// Every service in `services/` persists a single JSON document under one key.
// Before this module each of them repeated the same `try { JSON.parse(...) }
// catch {}` dance, which meant ~25 silent catch blocks and no way to tell a
// missing record apart from a corrupt one.
//
// The contract here is deliberate: persistence is *best effort*. A corrupt or
// unreadable entry must never brick the app, so reads fall back to the caller's
// default — but the failure is reported once per key so it shows up in the
// console during development instead of vanishing.

const reportedKeys = new Set();

/**
 * Logs a storage failure at most once per key, so a repeatedly-read corrupt
 * record does not flood the console on every render.
 *
 * @param {string} operation - "read" or "write".
 * @param {string} key - The storage key involved.
 * @param {unknown} error - The thrown value.
 */
function reportOnce(operation, key, error) {
  const id = `${operation}:${key}`;
  if (reportedKeys.has(id)) return;
  reportedKeys.add(id);
  console.warn(`[storage] failed to ${operation} "${key}" — falling back to defaults.`, error);
}

/**
 * Reads and parses the JSON document stored under `key`.
 *
 * @template T
 * @param {string} key - Storage key.
 * @param {() => T} createDefault - Builds the value used when nothing is stored
 *   or the stored value cannot be parsed. Called lazily.
 * @returns {T} The parsed document, or a freshly built default.
 */
function readJson(key, createDefault) {
  try {
    const raw = __cacheGet(key);
    if (raw) return JSON.parse(raw);
  } catch (error) {
    reportOnce("read", key, error);
  }
  return createDefault();
}

/**
 * Serialises `value` and persists it under `key`.
 *
 * @param {string} key - Storage key.
 * @param {unknown} value - Any JSON-serialisable value.
 * @returns {boolean} `true` when the write was accepted, `false` when storage
 *   rejected it (quota exceeded, disabled, or a serialisation cycle).
 */
function writeJson(key, value) {
  try {
    __cacheSet(key, JSON.stringify(value));
    return true;
  } catch (error) {
    reportOnce("write", key, error);
    return false;
  }
}

export { readJson, writeJson };
