import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ── Chess DNA history ─────────────────────────────────────────────────────────
// One snapshot per calendar day of the overall DNA score and each attribute,
// written whenever the score is computed. The DNA page's "Weekly Progress"
// chart and every trend arrow are read from these real points only — there is
// no back-filled or interpolated history, so a new user sees a single point
// and flat trends until they come back another day.
const DNA_HISTORY_KEY = "chessprophy_dna_history";
const MAX_SNAPSHOTS = 60;

function loadDNAHistory() { return readJson(DNA_HISTORY_KEY, () => []); }

/** The most recent snapshot taken on a day other than today, or null. */
function previousDNASnapshot(history = loadDNAHistory()) {
  const today = new Date().toDateString();
  return [...history].reverse().find(h => h.date !== today) || null;
}

/**
 * Records today's snapshot (replacing any earlier one from today) and returns
 * the full history.
 * @param {{overall:number, scores:Record<string,number>}} snapshot
 */
function recordDNASnapshot(snapshot) {
  const today = new Date().toDateString();
  const history = loadDNAHistory();
  const existing = history.find(h => h.date === today);
  // Skip the write when nothing changed — this runs on every dashboard render.
  if (existing && existing.overall === snapshot.overall && JSON.stringify(existing.scores) === JSON.stringify(snapshot.scores)) return history;
  const next = [...history.filter(h => h.date !== today), { date: today, ...snapshot }].slice(-MAX_SNAPSHOTS);
  writeJson(DNA_HISTORY_KEY, next);
  return next;
}

export {
  DNA_HISTORY_KEY,
  loadDNAHistory,
  previousDNASnapshot,
  recordDNASnapshot,
};
