import { useState, useRef, useEffect, useMemo } from "react";
import { MASCOT_IMG } from "../../assets/mascot.js";
import { InteractiveBoard } from "../../components/chess/InteractiveBoard.jsx";
import { MoveList } from "../../components/chess/MoveList.jsx";
import { useBoardSize } from "../../hooks/useBoardSize.js";
import { createChess } from "../../lib/chess/engine.js";
import { sanToMove } from "../../lib/chess/pgn.js";
import { playBoardSound } from "../../lib/chess/sound.js";
import { buildVariationFens } from "../../lib/chess/variations.js";
import { CHESS_ARROW_BEST } from "../../theme/boardTheme.js";

// Module scope: nested definitions would remount every control on the board
// after each move, which is both wasteful and drops in-flight CSS transitions.
function PillBtn({ children, onClick, disabled, big, solid, outline, accent, dark }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: big ? "1 1 100%" : 1, padding: big ? "13px 0" : "11px 0", borderRadius: 14,
      background: disabled ? (dark ? "#12271e" : "#e5e5e5") : solid ? `linear-gradient(135deg,${accent},#16a34a)` : outline ? "transparent" : dark ? "rgba(37,99,235,0.10)" : "rgba(37,99,235,0.06)",
      border: outline ? `1px solid ${accent}55` : "none",
      color: disabled ? (dark ? "#3a5045" : "#999") : solid ? "#fff" : accent,
      fontWeight: 700, fontSize: big ? "0.88rem" : "1rem", cursor: disabled ? "default" : "pointer",
      transition: "all 0.15s", textAlign: "center",
    }}>{children}</button>
  );
}

function IconBtn({ onClick, disabled, title, children, active, accent, border, muted, fg }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} aria-label={title} style={{
      width: 34, height: 34, borderRadius: 9, border: `1px solid ${active ? accent : border}`,
      background: active ? `${accent}18` : "transparent", color: disabled ? muted : (active ? accent : fg),
      fontSize: "0.9rem", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1,
      display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
    }}>{children}</button>
  );
}

