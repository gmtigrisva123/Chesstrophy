// Shared visual primitives used by every chessboard on the site: piece
// rendering, board square colors, move highlights, and directional arrows.
// Every board component below (OpMiniBoard, OpeningBoard, InteractiveBoard,
// PuzzleBoard, DQBoard) renders through these — change
// them here and every chessboard in the app updates together.
// ══════════════════════════════════════════════════════════════════════════════

// Warm, clean board palette — matches the official ChessProphy board image
// (cream light squares, warm tan/brown dark squares). Used by every board
// regardless of site dark/light theme — the board itself always keeps this
// palette. Sampled directly from the reference board image; do not tweak
// without re-checking against it.
const CHESS_LIGHT_SQ   = "#E4D0B0";
const CHESS_DARK_SQ    = "#AE8665";
const CHESS_SELECT     = "#BFC24A";   // selected / suggested-move square tint
const CHESS_LASTMOVE_L = "#E4D46E";  // last-move highlight, light square
const CHESS_LASTMOVE_D = "#C9A93A";  // last-move highlight, dark square
const CHESS_CORRECT    = "#22C55E";  // correct-move feedback (green)
const CHESS_INCORRECT  = "#EF4444";  // incorrect-move feedback (red)
const CHESS_CHECK      = "#EF4444";
const CHESS_ARROW_BEST = "#22C55E";  // best/suggested move arrow (green)
const CHESS_ARROW_ALT  = "#B8875A";  // alternative move arrow (muted brown)

// Resolve the right square background for a given state — one function every
// board calls instead of re-deriving highlight colors inline.
function chessSquareBg({ light, selected, lastMove, correct, incorrect, check }) {
  if (check)     return CHESS_CHECK + "99";
  if (incorrect) return CHESS_INCORRECT + "99";
  if (correct)   return CHESS_CORRECT + "99";
  if (selected)  return CHESS_SELECT + "cc";
  if (lastMove)  return light ? CHESS_LASTMOVE_L : CHESS_LASTMOVE_D;
  return light ? CHESS_LIGHT_SQ : CHESS_DARK_SQ;
}

export {
  CHESS_LIGHT_SQ,
  CHESS_DARK_SQ,
  CHESS_SELECT,
  CHESS_LASTMOVE_L,
  CHESS_LASTMOVE_D,
  CHESS_CORRECT,
  CHESS_INCORRECT,
  CHESS_CHECK,
  CHESS_ARROW_BEST,
  CHESS_ARROW_ALT,
  chessSquareBg,
};
