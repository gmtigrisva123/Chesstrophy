import { PIECE_IMG } from "../../assets/pieceImages.js";

// Human-readable names for the FEN letters, so a screen reader announces
// "white knight" instead of the literal character "N".
const PIECE_NAMES = {
  K: "White king",   Q: "White queen",  R: "White rook",
  B: "White bishop", N: "White knight", P: "White pawn",
  k: "Black king",   q: "Black queen",  r: "Black rook",
  b: "Black bishop", n: "Black knight", p: "Black pawn",
};

/**
 * Renders the official ChessProphy piece set. Every board on the site calls
 * this exact component, so the whole set updates everywhere at once.
 *
 * @param {object} props
 * @param {string} props.piece - FEN letter; uppercase is White, lowercase is Black.
 * @param {number} [props.size] - Rendered edge length in pixels.
 */
function PieceSVG({ piece, size = 68 }) {
  if (!piece || !PIECE_IMG[piece]) return null;
  return (
    <img
      src={PIECE_IMG[piece]}
      alt={PIECE_NAMES[piece] || piece}
      data-piece={piece}
      draggable={false}
      style={{
        width: size, height: size, display: "block", objectFit: "contain",
        userSelect: "none", pointerEvents: "none",
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))",
      }}
    />
  );
}

// ── Puzzle piece renderer — delegates to the shared ChessProphy piece set ────
function PzPiece({ piece, size = 52 }) {
  return <PieceSVG piece={piece} size={size} />;
}

export {
  PIECE_NAMES,
  PieceSVG,
  PzPiece,
};
