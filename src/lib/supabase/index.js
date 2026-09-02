// ── SUPABASE BACKEND ──────────────────────────────────────────────────────────
// The single entry point for the optional Supabase backend.
//
// The app is local-first by default. With no `VITE_SUPABASE_URL` /
// `VITE_SUPABASE_ANON_KEY` configured, `isSupabaseConfigured()` returns false,
// nothing in here is loaded, and the app persists to the storage bridge exactly
// as it always has. See supabase/README.md.
//
// Usage:
//
//   import { isSupabaseConfigured, catalogue } from "@/lib/supabase";
//
//   const openings = isSupabaseConfigured()
//     ? await catalogue.fetchOpenings()
//     : OPENING_REPERTOIRE;

export { isSupabaseConfigured, getSupabaseClient } from "./client.js";
export { SupabaseError, PG_ERROR } from "./errors.js";

export * as auth from "./auth.js";
export * as catalogue from "./repositories/catalogue.js";
export * as progress from "./repositories/progress.js";
export * as community from "./repositories/community.js";