function LearnBoard({ variation, onComplete, dark, G, AMBER, border, card, fg, muted, mode, lineNumber = 1, lineTotal = null, courseName = "" }) {
  const fens = useMemo(() => buildVariationFens(variation.moves), [variation]);
  const [moveIdx, setMoveIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [feedback, setFeedback] = useState(null); // {correct, explain}
  const [sqFeedback, setSqFeedback] = useState(null); // {from,to,type} — square highlight for the attempted move
  const [hintArrow, setHintArrow] = useState(null);    // {from,to,color} — shown on a wrong attempt to point at the right move
  const [revealed, setRevealed] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [chess] = useState(() => createChess());
  const [liveFen, setLiveFen] = useState(fens[0]);
  const [done, setDone] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(null); // non-null while scrubbing through the line read-only; null = live/interactive
  const [previewing, setPreviewing] = useState(false); // auto-playing "Preview line"
  const [cycle, setCycle] = useState(1);
  const [soundOn, setSoundOn] = useState(true);
  const [navTab, setNavTab] = useState("board"); // board | settings — the reference's floating icon rail
  const previewTimer = useRef(null);
  useEffect(() => () => { if (previewTimer.current) clearInterval(previewTimer.current); }, []);

  useEffect(() => {
    chess.loadFen(fens[0]);
    setLiveFen(fens[0]);
    setMoveIdx(0);
    setDone(false);
    // Reset when the *variation* changes. `fens` is derived from it and `chess`
    // is a stable useState lazy-init instance, so neither belongs here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variation]);

  const currentMoveData = variation.moves[moveIdx];

  const getLegal = (sq) => mode === "learn" ? [] : chess.legalMoves(sq);

  const checkUserMove = (from, to) => {
    if (mode === "learn" || done) return;
    const expected = sanToMove(chess, currentMoveData.san);
    if (expected && expected.from === from && expected.to === to) {
      chess.move(from, to, expected.promo);
      setLiveFen(chess.getFen());
      setFeedback({ correct: true, explain: currentMoveData.explain });
      setSqFeedback({ from, to, type: "correct" });
      setHintArrow(null);
      if (soundOn) playBoardSound(chess.isInCheck() ? "check" : "move");
      setTimeout(() => {
        setFeedback(null);
        setSqFeedback(null);
        const next = moveIdx + 1;
        if (next >= variation.moves.length) { setDone(true); onComplete && onComplete(true, wrongAttempts); }
        else {
          setMoveIdx(next);
          // Auto-play opponent reply if next move exists and alternates
        }
      }, 1400);
    } else {
      setWrongAttempts(w => w + 1);
      setFeedback({ correct: false, explain: `Not quite. The idea here is: ${currentMoveData.explain}`, expected: currentMoveData.san });
      setSqFeedback({ from, to, type: "incorrect" });
      if (soundOn) playBoardSound("illegal");
      if (expected) setHintArrow({ from: expected.from, to: expected.to, color: CHESS_ARROW_BEST });
      setTimeout(() => { setFeedback(null); setSqFeedback(null); setHintArrow(null); }, 2200);
    }
  };

  const playLearnMove = () => {
    if (moveIdx >= variation.moves.length) return;
    const mv = sanToMove(chess, currentMoveData.san);
    if (mv) { chess.move(mv.from, mv.to, mv.promo); setLiveFen(chess.getFen()); }
    const next = moveIdx + 1;
    if (next >= variation.moves.length) { setDone(true); onComplete && onComplete(true, 0); }
    setMoveIdx(next);
  };

  const reset = () => {
    chess.loadFen(fens[0]); setLiveFen(fens[0]); setMoveIdx(0);
    if (done) setCycle(c => c + 1);
    setDone(false); setFeedback(null); setSqFeedback(null); setHintArrow(null); setRevealed(false); setHintsUsed(0); setWrongAttempts(0);
    setReviewIdx(null); setPreviewing(false);
    if (previewTimer.current) { clearInterval(previewTimer.current); previewTimer.current = null; }
  };

  // ── Preview line — auto-steps through the whole variation read-only, then returns to the live position ──
  const startPreview = () => {
    if (previewTimer.current) clearInterval(previewTimer.current);
    setPreviewing(true);
    let i = 0;
    setReviewIdx(0);
    previewTimer.current = setInterval(() => {
      i += 1;
      if (i > variation.moves.length) {
        clearInterval(previewTimer.current); previewTimer.current = null;
        setPreviewing(false); setReviewIdx(null);
      } else setReviewIdx(i);
    }, 750);
  };
  const stopPreview = () => { if (previewTimer.current) { clearInterval(previewTimer.current); previewTimer.current = null; } setPreviewing(false); setReviewIdx(null); };
  const scrub = (dir) => {
    stopPreview();
    const cur = reviewIdx ?? moveIdx;
    if (dir === "first") setReviewIdx(0);
    else if (dir === "prev") setReviewIdx(Math.max(0, cur - 1));
    else if (dir === "next") setReviewIdx(Math.min(moveIdx, cur + 1));
    else setReviewIdx(null); // "last" — back to the live position
  };
  const startDrilling = () => { stopPreview(); reset(); };
  const displayFen = reviewIdx != null ? (fens[reviewIdx] || liveFen) : liveFen;
  const startTurn = (fens[0] || "").split(" ")[1] === "b" ? "Black" : "White";

  const [SQ, boardSizeRef] = useBoardSize(48);
  const pct = variation.moves.length ? Math.round((moveIdx / variation.moves.length) * 100) : 0;

  // ── Friendly nudge shown above the move list — mirrors the Puzzles panel.
  // Only fires when there isn't already a dedicated feedback/done card covering it.
  const learnBubbleMsg = done ? null
    : feedback ? null
    : mode === "learn" ? "Familiar with the line? Click \"Start drilling\" when you're ready to practice!"
    : moveIdx === 0 ? "Your turn — find the best move to continue the line!"
    : "Keep going — find the next move!";

  const navTabs = [
    { key: "board", icon: "♟️", label: "Board" },
    { key: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* LEFT — board column */}
        <div style={{ flex: "1 1 440px", maxWidth: 560, minWidth: 280 }}>
          {/* Navigation rail — Board / Settings, echoing the reference's floating icon panel */}
          <div style={{ display: "flex", gap: 4, marginBottom: 14, background: dark ? "rgba(255,255,255,0.03)" : "#f0f0f0", border: `1px solid ${border}`, borderRadius: 12, padding: 5, width: "fit-content", flexWrap: "wrap" }}>
            {navTabs.map(t => (
              <button key={t.key} onClick={() => setNavTab(t.key)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: navTab === t.key ? (dark ? "#1f1f1f" : "#fff") : "transparent",
                color: navTab === t.key ? fg : muted, fontWeight: 700, fontSize: "0.74rem",
                boxShadow: navTab === t.key ? "0 1px 5px rgba(0,0,0,0.25)" : "none", transition: "all 0.15s",
              }}>{t.icon} {t.label}</button>
            ))}
          </div>

          {navTab === "board" ? (
            <>
              <div style={{ paddingLeft: 18 }} ref={boardSizeRef}>
                <InteractiveBoard fen={displayFen} onMove={reviewIdx == null ? checkUserMove : undefined} getLegal={reviewIdx == null ? getLegal : () => []} lastMove={null} flipped={flipped} sqSize={SQ} feedback={reviewIdx == null ? sqFeedback : null} hintArrow={reviewIdx == null ? hintArrow : null} allowAnnotations />
              </div>

              {/* Board control bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingLeft: 18, paddingRight: 4 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <IconBtn accent={G} border={border} muted={muted} fg={fg} onClick={reset} title="Reset position">↺</IconBtn>
                  <IconBtn accent={G} border={border} muted={muted} fg={fg} onClick={() => setFlipped(f => !f)} title="Flip board">⇅</IconBtn>
                </div>
                <div style={{ fontSize: "0.72rem", color: muted, fontWeight: 600 }}>{done ? "✓ Complete" : `${startTurn} to move`}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {mode !== "learn" && <IconBtn accent={G} border={border} muted={muted} fg={fg} onClick={() => setHintsUsed(h => h + 1)} disabled={done} title="Hint">💡</IconBtn>}
                  {mode !== "learn" && <IconBtn accent={G} border={border} muted={muted} fg={fg} onClick={() => setRevealed(r => !r)} disabled={done} title="Show solution" active={revealed}>👁</IconBtn>}
                  <IconBtn accent={G} border={border} muted={muted} fg={fg} onClick={previewing ? stopPreview : startPreview} active={previewing} title={previewing ? "Stop preview" : "Preview line"}>{previewing ? "⏸" : "▶"}</IconBtn>
                </div>
              </div>

              {/* ⏮ ◀ ▶ ⏭ scrubber */}
              <div style={{ display: "flex", gap: 8, marginTop: 12, paddingLeft: 18 }}>
                <PillBtn accent={G} dark={dark} onClick={() => scrub("first")}>⏮</PillBtn>
                <PillBtn accent={G} dark={dark} onClick={() => scrub("prev")}>◀</PillBtn>
                <PillBtn accent={G} dark={dark} onClick={() => scrub("next")} disabled={(reviewIdx ?? moveIdx) >= moveIdx}>▶</PillBtn>
                <PillBtn accent={G} dark={dark} onClick={() => scrub("last")}>⏭</PillBtn>
              </div>

              {mode === "learn" ? (
                <div style={{ marginTop: 8, paddingLeft: 18 }}>
                  <PillBtn accent={G} dark={dark} big onClick={playLearnMove} disabled={done}>{done ? "✓ Complete" : "Next Move →"}</PillBtn>
                </div>
              ) : (
                <div style={{ marginTop: 8, paddingLeft: 18 }}>
                  <PillBtn accent={G} dark={dark} big solid onClick={startDrilling}>↺ Restart drill</PillBtn>
                </div>
              )}

              {/* progress bar */}
              <div style={{ paddingLeft: 18, paddingRight: 4, marginTop: 12 }}>
                <div style={{ height: 6, background: dark ? "#1a1a1a" : "#e8e8e8", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${G},#16a34a)`, borderRadius: 3, transition: "width 0.4s" }} />
                </div>
              </div>

              {mode !== "learn" && hintsUsed > 0 && !done && (
                <div style={{ marginTop: 8, paddingLeft: 18, fontSize: "0.76rem", color: AMBER }}>💡 Move the {currentMoveData?.san?.match(/^[KQRBN]/) ? "piece" : "pawn"} — think about: {currentMoveData?.explain?.slice(0, 60)}…</div>
              )}
              {mode !== "learn" && revealed && !done && (
                <div style={{ marginTop: 8, paddingLeft: 18, fontSize: "0.76rem", color: G, fontWeight: 700 }}>Answer: {currentMoveData?.san}</div>
              )}
            </>
          ) : (
            /* Settings tab */
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => setSoundOn(s => !s)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: `1px solid ${border}`, background: "transparent", color: fg, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
                <span>Move sound</span><span>{soundOn ? "🔊 On" : "🔇 Off"}</span>
              </button>
              <button onClick={() => setFlipped(f => !f)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: `1px solid ${border}`, background: "transparent", color: fg, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
                <span>Board orientation</span><span>{flipped ? "⇅ Flipped" : "⇅ Normal"}</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — lesson panel */}
        <div style={{ flex: 1, minWidth: 300, background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "22px 24px" }}>
          {/* Top bar — line progress + sound toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: border, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: G, transition: "width 0.3s ease", borderRadius: 2 }} />
            </div>
            <button onClick={() => setSoundOn(s => !s)} title={soundOn ? "Mute" : "Unmute"} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1rem", color: muted, flexShrink: 0 }}>{soundOn ? "🔊" : "🔇"}</button>
          </div>

          {/* Breadcrumb */}
          <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span>Openings</span>{courseName && <><span style={{ opacity: 0.5 }}>›</span><span>{courseName}</span></>}<span style={{ opacity: 0.5 }}>›</span><span style={{ color: fg, fontWeight: 600 }}>{variation.name}</span>
          </div>

          {/* Line heading + at-a-glance meta */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: G, marginBottom: 10 }}>
              {lineTotal ? `Line #${lineNumber} of ${lineTotal}` : variation.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                [G, `Cycle #${cycle}`],
                ["#60a5fa", `Playing as ${startTurn}`],
              ].map(([dot, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: muted, fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0, display: "inline-block" }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Key Idea card — the variation's strategic plans, styled to match the Studies panel */}
          {variation.plans && (
            <div style={{ background: dark ? "#181205" : "#fdf8ea", border: "1px solid #C9A84C55", borderRadius: 12, padding: "13px 16px", marginBottom: 14, display: "flex", gap: 10 }}>
              <span style={{ fontSize: "1rem", flexShrink: 0 }}>💡</span>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#C9A84C", marginBottom: 3 }}>Key Idea</div>
                <div style={{ fontSize: "0.8rem", color: fg, lineHeight: 1.6 }}>{variation.plans}</div>
              </div>
            </div>
          )}

          {/* Your Move card */}
          {mode !== "learn" && !done && currentMoveData && (
            <div style={{ background: dark ? "rgba(255,255,255,0.03)" : "#f6f6f6", border: `1px solid ${border}`, borderRadius: 12, padding: "13px 16px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: G }}>🎯 Your Move</div>
                <button onClick={() => setRevealed(r => !r)} style={{
                  padding: "6px 12px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${G},${G}cc)`,
                  color: "#fff", fontWeight: 700, fontSize: "0.7rem", cursor: "pointer", flexShrink: 0,
                }}>👁 {revealed ? "Hide Solution" : "Show Solution"}</button>
              </div>
              <div style={{ fontSize: "0.84rem", color: fg, fontWeight: 600 }}>What would you play here, and why?</div>
              {revealed && <div style={{ marginTop: 8, fontSize: "0.78rem", color: G, fontWeight: 700 }}>Answer: {currentMoveData.san}</div>}
            </div>
          )}

          {/* Move list */}
          <div style={{ background: dark ? "rgba(255,255,255,0.02)" : "#fafafa", border: `1px solid ${border}`, borderRadius: 13, padding: "16px 18px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: fg }}>{variation.name}</span>
              <span style={{ fontSize: "0.72rem", color: muted }}>{moveIdx}/{variation.moves.length}</span>
            </div>
            <MoveList moves={variation.moves} currentIdx={moveIdx} doneColor={G} currentColor={AMBER} mutedColor={muted} />
          </div>

          {/* Coach nudge — ChessProphy's own mascot + tip bubble */}
          {learnBubbleMsg && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
              <img src={MASCOT_IMG} alt="" style={{ width: 40, height: 40, borderRadius: "50%", display: "block", objectFit: "cover", flexShrink: 0 }} />
              <div style={{ background: dark ? "#132a3d" : "#eaf4ff", border: `1px solid ${dark ? "#1e3a52" : "#cfe6fb"}`, borderRadius: "4px 14px 14px 14px", padding: "11px 15px", fontSize: "0.82rem", fontWeight: 600, color: dark ? "#cfe9ff" : "#0f4c75", maxWidth: "100%" }}>
                {learnBubbleMsg}
              </div>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div style={{ animation: "opFade 0.2s ease", background: feedback.correct ? `${G}15` : "#ef444415", border: `1px solid ${feedback.correct ? G + "33" : "#ef444433"}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14, display: "flex", gap: 10 }}>
              <img src={MASCOT_IMG} alt="" style={{ width: 30, height: 30, borderRadius: "50%", display: "block", objectFit: "cover", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: feedback.correct ? G : "#ef4444", marginBottom: 6 }}>
                  {feedback.correct ? "✔ Correct" : "✕ Not quite"}
                </div>
                <div style={{ fontSize: "0.8rem", color: fg, lineHeight: 1.6 }}>{feedback.explain}</div>
                {!feedback.correct && feedback.expected && <div style={{ marginTop: 8, fontSize: "0.76rem", color: muted }}>Correct move: <strong style={{ color: G }}>{feedback.expected}</strong></div>}
              </div>
            </div>
          )}

          {done && (
            <div style={{ background: `${G}12`, border: `1px solid ${G}33`, borderRadius: 14, padding: "16px 18px", animation: "opFade 0.2s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <img src={MASCOT_IMG} alt="" style={{ width: 32, height: 32, borderRadius: "50%", display: "block", objectFit: "cover" }} />
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: G }}>🎉 Line complete!</div>
              </div>
              <div style={{ fontSize: "0.78rem", color: muted }}>{wrongAttempts === 0 ? "Perfect run — no mistakes!" : `${wrongAttempts} mistake${wrongAttempts !== 1 ? "s" : ""} along the way.`}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export {
  LearnBoard,
};
