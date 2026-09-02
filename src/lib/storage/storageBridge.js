// ══════════════════════════════════════════════════════════════════════════════
// ── PERSISTENT STORAGE BRIDGE ──────────────────────────────────────────────────
// This artifact environment doesn't support localStorage/sessionStorage, so all
// persistence below is routed through window.storage (the artifact key-value
// API) instead. To keep every load/save helper in this file perfectly
// synchronous — exactly as originally written against localStorage — we hydrate
// an in-memory cache from window.storage once at boot (see the App bootstrap
// gate near the bottom of this file), then every loadX()/saveX() reads and
// writes that cache synchronously. Writes are also flushed to window.storage in
// the background so progress survives a reload.
// ══════════════════════════════════════════════════════════════════════════════
const STORAGE_KEYS = [
  "chessprophy_openings",
  "chessprophy_community_games",
  "chessprophy_admin_games",
  "chessprophy_puzzles",
  "chessprophy_chessmind",
  "chessprophy_daily_questions",
  "cp_admin_data",
  "chessprophy_learningtree",
  "chessprophy_course_progress",
  "chessprophy_economy",
  "chessprophy_profile",
];

const __storageCache = {};
let __storageReady = false;

async function __bootstrapStorage() {
  await Promise.all(STORAGE_KEYS.map(async (key) => {
    try {
      const res = await window.storage.get(key, false);
      __storageCache[key] = res ? res.value : null;
    } catch {
      __storageCache[key] = null;
    }
  }));
  __storageReady = true;
}

function __cacheGet(key) {
  return __storageCache[key] ?? null;
}
function __cacheSet(key, value) {
  __storageCache[key] = value;
  // The in-memory cache is the source of truth for this session; the flush to
  // window.storage is a background durability step. If the host rejects it the
  // session still works, it just will not survive a reload.
  try {
    window.storage.set(key, value, false).catch(() => {});
  } catch {
    // window.storage missing entirely (see platform/storageAdapter.js).
  }
}

export {
  STORAGE_KEYS,
  __storageCache,
  __storageReady,
  __bootstrapStorage,
  __cacheGet,
  __cacheSet,
};
