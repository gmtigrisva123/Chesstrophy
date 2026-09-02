import { useState, useMemo } from "react";
import { InteractiveBoard } from "./InteractiveBoard.jsx";
import { PromotionDialog } from "./PromotionDialog.jsx";
import { useBoardSize } from "../../hooks/useBoardSize.js";
import { createChess } from "../../lib/chess/engine.js";
import { sanToMove } from "../../lib/chess/pgn.js";

// Module scope, not a closure inside WikiBoard: a nested definition is a new
// component type on every render, which would remount the whole nav row (and
// drop its hover state) each time the user steps a move.
function NavBtn({ icon, title, onClick, active = false, accent, border, fg }) {
  return (
    <button onClick={onClick} title={title} style={{
      padding: "8px 12px", background: active ? `${accent}18` : "transparent", border: `1px solid ${active ? accent + "55" : border}`,
      borderRadius: 9, color: active ? accent : fg, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.14s",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = fg; } }}>{icon}</button>
  );
}

// ── ChessWiki interactive board — free play + step through an article's move
// sequence, built on the same shared InteractiveBoard/engine used everywhere
// else. Only rendered when an article actually has a fen or moveSequence.
function WikiBoard({ fen, moveSequence, dark }) {
  const G = "#2563EB", fg = dark ? "#f0f0f0" : "#111", muted = dark ? "#8891a8" : "#666";
  const border = dark ? "rgba(148,163,255,0.14)" : "#e8e8e8";
  const [SQ, sqRef] = useBoardSize(46);
  const sanList = useMemo(() => moveSequence ? moveSequence.trim().split(/\s+/).filter(Boolean) : [], [moveSequence]);
  const startFen = fen || undefined;
  // The move list is compared by value, not identity: `sanList` is a fresh array
  // whenever `moveSequence` changes, but two equal sequences must not re-replay.
  const sanKey = sanList.join(" ");
  const { fens, movesData } = useMemo(() => {
    const chess = createChess(startFen);
    const list = [chess.getFen()], mvs = [];
    for (const san of sanList) { const mv = sanToMove(chess, san); if (!mv) break; chess.move(mv.from, mv.to, mv.promo); list.push(chess.getFen()); mvs.push(mv); }
    return { fens: list, movesData: mvs };
    // `sanList` is intentionally absent: `sanKey` is its value-equal stand-in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startFen, sanKey]);

  const [curIdx, setCurIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ana, setAna] = useState(false);
  const [anaFen, setAnaFen] = useState(null);
  const [anaChess] = useState(() => createChess());
  const [promotion, setPromotion] = useState(null);
  const totalMoves = sanList.length;
  const isAna = ana && anaFen !== null;
  const curFen = isAna ? anaFen : (fens[curIdx] || fens[0]);
  const lastMove = isAna ? null : (movesData[curIdx - 1] || null);

  const enterAna = () => { anaChess.loadFen(curFen); setAnaFen(curFen); setAna(true); };
  const exitAna = () => { setAna(false); setAnaFen(null); };
  const reset = () => { exitAna(); setCurIdx(0); };
  const handleMove = (from, to) => {
    if (!isAna) { enterAna(); return; }
    const b = anaChess.getBoard(), piece = b[from], toRow = Math.floor(to / 8);
    if ((piece === "P" && toRow === 0) || (piece === "p" && toRow === 7)) { setPromotion({ from, to }); return; }
    execMv(from, to, null);
  };
  const execMv = (from, to, promo) => { const mv = anaChess.move(from, to, promo); if (mv) setAnaFen(anaChess.getFen()); setPromotion(null); };
  const getLegal = (sq) => isAna ? anaChess.legalMoves(sq) : [];
  const nav = (dir) => {
    exitAna();
    if (dir === "first") setCurIdx(0);
    else if (dir === "last") setCurIdx(totalMoves);
    else if (dir === "prev") setCurIdx(i => Math.max(0, i - 1));
    else setCurIdx(i => Math.min(totalMoves, i + 1));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {promotion && <PromotionDialog color={anaChess.getTurn() === "w" ? "b" : "w"} onSelect={p => execMv(promotion.from, promotion.to, p)} />}
      <div ref={sqRef} style={{ width: "100%", minWidth: 0, maxWidth: 560 }}>
        <InteractiveBoard fen={curFen} onMove={handleMove} getLegal={getLegal} lastMove={lastMove} flipped={flipped} sqSize={SQ} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {totalMoves > 0 && <>
          <NavBtn accent={G} border={border} fg={fg} icon="⏮" title="First" onClick={() => nav("first")} />
          <NavBtn accent={G} border={border} fg={fg} icon="◀" title="Previous move" onClick={() => nav("prev")} />
          <NavBtn accent={G} border={border} fg={fg} icon="▶" title="Next move" onClick={() => nav("next")} />
          <NavBtn accent={G} border={border} fg={fg} icon="⏭" title="Last" onClick={() => nav("last")} />
        </>}
        <NavBtn accent={G} border={border} fg={fg} icon="🔄 Flip" title="Flip board" onClick={() => setFlipped(f => !f)} />
        <NavBtn accent={G} border={border} fg={fg} icon="⟳ Reset" title="Reset position" onClick={reset} />
        <NavBtn accent={G} border={border} fg={fg} icon={isAna ? "✦ Analysing" : "✦ Move pieces"} title="Free play" onClick={isAna ? exitAna : enterAna} active={isAna} />
      </div>
      <div style={{ fontSize: "0.72rem", color: muted, textAlign: "center" }}>
        {isAna ? "Analysis mode — move any piece freely" : totalMoves === 0 ? "Starting position" : curIdx === 0 ? "Starting position" : `Move ${curIdx} of ${totalMoves} — ${sanList[curIdx - 1] || ""}`}
      </div>
    </div>
  );
}

export {
  WikiBoard,
};
