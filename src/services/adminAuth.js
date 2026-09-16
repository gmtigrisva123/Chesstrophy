import { readJson, writeJson } from "../lib/storage/jsonStore.js";
import { isSupabaseConfigured } from "../lib/supabase/client.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── ADMIN ACCESS ──────────────────────────────────────────────────────────────
// Who may open the admin panel, and how that is checked.
//
// Two modes, picked by whether a backend is configured:
//
//   remote  Supabase is configured. The admin signs in with their account and
//           the panel opens only if `user_roles` grants them `admin` or
//           `moderator`. Roles can only be granted server-side (the table has
//           no client write policy), and every catalogue table's RLS re-checks
//           `is_admin()` on write — so this gate is enforced by the database,
//           not by the UI.
//
//   local   No backend. The site owner sets a passcode on first visit; it is
//           stored as a salted SHA-256 hash in this browser and required on
//           every later visit. This protects the admin screens from casual
//           access on a shared machine, nothing more: all content lives in
//           this browser anyway, and anyone with devtools can already read
//           it. The login screen says so.
//
// A session lives in sessionStorage (dies with the tab) unless the admin asks
// to be remembered, in which case it lasts seven days. Either way it is a
// token in this browser only — the remote mode's real session is Supabase's.
// ══════════════════════════════════════════════════════════════════════════════

const ADMIN_AUTH_KEY = "cp_admin_auth";
const ADMIN_SESSION_KEY = "cp_admin_session";
const REMEMBER_MS = 7 * 86400000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30000;

function adminAuthMode() { return isSupabaseConfigured() ? "remote" : "local"; }

// ── Local passcode ────────────────────────────────────────────────────────────
function loadLocalAuth() { return readJson(ADMIN_AUTH_KEY, () => null); }
function saveLocalAuth(a) { writeJson(ADMIN_AUTH_KEY, a); }

function hasLocalPasscode() { return !!loadLocalAuth()?.hash; }

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

function validatePasscode(passcode) {
  if (typeof passcode !== "string" || passcode.length < 8) return "Use at least 8 characters.";
  if (passcode.length > 128) return "That is too long.";
  return "";
}

async function setLocalPasscode(passcode) {
  const problem = validatePasscode(passcode);
  if (problem) throw new Error(problem);
  const salt = randomSalt();
  const hash = await sha256Hex(`${salt}:${passcode}`);
  const now = new Date().toISOString();
  const prev = loadLocalAuth();
  saveLocalAuth({ salt, hash, createdAt: prev?.createdAt || now, updatedAt: now, failedAttempts: 0, lockedUntil: null });
}

/** Milliseconds until sign-in is allowed again, or 0. */
function lockoutRemaining() {
  const a = loadLocalAuth();
  if (!a?.lockedUntil) return 0;
  return Math.max(0, new Date(a.lockedUntil).getTime() - Date.now());
}

async function verifyLocalPasscode(passcode) {
  const a = loadLocalAuth();
  if (!a?.hash) return false;
  if (lockoutRemaining() > 0) return false;
  const ok = (await sha256Hex(`${a.salt}:${passcode}`)) === a.hash;
  if (ok) {
    saveLocalAuth({ ...a, failedAttempts: 0, lockedUntil: null });
    return true;
  }
  const failedAttempts = (a.failedAttempts || 0) + 1;
  const lockedUntil = failedAttempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null;
  saveLocalAuth({ ...a, failedAttempts: lockedUntil ? 0 : failedAttempts, lockedUntil });
  return false;
}

async function changeLocalPasscode(current, next) {
  if (!(await verifyLocalPasscode(current))) throw new Error("Current passcode is incorrect.");
  await setLocalPasscode(next);
}

// ── Session ───────────────────────────────────────────────────────────────────
let memorySession = null;
let listeners = [];
const notify = () => listeners.forEach(fn => { try { fn(); } catch (e) { console.error("[adminAuth] listener threw", e); } });

