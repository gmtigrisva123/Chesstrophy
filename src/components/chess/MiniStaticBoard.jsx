import { useMemo } from "react";
import { PieceSVG } from "./PieceSVG.jsx";
import { fenBoard } from "../../lib/chess/fen.js";
import { CHESS_DARK_SQ, CHESS_LIGHT_SQ } from "../../theme/boardTheme.js";

// ── MAIN OPENINGS PAGE (Dashboard + Library + Detail) ────────────────────────
// ── Small static board — used for decorative/preview positions where a full
//    InteractiveBoard isn't needed. Uses the same shared board palette and
//    piece set as every other board (see CHESS_LIGHT_SQ/CHESS_DARK_SQ/PieceSVG) ─
function MiniStaticBoard({ fen, size = 176 }) {
  const board = useMemo(() => fenBoard(fen), [fen]);
  const sq = size / 8;
  return (
    <div style={{ width: size, height: size, display: "grid", gridTemplateColumns: `repeat(8,${sq}px)`, gridTemplateRows: `repeat(8,${sq}px)`, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
      {board.map((piece, i) => {
        const row = Math.floor(i / 8), col = i % 8;
        const isLight = (row + col) % 2 === 0;
        return (
          <div key={i} style={{ width: sq, height: sq, background: isLight ? CHESS_LIGHT_SQ : CHESS_DARK_SQ, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {piece && <PieceSVG piece={piece} size={sq * 0.86} />}
          </div>
        );
      })}
    </div>
  );
}

export {
  MiniStaticBoard,
};
