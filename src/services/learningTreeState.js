import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── AI LEARNING TREE ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const LT_KEY = "chessprophy_learningtree";
const defaultLTState = () => ({ unlockedNodes: ["root","openings","tactics","calculation"], xp: 2340, nodeProgress: {} });

function loadLTState() { return readJson(LT_KEY, defaultLTState); }
function saveLTState(s) { writeJson(LT_KEY, s); }

export {
  LT_KEY,
  loadLTState,
  saveLTState,
};