function storageFor(remember) {
  try { return remember ? window.localStorage : window.sessionStorage; } catch { return null; }
}
function readStored() {
  for (const remember of [false, true]) {
    const store = storageFor(remember);
    try {
      const raw = store?.getItem(ADMIN_SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* unreadable — treat as signed out */ }
  }
  return null;
}
function clearStored() {
  for (const remember of [false, true]) {
    try { storageFor(remember)?.removeItem(ADMIN_SESSION_KEY); } catch { /* ignore */ }
  }
}

/**
 * The active admin session, or null. `{ actor, role, mode, startedAt, expiresAt }`.
 */
function getAdminSession() {
  const s = memorySession || readStored();
  if (!s) return null;
  if (s.expiresAt && new Date(s.expiresAt).getTime() < Date.now()) { endAdminSession(); return null; }
  memorySession = s;
  return s;
}

function startAdminSession({ actor, role = "admin", mode = adminAuthMode(), remember = false }) {
  const now = Date.now();
  const session = {
    actor, role, mode,
    startedAt: new Date(now).toISOString(),
    expiresAt: remember ? new Date(now + REMEMBER_MS).toISOString() : null,
  };
  memorySession = session;
  clearStored();
  try { storageFor(remember)?.setItem(ADMIN_SESSION_KEY, JSON.stringify(session)); } catch { /* memory only */ }
  notify();
  return session;
}

function endAdminSession() {
  memorySession = null;
  clearStored();
  notify();
}

function subscribeAdminSession(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(f => f !== fn); };
}

// ── Remote (Supabase) ─────────────────────────────────────────────────────────
const ADMIN_ROLES = ["admin", "moderator"];

async function fetchOwnRoles() {
  const { getSupabaseClient } = await import("../lib/supabase/client.js");
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.from("user_roles").select("role");
  if (error) throw new Error(error.message);
  return (data || []).map(r => r.role);
}

/**
 * Signs in with a Supabase account and opens an admin session only when that
 * account holds an admin/moderator role. Anyone else is signed straight back
 * out so a plain member never ends up with a half-authenticated panel.
 */
async function signInAdminRemote({ email, password, remember }) {
  const auth = await import("../lib/supabase/auth.js");
  const { user } = await auth.signInWithEmail({ email, password });
  const roles = await fetchOwnRoles();
  const role = ADMIN_ROLES.find(r => roles.includes(r));
  if (!role) {
    await auth.signOut();
    throw new Error("This account has no admin role. Grant one in Supabase (see supabase/README.md → Grant yourself admin).");
  }
  return startAdminSession({ actor: user?.email || email, role, mode: "remote", remember });
}

/** Re-opens the admin session from a surviving Supabase session, if any. */
async function restoreRemoteAdminSession() {
  if (adminAuthMode() !== "remote") return null;
  try {
    const auth = await import("../lib/supabase/auth.js");
    const user = await auth.getCurrentUser();
    if (!user) return null;
    const roles = await fetchOwnRoles();
    const role = ADMIN_ROLES.find(r => roles.includes(r));
    if (!role) return null;
    return getAdminSession() || startAdminSession({ actor: user.email || user.id, role, mode: "remote", remember: true });
  } catch {
    return null;
  }
}

async function signOutAdmin() {
  const session = getAdminSession();
  endAdminSession();
  if (session?.mode === "remote") {
    try { (await import("../lib/supabase/auth.js")).signOut(); } catch { /* already signed out */ }
  }
}

export {
  ADMIN_AUTH_KEY,
  ADMIN_SESSION_KEY,
  MAX_ATTEMPTS,
  LOCKOUT_MS,
  adminAuthMode,
  hasLocalPasscode,
  validatePasscode,
  setLocalPasscode,
  verifyLocalPasscode,
  changeLocalPasscode,
  lockoutRemaining,
  getAdminSession,
  startAdminSession,
  endAdminSession,
  subscribeAdminSession,
  signInAdminRemote,
  restoreRemoteAdminSession,
  signOutAdmin,
};
