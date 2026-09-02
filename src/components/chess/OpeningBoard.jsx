import { useState, useRef, useEffect } from "react";
import { PieceSVG } from "./PieceSVG.jsx";
import { PromotionDialog } from "./PromotionDialog.jsx";
import { useBoardSize } from "../../hooks/useBoardSize.js";
import { createChess } from "../../lib/chess/engine.js";
import { applyMoveToPieces, fenToPieces } from "../../lib/chess/fen.js";
import { playBoardSound } from "../../lib/chess/sound.js";
import { CHESS_CHECK, CHESS_DARK_SQ, CHESS_LASTMOVE_D, CHESS_LASTMOVE_L, CHESS_LIGHT_SQ, CHESS_SELECT } from "../../theme/boardTheme.js";

// Defined at module scope on purpose: a component declared inside OpeningBoard
// would be a brand-new type on every render, so React would tear down and rebuild
// the toolbar's DOM each time a piece moves.
function ToolBtn({ active, onClick, title, children, accent, border, dark }) {
  return (
    <button onClick={onClick} title={title} aria-label={title} style={{
      width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
      border: `1px solid ${active ? accent + "66" : border}`, background: active ? `${accent}1f` : "transparent",
      color: active ? "#60A5FA" : (dark ? "#8891a8" : "#666"), cursor: "pointer", fontSize: 15, transition: "all 0.15s",
    }}>{children}</button>
  );
}

