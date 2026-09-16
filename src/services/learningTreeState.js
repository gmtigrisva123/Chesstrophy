import { TREE_DATA } from "../data/learningTree.js";
import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── AI LEARNING TREE ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const LT_KEY = "chessprophy_learningtree";
const defaultLTState = () => ({ unlockedNodes: ["root","openings","tactics","calculation"], nodeProgress: {} });

// XP is never stored: it is the sum of every node's real mastery share of its
// xpReward, so it can only ever reflect training the user actually did.
// (Earlier builds persisted `xp` seeded at 2,340 before any node was touched;
// deriving it here retires that number for existing installs as well.)
function treeXP(nodeProgress = {}, node = TREE_DATA) {
  const own = Math.round(((nodeProgress[node.id] || 0) / 100) * (node.xpReward || 0));
  return (node.children || []).reduce((sum, child) => sum + treeXP(nodeProgress, child), own);
}

function loadLTState() {
  const { xp: _legacyXp, ...stored } = readJson(LT_KEY, defaultLTState);
  return { ...defaultLTState(), ...stored };
}
function saveLTState(s) { writeJson(LT_KEY, s); }

export {
  LT_KEY,
  loadLTState,
  saveLTState,
  treeXP,
};
