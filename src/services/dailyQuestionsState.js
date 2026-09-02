import { DQ_BANK, QUIZ_BANK } from "../data/dailyQuestions.js";
import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ── CHESSPROPHYAI AI PAGE ─────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// ── DAILY QUESTIONS & KNOWLEDGE ASSESSMENT ───────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const DQ_KEY = "chessprophy_daily_questions";

function defaultDQState() {
  return {
    ratingSource: null,
    userRating: null,
    ratingGroup: null,
    setupDone: false,
    lastSessionDate: null,
    todaySession: null,          // { date, questions:[...], answers:[...], idx, done }
    streak: 0,
    longestStreak: 0,
    totalSolved: 0,
    totalCorrect: 0,
    xp: 0,
    badges: [],
    topicStats: {},              // { topic: { correct, total, avgTime } }
    weeklyHistory: [],           // [{date, score, accuracy}]
    quizHistory: [],
  };
}

function loadDQState() { return readJson(DQ_KEY, defaultDQState); }
function saveDQState(s) { writeJson(DQ_KEY, s); }

// ── Rating classification ─────────────────────────────────────────────────────
function classifyRating(rating) {
  if (rating < 800)  return "Beginner";
  if (rating < 1200) return "Novice";
  if (rating < 1600) return "Intermediate";
  if (rating < 2000) return "Advanced";
  if (rating < 2400) return "Expert";
  return "Master";
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function dqTodayStr() { return new Date().toDateString(); }
function dqYesterdayStr() { return new Date(Date.now() - 86400000).toDateString(); }

function generateDailyQuestions(group) {
  const pool = DQ_BANK[group] || DQ_BANK.Intermediate;
  // Shuffle a copy and take 5 (pad with Intermediate if fewer than 5)
  let combined = [...pool];
  if (combined.length < 5) combined = [...combined, ...DQ_BANK.Intermediate];
  const shuffled = combined.map(q => ({ ...q, sortKey: Math.random() })).sort((a, b) => a.sortKey - b.sortKey);
  return shuffled.slice(0, 5);
}

function generateQuizQuestions(category, count) {
  const pool = QUIZ_BANK[category] || QUIZ_BANK.general;
  const repeated = [];
  while (repeated.length < count) repeated.push(...pool);
  const shuffled = repeated.map(q => ({ ...q, sortKey: Math.random() })).sort((a, b) => a.sortKey - b.sortKey);
  return shuffled.slice(0, count);
}

export {
  DQ_KEY,
  loadDQState,
  saveDQState,
  classifyRating,
  dqTodayStr,
  dqYesterdayStr,
  generateDailyQuestions,
  generateQuizQuestions,
};
