import { useState, useEffect } from "react";
import { InteractiveBoard } from "./InteractiveBoard.jsx";
import { createChess } from "../../lib/chess/engine.js";

// ── Mini interactive scratch board for Learn-tab diagrams ────────────────────
function ChapterBoard({ fen, dark }) {
  const [chess]  = useState(() => createChess(fen));
  const [live, setLive] = useState(fen);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    chess.loadFen(fen);
    setLive(fen);
    // `chess` is created once by useState's lazy initialiser and is stable for
    // the component's lifetime; listing it would only re-run this on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  const getLegal = (sq) => chess.legalMoves(sq);
  const onMove = (from, to) => {
    const legal = chess.legalMoves(from);
    const mv = legal.find(m => (typeof m === "string" ? m === to : m.to === to));
    if (!mv) return;
    const promo = (typeof mv === "object" && mv.promo) ? mv.promo : undefined;
    chess.move(from, to, promo);
    setLive(chess.getFen());
  };
  const reset = () => { chess.loadFen(fen); setLive(fen); };

  return (
    <div style={{ display: "inline-block" }}>
      <InteractiveBoard fen={live} onMove={onMove} getLegal={getLegal} lastMove={null} flipped={flipped} sqSize={44} />
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button onClick={() => setFlipped(f => !f)} style={{ flex: 1, padding: "6px 0", background: "transparent", border: `1px solid ${dark ? "#2a2a2a" : "#ddd"}`, borderRadius: 7, color: dark ? "#aaa" : "#555", fontWeight: 600, fontSize: "0.68rem", cursor: "pointer" }}>⇅ Flip</button>
        <button onClick={reset} style={{ flex: 1, padding: "6px 0", background: "transparent", border: `1px solid ${dark ? "#2a2a2a" : "#ddd"}`, borderRadius: 7, color: dark ? "#aaa" : "#555", fontWeight: 600, fontSize: "0.68rem", cursor: "pointer" }}>↺ Reset</button>
      </div>
      <div style={{ fontSize: "0.64rem", color: dark ? "#666" : "#999", marginTop: 6, textAlign: "center" }}>Explore freely — try the ideas from this chapter on the board.</div>
    </div>
  );
}

export {
  ChapterBoard,
};
