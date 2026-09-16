import { getAdminSession } from "./adminAuth.js";
import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ── Admin audit trail ─────────────────────────────────────────────────────────
// Every change made through the admin panel is recorded here: who, when, what.
// The panel's Activity page reads it, and the Overview shows the latest
// entries. Capped so it can never grow without bound.
const ADMIN_AUDIT_KEY = "cp_admin_audit";
const MAX_ENTRIES = 500;

function loadAuditLog() { return readJson(ADMIN_AUDIT_KEY, () => []); }

/**
 * @param {{action: string, target?: string, summary: string, meta?: object}} entry
 *   action  — a stable verb.noun key such as "news.publish" or "settings.update"
 *   target  — the record touched, for filtering ("news:n1")
 *   summary — one human-readable line
 */
function logAdminAction({ action, target = "", summary, meta = null }) {
  const session = getAdminSession();
  const entry = {
    id: "au" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    ts: new Date().toISOString(),
    actor: session?.actor || "unknown",
    mode: session?.mode || "local",
    action, target, summary, meta,
  };
  writeJson(ADMIN_AUDIT_KEY, [entry, ...loadAuditLog()].slice(0, MAX_ENTRIES));
  return entry;
}

function clearAuditLog() { writeJson(ADMIN_AUDIT_KEY, []); }

export {
  ADMIN_AUDIT_KEY,
  loadAuditLog,
  logAdminAction,
  clearAuditLog,
};
