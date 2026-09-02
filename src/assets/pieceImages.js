// ══════════════════════════════════════════════════════════════════════════════
// ── CHESSPROPHY CHESS DESIGN SYSTEM ───────────────────────────────────────────
// ── PIECE SET — official ChessProphy board/piece image (user-provided) ────────
// Keyed by FEN letter (uppercase = white, lowercase = black). Do not regenerate
// or replace; reuse PIECE_IMG anywhere a piece is drawn — see PieceSVG, which
// every board (OpMiniBoard, OpeningBoard, InteractiveBoard, PuzzleBoard,
// DQBoard, MiniStaticBoard, ChapterBoard, WikiBoard...) renders through.
//
// The twelve sprites used to be inlined as base64 data URIs, which put ~52 kB
// of un-cacheable, un-compressible payload into the JavaScript bundle. They are
// now real files: Vite fingerprints and emits them, the browser caches them
// independently of the app code, and they download in parallel with it.
// ══════════════════════════════════════════════════════════════════════════════
import bishop_b from "./images/bishop-b.png";
import bishop_w from "./images/bishop-w.png";
import king_b from "./images/king-b.png";
import king_w from "./images/king-w.png";
import knight_b from "./images/knight-b.png";
import knight_w from "./images/knight-w.png";
import pawn_b from "./images/pawn-b.png";
import pawn_w from "./images/pawn-w.png";
import queen_b from "./images/queen-b.png";
import queen_w from "./images/queen-w.png";
import rook_b from "./images/rook-b.png";
import rook_w from "./images/rook-w.png";

const PIECE_IMG = {
  "K": king_w,
  "Q": queen_w,
  "R": rook_w,
  "B": bishop_w,
  "N": knight_w,
  "P": pawn_w,
  "k": king_b,
  "q": queen_b,
  "r": rook_b,
  "b": bishop_b,
  "n": knight_b,
  "p": pawn_b,
};

export {
  PIECE_IMG,
};
