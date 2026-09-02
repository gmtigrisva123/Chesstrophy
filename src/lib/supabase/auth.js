// ── AUTHENTICATION ────────────────────────────────────────────────────────────
// Thin, intentional wrapper over Supabase Auth. Two things it adds over calling
// the SDK directly:
//
//   1. Guest sign-in is a real anonymous user, not a local flag. The app's
//      "Continue as Guest" path therefore produces data that is stored and
//      secured exactly like anyone else's, and can be upgraded to a full
//      account later without a migration step (see `upgradeGuestAccount`).
//   2. Errors surface as thrown SupabaseError rather than a `{ error }` pair
//      nobody remembers to check.

import { getSupabaseClient } from "./client.js";
import { SupabaseError } from "./errors.js";

/**
 * @typedef {import("@supabase/supabase-js").Session} Session
 * @typedef {import("@supabase/supabase-js").User} User
 */

/** @param {string} operation @param {{data: unknown, error: unknown}} result */
function unwrapAuth(operation, result) {
  if (result?.error) throw new SupabaseError(operation, result.error);
  return result?.data;
}

/**
 * The current session, or null when signed out.
 * @returns {Promise<Session | null>}
 */
async function getSession() {
  const supabase = await getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

/**
 * The current user, or null. Prefer this over reading `session.user` directly:
 * it revalidates the token with the server rather than trusting a cached copy.
 *
 * @returns {Promise<User | null>}
 */
async function getCurrentUser() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  // A missing or expired session is a normal signed-out state, not an error.
  if (error) return null;
  return data?.user ?? null;
}

/**
 * Creates an account.
 *
 * @param {{email: string, password: string, username?: string}} credentials
 * @returns {Promise<{user: User | null, session: Session | null}>}
 */
async function signUpWithEmail({ email, password, username }) {
  const supabase = await getSupabaseClient();
  // `username` rides along in user metadata; handle_new_user() reads it when
  // provisioning the profile, and de-duplicates it if it is taken.
  return unwrapAuth(
    "sign up",
    await supabase.auth.signUp({
      email,
      password,
      options: { data: username ? { username } : undefined },
    }),
  );
}

/**
 * @param {{email: string, password: string}} credentials
 * @returns {Promise<{user: User | null, session: Session | null}>}
 */
async function signInWithEmail({ email, password }) {
  const supabase = await getSupabaseClient();
  return unwrapAuth("sign in", await supabase.auth.signInWithPassword({ email, password }));
}

/**
 * Signs in anonymously — the "Continue as Guest" path.
 *
 * Requires `enable_anonymous_sign_ins` on the project. A guest's rows are
 * indistinguishable from anyone else's as far as RLS is concerned; the
 * `profiles.is_guest` flag only drives UI copy.
 *
 * @returns {Promise<{user: User | null, session: Session | null}>}
 */
async function signInAsGuest() {
  const supabase = await getSupabaseClient();
  return unwrapAuth("guest sign in", await supabase.auth.signInAnonymously());
}

/**
 * Converts the signed-in anonymous user into a permanent account, keeping the
 * same user id — and therefore every row of progress they accumulated as a
 * guest. This is the whole reason guests get a real anonymous user rather than
 * a local-only flag.
 *
 * @param {{email: string, password: string}} credentials
 * @returns {Promise<User | null>}
 */
async function upgradeGuestAccount({ email, password }) {
  const supabase = await getSupabaseClient();
  const data = unwrapAuth("upgrade guest account", await supabase.auth.updateUser({ email, password }));
  // The profile flag is what the UI reads; clear it now the account is real.
  await supabase.from("profiles").update({ is_guest: false }).eq("id", data?.user?.id);
  return data?.user ?? null;
}

/** @returns {Promise<void>} */
async function signOut() {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new SupabaseError("sign out", error);
}

/**
 * Sends a password reset email.
 * @param {string} email
 * @param {string} [redirectTo] - Where the emailed link should land.
 */
async function requestPasswordReset(email, redirectTo) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new SupabaseError("request password reset", error);
}

/**
 * Subscribes to sign-in/sign-out. Returns an unsubscribe function shaped for a
 * `useEffect` cleanup.
 *
 * @param {(session: Session | null) => void} onChange
 * @returns {() => void}
 */
function onAuthStateChange(onChange) {
  let unsubscribe = () => {};
  let cancelled = false;

  getSupabaseClient().then((supabase) => {
    if (cancelled) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => onChange(session));
    unsubscribe = () => data?.subscription?.unsubscribe();
  });

  return () => {
    cancelled = true;
    unsubscribe();
  };
}

export {
  getSession,
  getCurrentUser,
  signUpWithEmail,
  signInWithEmail,
  signInAsGuest,
  upgradeGuestAccount,
  signOut,
  requestPasswordReset,
  onAuthStateChange,
};
