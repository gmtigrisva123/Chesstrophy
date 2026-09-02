import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── CHESSPROPHYAI AI ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── ChessProphy AI localStorage ────────────────────────────────────────────────────
const CM_KEY = "chessprophy_chessmind";

function defaultCMState() {
  return {
    placementDone: false,
    placementGame: 0,
    placementAnswers: [],
    estimatedRating: null,
    playerStyle: null,
    cognitiveProfile: null,
    learningPath: null,
    coachConversation: [],
    weeklyGoals: [],
    completedGoals: [],
    sessionsCompleted: 0,
    insightsDismissed: [],
  };
}

function loadCMState() { return readJson(CM_KEY, defaultCMState); }
function saveCMState(s) { writeJson(CM_KEY, s); }

export {
  CM_KEY,
  loadCMState,
  saveCMState,
};
