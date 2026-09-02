import { createChess } from "./engine.js";

// ── OPENING DETAIL PAGE ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// ── OPENING TRAINER · PHASE 2: LEARNING MODE ──────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// Step-by-step, chapter-based learning built entirely on existing data
// (OPENING_REPERTOIRE's per-move explanations, strategic/tactical notes, common
// mistakes) and the existing progress system (loadOpState/saveOpState/
// nextSrStatus). The board is the new Phase 1 OpeningBoard. Nothing here
// duplicates rules or storage — it's a new view over data/logic that already existed.

const MATERIAL_VALUES = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
function materialEval(fen) {
  const board = createChess(fen).getBoard();
  let score = 0;
  board.forEach(p => { if (!p) return; const v = MATERIAL_VALUES[p.toUpperCase()] || 0; score += (p === p.toUpperCase() ? v : -v); });
  return score;
}

export {
  MATERIAL_VALUES,
  materialEval,
};
