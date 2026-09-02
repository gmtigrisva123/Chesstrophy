// ── CONTENT SOURCE ────────────────────────────────────────────────────────────
// The seam between the bundled catalogue in `src/data/` and the Supabase
// backend in `supabase/`.
//
// The app is local-first: with no backend configured, every function here
// resolves to the same constant the feature used to import directly, and no
// network call is made. Configure `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
// and the identical call reads from Postgres instead.
//
// Why this exists rather than each feature branching for itself:
//   · One place decides local-vs-remote, so the decision cannot drift.
//   · One place knows the fallback rule, so a backend outage degrades to
//     bundled content instead of an empty screen.
//   · Migrating a feature is a one-line import change, and reverting is the
//     same one line.
//
// Every function is async even in local mode, deliberately: a feature that
// adopts this must handle the asynchronous shape once, and never again when
// the backend is switched on.

import { ALL_GAMES } from "../data/classicGames.js";
import { OPENING_REPERTOIRE } from "../data/openingRepertoire.js";
import { PUZZLE_DB } from "../data/puzzles.js";
import { STUDIES_DATA } from "../data/studies.js";
import { isSupabaseConfigured } from "../lib/supabase/client.js";

/**
 * Runs `remote` when a backend is configured, otherwise returns `local`.
 *
 * A remote failure falls back to the bundled content rather than propagating.
 * The catalogue is reference data that ships with the app, so serving a
 * slightly stale copy is strictly better than an empty screen — and the error
 * is still reported so the outage is visible.
 *
 * @template T
 * @param {string} label - Used in the warning when the remote read fails.
 * @param {T} local - The bundled fallback.
 * @param {() => Promise<T>} remote - The Supabase read.
 * @returns {Promise<T>}
 */
async function fromBackendOrBundle(label, local, remote) {
  if (!isSupabaseConfigured()) return local;

  try {
    const result = await remote();
    // An empty result usually means an unseeded database rather than genuinely
    // no content, and rendering nothing would look like data loss.
    if (Array.isArray(result) && result.length === 0) {
      console.warn(`[content] ${label} came back empty from the backend; using bundled content.`);
      return local;
    }
    return result ?? local;
  } catch (error) {
    console.error(`[content] ${label} failed to load from the backend; using bundled content.`, error);
    return local;
  }
}

/** Lazily loaded so the Supabase SDK stays out of the bundle when unconfigured. */
async function catalogue() {
  return import("../lib/supabase/repositories/catalogue.js");
}

/**
 * The opening repertoire, in the shape `OPENING_REPERTOIRE` exports.
 * @returns {Promise<typeof OPENING_REPERTOIRE>}
 */
async function loadOpenings() {
  return fromBackendOrBundle("openings", OPENING_REPERTOIRE, async () =>
    (await catalogue()).fetchOpenings(),
  );
}

/**
 * The puzzle catalogue, in the shape `PUZZLE_DB` exports.
 * @returns {Promise<typeof PUZZLE_DB>}
 */
async function loadPuzzles() {
  return fromBackendOrBundle("puzzles", PUZZLE_DB, async () => (await catalogue()).fetchPuzzles());
}

/**
 * Annotated master games, in the shape `ALL_GAMES` exports.
 * @param {{page?: number, pageSize?: number}} [options]
 * @returns {Promise<typeof ALL_GAMES>}
 */
async function loadClassicGames(options) {
  return fromBackendOrBundle("classic games", ALL_GAMES, async () =>
    (await catalogue()).fetchClassicGames(options),
  );
}

/**
 * Courses grouped by category, in the shape `STUDIES_DATA` exports.
 * @returns {Promise<typeof STUDIES_DATA>}
 */
async function loadStudies() {
  return fromBackendOrBundle("studies", STUDIES_DATA, async () => (await catalogue()).fetchStudies());
}

/**
 * Whether reads are currently served by the backend. For diagnostics and for
 * UI that legitimately differs — a "syncing" badge, say — never for deciding
 * what a user is allowed to do.
 *
 * @returns {boolean}
 */
function isRemoteContentEnabled() {
  return isSupabaseConfigured();
}

export { loadOpenings, loadPuzzles, loadClassicGames, loadStudies, isRemoteContentEnabled };
