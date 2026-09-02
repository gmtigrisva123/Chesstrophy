import { loadAdminData, saveAdminData } from "./adminData.js";
import { loadProfile, saveProfile } from "./profile.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── CHESSFLIX HELPERS ──────────────────────────────────────────────────────────
// NOTE ON ARCHITECTURE: ChessProphy has no real multi-user accounts (see the
// memory notes on Profile/Settings) — there's one local profile per browser.
// "Who can post" is therefore enforced against that local profile's username,
// checked against admin-configured lists, plus the existing Admin Portal
// session for the "admins" tier. It's a real, working permission gate for this
// architecture, but a production multi-user deployment would need to move this
// check server-side once real accounts exist.
// ══════════════════════════════════════════════════════════════════════════════
function isApprovedChessFlixCreator() {
  const profile = loadProfile();
  const cfg = loadAdminData().chessflixConfig || {};
  const uname = (profile.username || "").toLowerCase();
  if (!uname) return false;
  if (cfg.postPermission === "admins_approved" || cfg.postPermission === "custom") {
    return (cfg.approvedCreators || []).some(n => n.toLowerCase() === uname);
  }
  return false;
}
// Admin Portal has been removed, so posting permission now only ever comes
// from the approved-creators config (see isApprovedChessFlixCreator above).
function canPostChessFlix() {
  const cfg = loadAdminData().chessflixConfig || {};
  if (!cfg.enabled) return false;
  if (cfg.postPermission === "admins") return false;
  return isApprovedChessFlixCreator();
}

function loadChessFlixContent() { return (loadAdminData().chessflixContent || []).slice(); }
function saveChessFlixContent(list) {
  const ad = loadAdminData();
  const next = { ...ad, chessflixContent: list };
  saveAdminData(next);
}
function hasViewedContent(id) { return !!(loadProfile().viewedContent || {})[id]; }
function recordChessFlixView(id) {
  if (hasViewedContent(id)) return;
  const p = loadProfile();
  saveProfile({ ...p, viewedContent: { ...(p.viewedContent || {}), [id]: true } });
  const list = loadChessFlixContent();
  const next = list.map(c => c.id === id ? { ...c, views: (c.views || 0) + 1 } : c);
  saveChessFlixContent(next);
}

export {
  isApprovedChessFlixCreator,
  canPostChessFlix,
  loadChessFlixContent,
  saveChessFlixContent,
  hasViewedContent,
  recordChessFlixView,
};
