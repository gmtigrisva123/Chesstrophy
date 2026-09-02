import { PieceSVG } from "./PieceSVG.jsx";
import { fenBoard } from "../../lib/chess/fen.js";
import { chessSquareBg } from "../../theme/boardTheme.js";

// ── Mini board for opening cards/previews ─────────────────────────────────────
function OpMiniBoard({ fen, size = 28 }) {
  const board = fenBoard(fen);
  return (
    <div style={{ display: "inline-block", border: "1px solid #8B5E20", borderRadius: 3, overflow: "hidden" }}>
      {Array.from({ length: 8 }, (_, r) => (
        <div key={r} style={{ display: "flex" }}>
          {Array.from({ length: 8 }, (_, c) => {
            const sq = r * 8 + c, light = (r + c) % 2 === 0, piece = board[sq];
            return (
              <div key={c} style={{ width: size, height: size, background: chessSquareBg({ light }) }}>
                {piece && <PieceSVG piece={piece} size={size} />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export {
  OpMiniBoard,
};