function OpeningBoard({ fen: fenProp, onMove, interactive = true, baseSqSize = 50, dark = true, showToolbar = true }) {
  const G = "#2563EB";
  const [chess] = useState(() => createChess(fenProp));
  const [, setTick] = useState(0);
  const rerender = () => setTick(t => t + 1);

  const [pieces, setPieces] = useState(() => fenToPieces(chess.getFen()));
  const [flipped, setFlipped] = useState(false);
  const [showCoords, setShowCoords] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [selSq, setSelSq] = useState(null);
  const [legalSqs, setLegalSqs] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [promo, setPromo] = useState(null);
  const [toast, setToast] = useState("");
  const externalFenRef = useRef(fenProp);

  const [SQ, boardSizeRef] = useBoardSize(baseSqSize);
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 1400); };

  // Sync when the parent hands us a brand-new position (e.g. jumping to a different lesson step)
  useEffect(() => {
    if (fenProp && fenProp !== externalFenRef.current && fenProp !== chess.getFen()) {
      chess.loadFen(fenProp);
      setPieces(fenToPieces(fenProp));
      setLastMove(null);
      setSelSq(null); setLegalSqs([]);
      externalFenRef.current = fenProp;
      rerender();
    }
    // `chess` is created once by useState's lazy initialiser and is stable for
    // the component's lifetime; listing it would only re-run this on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fenProp]);

  const board = chess.getBoard();
  const turn = chess.getTurn();
  const inCheck = chess.isInCheck();
  const kingSq = inCheck ? board.findIndex(p => p === (turn === "w" ? "K" : "k")) : -1;

  const doMove = (from, to, promoPiece) => {
    const made = chess.move(from, to, promoPiece);
    if (!made) { if (soundOn) playBoardSound("illegal"); return; }
    setPieces(prev => applyMoveToPieces(prev, made));
    setLastMove({ from, to });
    externalFenRef.current = chess.getFen();
    setSelSq(null); setLegalSqs([]); setPromo(null);
    if (soundOn) playBoardSound(chess.isInCheck() ? "check" : (made.captured ? "capture" : "move"));
    onMove?.(made, chess.getFen());
    rerender();
  };

  const onSquareClick = (sq) => {
    if (!interactive) return;
    if (selSq === null) {
      const piece = board[sq];
      if (!piece) return;
      const isWhite = piece === piece.toUpperCase();
      if ((turn === "w") !== isWhite) return;
      setSelSq(sq);
      setLegalSqs(chess.legalMoves(sq).map(m => m.to));
    } else {
      const legal = chess.legalMoves(selSq);
      const mv = legal.find(m => m.to === sq);
      if (!mv) {
        const piece = board[sq];
        if (piece && (piece === piece.toUpperCase()) === (turn === "w")) {
          setSelSq(sq); setLegalSqs(chess.legalMoves(sq).map(m => m.to));
        } else { setSelSq(null); setLegalSqs([]); }
        return;
      }
      if (mv.promo && !promo) { setPromo({ from: selSq, to: sq }); return; }
      doMove(selSq, sq, promo);
    }
  };

  const copyFen = () => {
    const text = chess.getFen();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => flash("FEN copied")).catch(() => flash("Copy failed — select manually"));
    } else flash("Clipboard unavailable");
  };

  const border = dark ? "rgba(148,163,255,0.14)" : "rgba(37,99,235,0.14)";
  // The board itself always keeps ChessProphy's warm cream/brown palette,
  // independent of the site's dark/light theme — matches every other board.
  const lightSq = CHESS_LIGHT_SQ;
  const darkSq  = CHESS_DARK_SQ;

  return (
    <div ref={boardSizeRef} style={{ display: "inline-flex", flexDirection: "column", gap: 10, maxWidth: "100%" }}>
      <div style={{ position: "relative", width: SQ * 8, height: SQ * 8, maxWidth: "100%", borderRadius: 14, overflow: "hidden", boxShadow: dark ? "0 10px 34px rgba(0,0,0,0.45)" : "0 10px 30px rgba(37,99,235,0.14)", border: `1px solid ${border}` }}>
        {/* Squares + highlights */}
        {Array.from({ length: 64 }).map((_, i) => {
          const sq = flipped ? 63 - i : i;
          const r = Math.floor(i / 8), c = i % 8;
          const light = (Math.floor(sq / 8) + (sq % 8)) % 2 === 0;
          const isSel = selSq === sq;
          const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
          const isCheck = sq === kingSq;
          return (
            <div key={sq} onClick={() => onSquareClick(sq)} style={{
              position: "absolute", left: c * SQ, top: r * SQ, width: SQ, height: SQ,
              background: isCheck ? CHESS_CHECK + "88" : isSel ? CHESS_SELECT + "cc" : isLast ? (light ? CHESS_LASTMOVE_L : CHESS_LASTMOVE_D) : (light ? lightSq : darkSq),
              cursor: interactive ? "pointer" : "default", transition: "background 0.12s",
            }}>
              {showCoords && c === 0 && (
                <span style={{ position: "absolute", top: 2, left: 3, fontSize: Math.max(9, SQ * 0.14), fontWeight: 700, color: light ? darkSq : lightSq, opacity: 0.85 }}>
                  {8 - Math.floor(sq / 8)}
                </span>
              )}
              {showCoords && r === 7 && (
                <span style={{ position: "absolute", bottom: 2, right: 3, fontSize: Math.max(9, SQ * 0.14), fontWeight: 700, color: light ? darkSq : lightSq, opacity: 0.85 }}>
                  {String.fromCharCode(97 + (sq % 8))}
                </span>
              )}
            </div>
          );
        })}

        {/* Legal-move dots */}
        {legalSqs.map(sq => {
          const i = flipped ? 63 - sq : sq;
          const r = Math.floor(i / 8), c = i % 8;
          const occupied = !!board[sq];
          return (
            <div key={"lg" + sq} style={{ position: "absolute", left: c * SQ, top: r * SQ, width: SQ, height: SQ, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              {occupied
                ? <div style={{ width: SQ - 8, height: SQ - 8, borderRadius: "50%", border: `3.5px solid ${G}aa` }} />
                : <div style={{ width: SQ * 0.32, height: SQ * 0.32, borderRadius: "50%", background: `${G}aa` }} />}
            </div>
          );
        })}

        {/* Pieces — absolutely positioned + transitioned for smooth sliding */}
        {pieces.map(p => {
          const i = flipped ? 63 - p.sq : p.sq;
          const r = Math.floor(i / 8), c = i % 8;
          return (
            <div key={p.id} style={{
              position: "absolute", left: c * SQ, top: r * SQ, width: SQ, height: SQ,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "left 0.22s cubic-bezier(.4,0,.2,1), top 0.22s cubic-bezier(.4,0,.2,1)",
              pointerEvents: "none",
            }}>
              <PieceSVG piece={p.type} size={SQ - 8} />
            </div>
          );
        })}

        {promo && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
            <PromotionDialog color={turn} onSelect={(p) => doMove(promo.from, promo.to, p)} />
          </div>
        )}

        {toast && (
          <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", background: "#0d1424", border: `1px solid ${G}44`, color: "#60A5FA", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, boxShadow: "0 6px 16px rgba(0,0,0,0.4)" }}>
            {toast}
          </div>
        )}
      </div>

      {showToolbar && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <ToolBtn accent={G} border={border} dark={dark} title="Flip board" onClick={() => setFlipped(f => !f)}>⇅</ToolBtn>
          <ToolBtn accent={G} border={border} dark={dark} title={soundOn ? "Mute sound" : "Unmute sound"} active={soundOn} onClick={() => setSoundOn(s => !s)}>{soundOn ? "🔊" : "🔇"}</ToolBtn>
          <ToolBtn accent={G} border={border} dark={dark} title={showCoords ? "Hide coordinates" : "Show coordinates"} active={showCoords} onClick={() => setShowCoords(s => !s)}>#</ToolBtn>
          <ToolBtn accent={G} border={border} dark={dark} title="Copy FEN" onClick={copyFen}>⧉</ToolBtn>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: dark ? "#6b7690" : "#888", fontWeight: 600 }}>
            {inCheck ? (chess.isGameOver() ? "Checkmate" : "Check") : `${turn === "w" ? "White" : "Black"} to move`}
          </span>
        </div>
      )}
    </div>
  );
}

export {
  OpeningBoard,
};
