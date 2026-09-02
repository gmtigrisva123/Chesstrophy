import { PieceSVG } from "./PieceSVG.jsx";
import { fenBoard } from "../../lib/chess/fen.js";
import { chessSquareBg } from "../../theme/boardTheme.js";

// ── Mini FEN board for question display (reuses PuzzleBoard rendering logic) ──
function DQBoard({ fen, size = 38 }) {
  const board = fenBoard(fen);
  return (
    <div style={{ display: "inline-block", borderRadius: 8, overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}>
      {Array.from({ length: 8 }, (_, r) => (
        <div key={r} style={{ display: "flex" }}>
          {Array.from({ length: 8 }, (_, c) => {
            const sq = r * 8 + c, light = (r + c) % 2 === 0, piece = board[sq];
            return (
              <div key={c} style={{ width: size, height: size, background: chessSquareBg({ light }), display: "flex", alignItems: "center", justifyContent: "center" }}>
                {piece && <PieceSVG piece={piece} size={size - 4} />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export {
  DQBoard,
};
