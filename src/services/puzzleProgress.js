import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ── Human-readable difficulty band from a puzzle's numeric rating ────────────
function ratingToDifficulty(rating) {
  if (rating < 1200) return "Beginner";
  if (rating < 1600) return "Intermediate";
  if (rating < 2000) return "Advanced";
  return "Expert";
}

// ── Puzzle storage helpers ────────────────────────────────────────────────────
const PZ_KEY = "chessprophy_puzzles";
function loadPzState() {
  const data = readJson(PZ_KEY, () => ({}));
  const today = new Date().toDateString();
  if (data.date === today) return data;
  // New day: carry over the all-time counters, reset the per-day ones.
  return {
    date: today,
    puzzleRating: data.puzzleRating || 1200,
    streak: data.streak || 0,
    lastSolvedDate: data.lastSolvedDate || null,
    solvedToday: [],       // ids solved today
    freeUsed: 0,           // 0-3
    potdSolved: false,
    hintUsedIds: [],
    solved: data.solved || [],  // all-time solved ids
  };
}
function savePzState(st) { writeJson(PZ_KEY, st); }

// ── Rating calculator ─────────────────────────────────────────────────────────
function calcRatingChange(userRating, puzzleRating, solved, hintUsed) {
  const expected = 1/(1+Math.pow(10,(puzzleRating-userRating)/400));
  const K = 32;
  let delta = Math.round(K*(solved?1:0 - expected));
  if (hintUsed && solved) delta = Math.max(1, Math.round(delta*0.5));
  if (!solved) delta = Math.min(-2, delta);
  return delta;
}

export {
  PZ_KEY,
  loadPzState,
  savePzState,
  ratingToDifficulty,
  calcRatingChange,
};
