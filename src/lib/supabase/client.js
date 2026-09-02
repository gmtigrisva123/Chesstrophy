// ── SUPABASE CLIENT ───────────────────────────────────────────────────────────
// The backend is *optional*. With no environment configured, this module
// resolves to "not enabled" and the app runs exactly as it always has, against
// the local storage bridge. Nothing here is imported at module-evaluation time
// by application code — see `getSupabaseClient()` below.
//
// Why the SDK is loaded dynamically:
//   @supabase/supabase-js is ~40 kB gzipped. A project running local-first
//   should not pay for it, and a project using Supabase should not pay for it
//   before the first query. The dynamic import keeps it out of the entry chunk
//   either way, which is what keeps the bundle budget honest.

/**
 * @typedef {import("@supabase/supabase-js").SupabaseClient} SupabaseClient
 */

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * Whether a backend is configured. Synchronous and cheap, so call sites can
 * branch without awaiting anything.
 *
 * This deliberately does not validate the credentials — a wrong key is a
 * runtime error the caller surfaces, not a reason to silently fall back and
 * hide a misconfiguration.
 *
 * @returns {boolean}
 */
function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** @type {Promise<SupabaseClient> | null} */
let clientPromise = null;

/**
 * Returns the shared Supabase client, creating it on first use.
 *
 * One instance per tab: several would each open their own auth listener and
 * realtime socket, and they would disagree about the current session.
 *
 * @returns {Promise<SupabaseClient>}
 * @throws {Error} when no backend is configured — check `isSupabaseConfigured()` first.
 */
function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
        "(see .env.example), or check isSupabaseConfigured() before calling this.",
    );
  }

  clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Sessions survive a reload and refresh themselves in the background.
        persistSession: true,
        autoRefreshToken: true,
        // The app has no OAuth redirect flow yet; parsing the URL for tokens
        // would only be a way to be confused by an unrelated query string.
        detectSessionInUrl: false,
        storageKey: "chessprophy.auth",
      },
      global: {
        headers: { "x-application-name": "chessprophy" },
      },
      db: { schema: "public" },
    }),
  );

  return clientPromise;
}

/**
 * Resets the memoised client. Tests only — production code has no reason to
 * discard a live session.
 */
function __resetSupabaseClient() {
  clientPromise = null;
}

export { isSupabaseConfigured, getSupabaseClient, __resetSupabaseClient, SUPABASE_URL };
