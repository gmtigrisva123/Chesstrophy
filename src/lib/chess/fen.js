import { createChess } from "./engine.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── PUZZLE MODE — Phase 9 architecture ────────────────────────────────────────
// Generic, configurable puzzle interface built on the SAME engine as everything
// else (createChess + InteractiveBoard + PieceSVG). Takes a puzzle object and
// knows nothing about where it came from — no hardcoded themes, no dependency
// on PUZZLE_DB or the live Puzzles page. Solution format matches the existing
// PUZZLE_DB shape (square-pair strings like "d1e2") so it's drop-in compatible
// whenever the live Puzzles page is ready to be retrofitted onto it — that
// retrofit is intentionally NOT done here, per agreed scope.
//
// Expected puzzle shape: { fen, solution: ["d1e2","e8g8",...], theme, desc, title? }
// solution is a full ply-by-ply line: even indices are the player's moves,
// odd indices are the opponent's forced/expected replies (auto-played).
// ══════════════════════════════════════════════════════════════════════════════
function algSqToIdx(s) { const file = s.charCodeAt(0) - 97; const rank = Number(s[1]); return (8 - rank) * 8 + file; }
function parseSquarePairMove(str) {
  return { from: algSqToIdx(str.slice(0, 2)), to: algSqToIdx(str.slice(2, 4)), promo: str.length > 4 ? str[4] : undefined };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── OPENING TRAINER · PHASE 1: OPENING BOARD ──────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// A premium, self-contained chessboard purpose-built for the Opening Trainer:
// smooth sliding piece animation, legal-move handling, last-move + check
// indicators, flip, coordinates, sound, and a small analysis toolbar. It reuses
// the existing chess engine (createChess) and piece art (PieceSVG/PIECE_IMGS) —
// nothing about move rules or rendering was duplicated, only the board shell
// and interaction/animation layer are new.

function fenToPieces(fen) {
  const board = createChess(fen).getBoard();
  const pieces = [];
  let id = 0;
  board.forEach((piece, sq) => { if (piece) pieces.push({ id: id++, type: piece, sq }); });
  return pieces;
}

function applyMoveToPieces(pieces, mv) {
  let next = pieces.map(p => ({ ...p }));
  if (mv.ep) {
    const capSq = mv.from - (mv.from % 8) + (mv.to % 8);
    next = next.filter(p => p.sq !== capSq);
  } else if (mv.captured) {
    next = next.filter(p => p.sq !== mv.to);
  }
  const moving = next.find(p => p.sq === mv.from);
  if (moving) {
    moving.sq = mv.to;
    if (mv.promo) moving.type = (mv.piece === mv.piece.toUpperCase()) ? mv.promo.toUpperCase() : mv.promo.toLowerCase();
  }
  if (mv.castle) {
    const rookMove = { K: [63, 61], Q: [56, 59], k: [7, 5], q: [0, 3] }[mv.castle];
    if (rookMove) {
      const rook = next.find(p => p.sq === rookMove[0]);
      if (rook) rook.sq = rookMove[1];
    }
  }
  return next;
}

// ── FEN board helpers (bare minimum for puzzle validation) ───────────────────
function fenBoard(fen) {
  const rows = fen.split(" ")[0].split("/"); const b = [];
  for (const row of rows) { for (const ch of row) { if (/\d/.test(ch)) for (let i=0;i<Number(ch);i++) b.push(null); else b.push(ch); } }
  return b;
}
function sqName(sq) { return String.fromCharCode(97+(sq%8))+(8-Math.floor(sq/8)); }
function nameToSq(n) { return (8-parseInt(n[1]))*8+(n.charCodeAt(0)-97); }
/**
 * Applies a move to a flat 64-square board array.
 *
 * Deliberately simple — it does not validate legality, that is the puzzle
 * solution's job — but it does relocate the rook on a castling move, because
 * otherwise a castle renders as a king teleporting past a stationary rook.
 *
 * @param {(string|null)[]} board - 64 squares, index 0 = a8, 63 = h1.
 * @param {number} from - Source square index.
 * @param {number} to - Destination square index.
 * @returns {(string|null)[]} A new board; the input is not mutated.
 */
function applySimpleMove(board, from, to) {
  const b = [...board];
  const piece = b[from];
  b[to] = piece;
  b[from] = null;

  // Castling: the king travels exactly two files along its own rank.
  const isKing = piece === "K" || piece === "k";
  const sameRank = Math.floor(from / 8) === Math.floor(to / 8);
  if (isKing && sameRank && Math.abs((to % 8) - (from % 8)) === 2) {
    const kingside = to > from;
    const rookFrom = kingside ? to + 1 : to - 2;
    const rookTo = kingside ? to - 1 : to + 1;
    b[rookTo] = b[rookFrom];
    b[rookFrom] = null;
  }
  return b;
}
/**
 * Whether a played move matches a solution token such as "e2e4" or "e7e8q".
 * A token that names a promotion piece must be matched exactly — under-
 * promoting when the solution queens is a wrong answer; a token without one
 * accepts any promotion.
 */
function movesMatch(from, to, solToken, promo) {
  const f=sqName(from), t=sqName(to);
  if (!solToken.startsWith(f+t)) return false;
  const wanted = solToken.slice(4, 5);
  return !wanted || !promo || wanted.toLowerCase() === promo.toLowerCase();
}

export {
  fenToPieces,
  applyMoveToPieces,
  algSqToIdx,
  parseSquarePairMove,
  fenBoard,
  sqName,
  nameToSq,
  applySimpleMove,
  movesMatch,
};
