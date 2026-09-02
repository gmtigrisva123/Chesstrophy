import { useState, useRef } from "react";
import { InteractiveBoard } from "../../components/chess/InteractiveBoard.jsx";
import { useBoardSize } from "../../hooks/useBoardSize.js";
import { createChess } from "../../lib/chess/engine.js";
import { parseSquarePairMove } from "../../lib/chess/fen.js";

function PuzzlePanel({ puzzle, dark, onComplete }) {
  const G = "#2563EB", muted = dark ? "#888" : "#666", fg = dark ? "#f0f0f0" : "#111", border = dark ? "rgba(148,163,255,0.10)" : "#e8e8e8";
  const [chess] = useState(() => { const c = createChess(); c.loadFen(puzzle.fen); return c; });
  const [fen, setFen] = useState(puzzle.fen);
  const [plyIdx, setPlyIdx] = useState(0);
  const [status, setStatus] = useState("active"); // active | correct-flash | wrong-flash | solved
  const [attempts, setAttempts] = useState(0);
  const attemptsRef = useRef(0); // mirrors `attempts` synchronously — setTimeout closures below
                                  // (playAutoReply) would otherwise read a stale pre-increment value
  const [hintsUsed, setHintsUsed] = useState(0);
  const hintsUsedRef = useRef(0);
  const [showHint, setShowHint] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const playerColor = puzzle.fen.split(" ")[1] === "w" ? "w" : "b";

  const getLegal = (rSq) => (chess.legalMoves ? chess.legalMoves(rSq) : []);

  const playAutoReply = (nextPly) => {
    if (nextPly >= puzzle.solution.length) return;
    const mv = parseSquarePairMove(puzzle.solution[nextPly]);
    setTimeout(() => {
      chess.move(mv.from, mv.to, mv.promo);
      setFen(chess.getFen());
      setLastMove({ from: mv.from, to: mv.to });
      const afterReply = nextPly + 1;
      setPlyIdx(afterReply);
      // BUG FIX: a puzzle whose solution ends on the opponent's move (an even
      // number of plies — true for "potd" itself: player move + forced reply)
      // was never reaching "solved", because only attemptMove checked for
      // completion. Auto-played replies need the same completion check.
      if (afterReply >= puzzle.solution.length) {
        setStatus("solved");
        onComplete && onComplete({ success: true, attempts: attemptsRef.current, hintsUsed: hintsUsedRef.current });
      }
    }, 420);
  };

  const [wrongAttempt, setWrongAttempt] = useState(null); // {from,to} — the square pair of the last incorrect try, for the red flash

  const attemptMove = (from, to) => {
    if (status === "solved" || plyIdx >= puzzle.solution.length) return;
    const expected = parseSquarePairMove(puzzle.solution[plyIdx]);
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    if (from === expected.from && to === expected.to) {
      chess.move(from, to, expected.promo);
      setFen(chess.getFen());
      setLastMove({ from, to });
      setShowHint(false);
      const nextPly = plyIdx + 1;
      if (nextPly >= puzzle.solution.length) {
        setPlyIdx(nextPly);
        setStatus("solved");
        onComplete && onComplete({ success: true, attempts: attemptsRef.current, hintsUsed: hintsUsedRef.current });
      } else {
        setStatus("correct-flash");
        setTimeout(() => setStatus("active"), 350);
        playAutoReply(nextPly);
      }
    } else {
      setWrongAttempt({ from, to });
      setStatus("wrong-flash");
      setTimeout(() => setStatus("active"), 500);
    }
  };

  // BUG FIX: the red "incorrect" flash relies on feedback.from/feedback.to to
  // know which squares to highlight (see InteractiveBoard's isFeedbackSq check)
  // — the wrong-flash case was missing them entirely, so the wrong-move flash
  // silently never rendered anything on the board.
  const feedback = status === "correct-flash" ? { type: "correct", from: lastMove?.from, to: lastMove?.to }
    : status === "wrong-flash" ? { type: "incorrect", from: wrongAttempt?.from, to: wrongAttempt?.to } : null;

  const hintArrow = showHint && plyIdx < puzzle.solution.length
    ? { from: parseSquarePairMove(puzzle.solution[plyIdx]).from, to: parseSquarePairMove(puzzle.solution[plyIdx]).to, color: "#f59e0b" }
    : null;

  const [SQ, boardRef] = useBoardSize(42);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: "0.66rem", fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.06em" }}>{puzzle.theme || "Puzzle"}</div>
          {puzzle.title && <div style={{ fontSize: "0.9rem", fontWeight: 700, color: fg }}>{puzzle.title}</div>}
        </div>
        <div style={{ fontSize: "0.72rem", color: muted }}>{playerColor === "w" ? "White" : "Black"} to move</div>
      </div>

      <div ref={boardRef} style={{ display: "inline-block" }}>
        <InteractiveBoard fen={fen} onMove={status === "solved" ? undefined : attemptMove} getLegal={status === "solved" ? () => [] : getLegal} lastMove={lastMove} flipped={playerColor === "b"} sqSize={SQ} feedback={feedback} hintArrow={hintArrow} />
      </div>

      {puzzle.desc && <div style={{ fontSize: "0.8rem", color: muted, marginTop: 10, lineHeight: 1.55, maxWidth: 360 }}>{puzzle.desc}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {status !== "solved" && (
          <button onClick={() => { setShowHint(h => !h); if (!showHint) { hintsUsedRef.current += 1; setHintsUsed(hintsUsedRef.current); } }} style={{ padding: "8px 14px", borderRadius: 9, border: `1px solid ${border}`, background: "transparent", color: fg, fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}>{showHint ? "Hide hint" : "💡 Hint"}</button>
        )}
        {status === "solved" && <div style={{ padding: "8px 14px", borderRadius: 9, background: "#22c55e18", border: "1px solid #22c55e44", color: "#22c55e", fontWeight: 700, fontSize: "0.76rem" }}>✓ Solved in {attempts} attempt{attempts === 1 ? "" : "s"}{hintsUsed > 0 ? ` (${hintsUsed} hint${hintsUsed === 1 ? "" : "s"})` : ""}</div>}
      </div>
    </div>
  );
}

export {
  PuzzlePanel,
};
