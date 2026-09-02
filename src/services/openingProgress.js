import { OPENING_REPERTOIRE } from "../data/openingRepertoire.js";
import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── OPENINGS PAGE — ADVANCED OPENING LEARNING SYSTEM ──────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── localStorage ─────────────────────────────────────────────────────────────
const OP_KEY = "chessprophy_openings";

function defaultOpState() {
  return {
    progress: {},          // { openingId: { variationId: { status, lastSeen, dueDate, attempts, correct } } }
    favorites: [],
    repertoire: [],         // opening ids added to "my repertoire"
    streak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    totalVariationsLearned: 0,
    totalHoursPracticed: 0,
    sessionHistory: [],     // [{date, opening, accuracy, mode}]
    recentlyPracticed: [],  // [openingId] most recent first
  };
}

function loadOpState() { return readJson(OP_KEY, defaultOpState); }
function saveOpState(s) { writeJson(OP_KEY, s); }

// ── Opening Academy — concept-lesson completion (the non-opening-specific
//    steps in the learning path: principles, tactical-idea lessons, etc.) ────
const ACADEMY_KEY = "chessprophy_academy";
// concept lesson ids the user has marked done
function loadAcademyState() { return readJson(ACADEMY_KEY, () => ({ completedConcepts: [] })); }
function saveAcademyState(s) { writeJson(ACADEMY_KEY, s); }

// ── SM-2-lite spaced repetition ───────────────────────────────────────────────
const SR_STATUSES = ["New", "Learning", "Good", "Strong", "Mastered"];
const SR_INTERVALS = { New: 0, Learning: 1, Good: 3, Strong: 7, Mastered: 21 }; // days
function nextSrStatus(current, correct) {
  const idx = SR_STATUSES.indexOf(current || "New");
  if (correct) return SR_STATUSES[Math.min(SR_STATUSES.length - 1, idx + 1)];
  return SR_STATUSES[Math.max(0, idx - 1)];
}
function addDays(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toDateString(); }


// ── Helpers ────────────────────────────────────────────────────────────────────
function opTodayStr() { return new Date().toDateString(); }
function opYesterdayStr() { return new Date(Date.now() - 86400000).toDateString(); }

function getOpeningProgress(opState, openingId) {
  const opening = OPENING_REPERTOIRE.find(o => o.id === openingId);
  if (!opening) return 0;
  const prog = opState.progress[openingId] || {};
  const total = opening.variations.length;
  if (!total) return 0;
  const mastered = opening.variations.filter(v => {
    const status = prog[v.id]?.status;
    return status === "Strong" || status === "Mastered";
  }).length;
  return Math.round((mastered / total) * 100);
}

// Four-part mastery breakdown for the Opening Mastery header — each number is
// derived from real, already-tracked state (variation SR status + practice
// attempts/correct), just read through a different lens. Not a fake score:
//   Theory  — % of variations the user has been through at least once (Learn mode)
//   Plans   — % of variations reaching "Good" or beyond (internalized past a first pass)
//   Tactics — real practice-mode accuracy (correct / attempts) across this opening
//   Recall  — % of variations at "Strong"/"Mastered" (long-interval spaced-repetition recall)
function getOpeningMasteryBreakdown(opState, openingId) {
  const opening = OPENING_REPERTOIRE.find(o => o.id === openingId);
  if (!opening) return { theory: 0, plans: 0, tactics: 0, recall: 0 };
  const prog = opState.progress[openingId] || {};
  const total = opening.variations.length || 1;
  let seen = 0, past1st = 0, strongPlus = 0, attempts = 0, correct = 0;
  for (const v of opening.variations) {
    const p = prog[v.id];
    const status = p?.status || "New";
    if (status !== "New") seen++;
    if (["Good", "Strong", "Mastered"].includes(status)) past1st++;
    if (["Strong", "Mastered"].includes(status)) strongPlus++;
    attempts += p?.attempts || 0;
    correct += p?.correct || 0;
  }
  return {
    theory: Math.round((seen / total) * 100),
    plans: Math.round((past1st / total) * 100),
    tactics: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
    recall: Math.round((strongPlus / total) * 100),
  };
}

// Mirrors getMostRecentCourse() but for the opening repertoire — finds the
// most recently-practiced chapter (by real lastSeen timestamps already
// written by handlePracticeComplete/spaced repetition) across every opening.
// Returns null when the user hasn't practiced any opening yet.
function getMostRecentOpening(opState) {
  let best = null;
  for (const op of OPENING_REPERTOIRE) {
    const prog = opState.progress[op.id] || {};
    for (const [chapterId, state] of Object.entries(prog)) {
      if (!state.lastSeen) continue;
      const t = new Date(state.lastSeen).getTime();
      if (!best || t > best.t) best = { t, openingId: op.id, chapterId };
    }
  }
  if (!best) return null;
  const opening = OPENING_REPERTOIRE.find(o => o.id === best.openingId);
  if (!opening) return null;
  const chapterIdx = opening.variations.findIndex(v => v.id === best.chapterId);
  return { opening, chapterIdx: Math.max(0, chapterIdx), chapterCount: opening.variations.length, pct: getOpeningProgress(opState, opening.id) };
}

function getDueVariations(opState) {
  const due = [];
  const today = new Date();
  OPENING_REPERTOIRE.forEach(op => {
    op.variations.forEach(v => {
      const p = opState.progress[op.id]?.[v.id];
      if (p && p.dueDate) {
        const d = new Date(p.dueDate);
        if (d <= today) due.push({ openingId: op.id, openingName: op.name, variationId: v.id, variationName: v.name, status: p.status });
      }
    });
  });
  return due;
}

function getOverallStats(opState) {
  let totalVar = 0, masteredVar = 0, totalAttempts = 0, totalCorrect = 0;
  OPENING_REPERTOIRE.forEach(op => {
    op.variations.forEach(v => {
      totalVar++;
      const p = opState.progress[op.id]?.[v.id];
      if (p) {
        if (p.status === "Mastered" || p.status === "Strong") masteredVar++;
        totalAttempts += p.attempts || 0;
        totalCorrect += p.correct || 0;
      }
    });
  });
  return {
    totalVariations: totalVar,
    masteredVariations: masteredVar,
    masteryPct: totalVar ? Math.round((masteredVar / totalVar) * 100) : 0,
    accuracy: totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
  };
}

export {
  OP_KEY,
  loadOpState,
  saveOpState,
  ACADEMY_KEY,
  loadAcademyState,
  saveAcademyState,
  SR_STATUSES,
  SR_INTERVALS,
  nextSrStatus,
  addDays,
  opTodayStr,
  opYesterdayStr,
  getOpeningProgress,
  getOpeningMasteryBreakdown,
  getMostRecentOpening,
  getDueVariations,
  getOverallStats,
};
