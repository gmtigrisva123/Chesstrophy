import { useState, useRef, useEffect, useMemo } from "react";
import { LearnBoard } from "./LearnBoard.jsx";
import { AnalysisInfo } from "../../components/chess/AnalysisInfo.jsx";
import { EvaluationBar } from "../../components/chess/EvaluationBar.jsx";
import { MoveList } from "../../components/chess/MoveList.jsx";
import { OpeningBoard } from "../../components/chess/OpeningBoard.jsx";
import { createChess } from "../../lib/chess/engine.js";
import { moveToSan, sanToMove } from "../../lib/chess/pgn.js";
import { SR_INTERVALS, addDays, getOpeningProgress, loadOpState, nextSrStatus, opTodayStr, saveOpState } from "../../services/openingProgress.js";

// Module scope — see the note in LearnBoard.jsx.
function PanelBtn({ id, label, icon, panel, setPanel, accent, border, muted }) {
  const isActive = panel === id;
  return (
    <button onClick={() => setPanel(id)} aria-pressed={isActive} style={{
      padding: "8px 14px", borderRadius: 9, border: `1px solid ${isActive ? accent + "55" : border}`,
      background: isActive ? `${accent}1a` : "transparent", color: isActive ? "#60A5FA" : muted,
      fontWeight: 700, fontSize: "0.76rem", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
    }}>{icon} {label}</button>
  );
}

function LearningModeView({ opening, dark, onExit }) {
  const G = "#2563EB", GOLD = "#C9A84C", BLUE = "#60a5fa", AMBER = "#f59e0b", PURPLE = "#a78bfa", RED = "#ef4444";
  const fg = dark ? "#f1f5f9" : "#111", muted = dark ? "#8891a8" : "#666";
  const card = dark ? "rgba(17,24,39,0.55)" : "rgba(255,255,255,0.82)";
  const border = dark ? "rgba(148,163,255,0.10)" : "rgba(37,99,235,0.10)";

  const [opState, setOpState] = useState(loadOpState);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [moveIdx, setMoveIdx] = useState(0);
  const [panel, setPanel] = useState("explain"); // explain | strategy | tactics | mistakes | alt | practice
  const completedRef = useRef(new Set());

  // ── Branch viewing (Phase 6: branching variations) ──────────────────────────
  // A move can carry an optional `.branch = { name, note, moves: [...] }` —
  // a real, authored alternative line starting right after that move. This is
  // generic: any move in any chapter can have one, not just this example.
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchMoveIdx, setBranchMoveIdx] = useState(0);

  const chapter = opening.variations[chapterIdx];
  const totalMoves = chapter.moves.length;
  const atEnd = moveIdx >= totalMoves;
  const currentMove = !atEnd ? chapter.moves[moveIdx] : chapter.moves[totalMoves - 1];
  const lastPlayedMove = moveIdx > 0 ? chapter.moves[moveIdx - 1] : null;
  const branch = lastPlayedMove?.branch || null;

  const saveProgress = (upd) => { const ns = { ...opState, ...upd }; setOpState(ns); saveOpState(ns); };

  // Replay the chapter up to moveIdx to get the current position
  const { fen: mainFen } = useMemo(() => {
    const chess = createChess();
    let lm = null;
    for (let i = 0; i < moveIdx; i++) {
      const mv = sanToMove(chess, chapter.moves[i].san);
      if (!mv) break;
      chess.move(mv.from, mv.to, mv.promo);
      lm = { from: mv.from, to: mv.to };
    }
    return { fen: chess.getFen(), lastMove: lm };
    // `chapterIdx` identifies the chapter, so `chapter.moves` cannot change
    // without it changing too. Listing the array would re-replay the line on
    // every render, since it is a fresh reference each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIdx, moveIdx]);

  // If viewing a branch, replay the main line up to the branch point, then the
  // branch's own moves up to branchMoveIdx — same replay technique as the main
  // line, just fed a different move array.
  const branchFen = useMemo(() => {
    if (!branchOpen || !branch) return null;
    const chess = createChess();
    for (let i = 0; i < moveIdx; i++) { const mv = sanToMove(chess, chapter.moves[i].san); if (!mv) break; chess.move(mv.from, mv.to, mv.promo); }
    for (let i = 0; i < branchMoveIdx; i++) { const mv = sanToMove(chess, branch.moves[i].san); if (!mv) break; chess.move(mv.from, mv.to, mv.promo); }
    return chess.getFen();
    // See the note on `mainFen` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchOpen, branch, chapterIdx, moveIdx, branchMoveIdx]);

  const fen = branchOpen && branchFen ? branchFen : mainFen;

  // A few other legal tries at this point, for context (not curated/ranked — just what's legal)
  const alternatives = useMemo(() => {
    if (atEnd) return [];
    const chess = createChess();
    for (let i = 0; i < moveIdx; i++) { const mv = sanToMove(chess, chapter.moves[i].san); if (!mv) break; chess.move(mv.from, mv.to, mv.promo); }
    const mainMv = sanToMove(chess, chapter.moves[moveIdx].san);
    const all = chess.allLegalMoves ? chess.allLegalMoves() : [];
    return all.filter(m => !(mainMv && m.from === mainMv.from && m.to === mainMv.to)).slice(0, 5).map(m => moveToSan(m, ""));
    // `atEnd` is derived from `moveIdx`; see the note on `mainFen` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIdx, moveIdx]);

  // Mark the chapter as completed (New → Learning, first pass) once per session when the user reaches the end
  useEffect(() => {
    if (atEnd && !completedRef.current.has(chapter.id)) {
      completedRef.current.add(chapter.id);
      const progress = { ...opState.progress };
      const openingProg = { ...(progress[opening.id] || {}) };
      const cur = openingProg[chapter.id] || { status: "New", reps: 0 };
      if (cur.status === "New") {
        openingProg[chapter.id] = { ...cur, status: "Learning", reps: (cur.reps || 0) + 1, lastSeen: opTodayStr() };
        progress[opening.id] = openingProg;
        saveProgress({ progress });
      }
    }
    // Fires once per chapter on first completion — `completedRef` guards it.
    // Listing `opState.progress` would re-enter this on every save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atEnd, chapter.id]);

  const goNext = () => { setBranchOpen(false); setBranchMoveIdx(0); setMoveIdx(i => Math.min(totalMoves, i + 1)); };
  const goPrev = () => { setBranchOpen(false); setBranchMoveIdx(0); setMoveIdx(i => Math.max(0, i - 1)); };
  const jumpTo = (i) => { setBranchOpen(false); setBranchMoveIdx(0); setMoveIdx(Math.max(0, Math.min(totalMoves, i))); };
  const openChapter = (idx) => { setChapterIdx(idx); setMoveIdx(0); setPanel("explain"); setBranchOpen(false); setBranchMoveIdx(0); };
  const enterBranch = () => { setBranchOpen(true); setBranchMoveIdx(0); setPanel("explain"); };
  const exitBranch = () => { setBranchOpen(false); setBranchMoveIdx(0); };
  const branchNext = () => setBranchMoveIdx(i => Math.min(branch.moves.length, i + 1));
  const branchPrev = () => setBranchMoveIdx(i => Math.max(0, i - 1));
  const [subMode, setSubMode] = useState("learn"); // learn | practice

  // Practice mode delegates entirely to LearnBoard — the same proven interactive
  // engine (InteractiveBoard + createChess) that already powers practice from the
  // Opening Library, rather than a second move-checking implementation.
  const handlePracticeComplete = (correct, mistakes) => {
    const progress = { ...opState.progress };
    if (!progress[opening.id]) progress[opening.id] = {};
    const current = progress[opening.id][chapter.id] || { status: "New", attempts: 0, correct: 0 };
    const newStatus = nextSrStatus(current.status, mistakes === 0);
    progress[opening.id][chapter.id] = {
      status: newStatus, attempts: current.attempts + 1, correct: current.correct + (mistakes === 0 ? 1 : 0),
      lastSeen: opTodayStr(), dueDate: addDays(SR_INTERVALS[newStatus] || 1),
    };
    saveProgress({ progress });
  };

  const chapterProgress = opState.progress?.[opening.id]?.[chapter.id]?.status || "New";
  const overallPct = getOpeningProgress(opState, opening.id);
  const statusColor = { New: muted, Learning: BLUE, Good: G, Strong: GOLD, Mastered: "#4ade80" };

  return (
    <div style={{ animation: "cmFade 0.3s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onExit} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 9, width: 34, height: 34, color: fg, cursor: "pointer", fontSize: 16 }}>←</button>
          <div>
            <div style={{ fontSize: "0.66rem", color: G, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Learning Mode</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: fg, fontFamily: "Georgia,serif" }}>{opening.name}</div>
              {opening.eco && <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: muted, border: `1px solid ${border}`, borderRadius: 5, padding: "1px 6px" }}>ECO {opening.eco}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: "0.72rem", color: muted }}>Opening mastery</div>
          <div style={{ width: 90, height: 6, background: dark ? "rgba(255,255,255,0.08)" : "#e5e9f5", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${overallPct}%`, background: GOLD, borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: GOLD }}>{overallPct}%</span>
        </div>
      </div>

      {/* Chapter navigator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", paddingBottom: 4 }}>
        {opening.variations.map((v, i) => {
          const st = opState.progress?.[opening.id]?.[v.id]?.status || "New";
          const active = i === chapterIdx;
          return (
            <button key={v.id} onClick={() => openChapter(i)} style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 7, padding: "9px 14px",
              borderRadius: 10, border: `1px solid ${active ? G + "66" : border}`,
              background: active ? `${G}1a` : card, color: active ? "#60A5FA" : fg,
              fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor[st], flexShrink: 0 }} />
              Ch.{i + 1} {v.name}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button onClick={() => setSubMode("learn")} style={{ padding: "7px 14px", background: subMode === "learn" ? `${G}18` : "transparent", border: `1px solid ${subMode === "learn" ? G + "44" : border}`, borderRadius: 9, color: subMode === "learn" ? G : muted, fontWeight: subMode === "learn" ? 700 : 500, fontSize: "0.78rem", cursor: "pointer" }}>📖 Learn Mode</button>
        <button onClick={() => setSubMode("practice")} style={{ padding: "7px 14px", background: subMode === "practice" ? `${G}18` : "transparent", border: `1px solid ${subMode === "practice" ? G + "44" : border}`, borderRadius: 9, color: subMode === "practice" ? G : muted, fontWeight: subMode === "practice" ? 700 : 500, fontSize: "0.78rem", cursor: "pointer" }}>🎯 Practice Mode</button>
      </div>

      {subMode === "practice" ? (
        <LearnBoard variation={chapter} onComplete={handlePracticeComplete} dark={dark} G={G} AMBER={AMBER} border={border} card={card} fg={fg} muted={muted} mode="practice" lineNumber={chapterIdx + 1} lineTotal={opening.variations.length} courseName={opening.name} />
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "start" }} className="cf-mgr-grid">
        {/* Board + controls */}
        <div>
          <OpeningBoard fen={fen} interactive={false} dark={dark} baseSqSize={44} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
            <button onClick={() => jumpTo(0)} disabled={moveIdx === 0} title="First move" style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${border}`, background: "transparent", color: moveIdx === 0 ? muted : fg, fontWeight: 700, cursor: moveIdx === 0 ? "not-allowed" : "pointer", opacity: moveIdx === 0 ? 0.5 : 1 }}>⏮</button>
            <button onClick={goPrev} disabled={moveIdx === 0} title="Previous move" style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${border}`, background: "transparent", color: moveIdx === 0 ? muted : fg, fontWeight: 700, cursor: moveIdx === 0 ? "not-allowed" : "pointer", opacity: moveIdx === 0 ? 0.5 : 1 }}>← Prev</button>
            <button onClick={goNext} disabled={atEnd} title="Next move" style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: atEnd ? (dark ? "rgba(255,255,255,0.06)" : "#e5e9f5") : `linear-gradient(135deg,${G},#60A5FA)`, color: atEnd ? muted : "#fff", fontWeight: 700, cursor: atEnd ? "not-allowed" : "pointer" }}>
              {atEnd ? "Chapter Complete ✓" : "Next Move →"}
            </button>
            <button onClick={() => jumpTo(totalMoves)} disabled={atEnd} title="Last move" style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${border}`, background: "transparent", color: atEnd ? muted : fg, fontWeight: 700, cursor: atEnd ? "not-allowed" : "pointer", opacity: atEnd ? 0.5 : 1 }}>⏭</button>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: muted, marginBottom: 4 }}>
              <span>Move {Math.min(moveIdx, totalMoves)} of {totalMoves}</span>
              <span style={{ color: statusColor[chapterProgress], fontWeight: 700 }}>{chapterProgress}</span>
            </div>
            <div style={{ height: 5, background: dark ? "rgba(255,255,255,0.08)" : "#e5e9f5", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(Math.min(moveIdx, totalMoves) / totalMoves) * 100}%`, background: G, borderRadius: 3, transition: "width 0.25s" }} />
            </div>
          </div>
          {/* Move list */}
          <div style={{ marginTop: 12, maxWidth: 320 }}>
            <MoveList moves={chapter.moves} currentIdx={moveIdx - 1} doneColor={muted} currentColor={G} mutedColor={muted} onClickMove={(i) => jumpTo(i + 1)} size="0.72rem" idleBorder={border} />
          </div>
          {branch && !branchOpen && (
            <button onClick={enterBranch} style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: `1px solid ${PURPLE}44`, background: `${PURPLE}12`, color: PURPLE, fontWeight: 700, fontSize: "0.74rem", cursor: "pointer" }}>
              🔀 View alternative: {branch.name}
            </button>
          )}
        </div>

        {/* Info panel */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20, minHeight: 380 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            <PanelBtn panel={panel} setPanel={setPanel} accent={G} border={border} muted={muted} id="explain" icon="💬" label="This Move" />
            <PanelBtn panel={panel} setPanel={setPanel} accent={G} border={border} muted={muted} id="strategy" icon="🧭" label="Strategy" />
            <PanelBtn panel={panel} setPanel={setPanel} accent={G} border={border} muted={muted} id="tactics" icon="⚡" label="Tactics" />
            <PanelBtn panel={panel} setPanel={setPanel} accent={G} border={border} muted={muted} id="mistakes" icon="⚠️" label="Mistakes" />
            <PanelBtn panel={panel} setPanel={setPanel} accent={G} border={border} muted={muted} id="alt" icon="🔀" label="Alternatives" />
          </div>

          {panel === "explain" && branchOpen && branch && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: "0.68rem", color: PURPLE, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  🔀 {branch.name}
                </div>
                <button onClick={exitBranch} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 7, padding: "3px 9px", color: muted, fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>← Main line</button>
              </div>
              {branch.note && <div style={{ fontSize: "0.78rem", color: muted, marginBottom: 14, lineHeight: 1.6 }}>{branch.note}</div>}
              <div style={{ fontSize: "0.92rem", color: fg, lineHeight: 1.7, marginBottom: 18 }}>
                {branchMoveIdx >= branch.moves.length
                  ? "End of this branch."
                  : `${branchMoveIdx + 1}. ${branch.moves[branchMoveIdx].san} — ${branch.moves[branchMoveIdx].explain}`}
              </div>
              <div style={{ marginTop: 10, marginBottom: 16 }}>
                <EvaluationBar fen={fen} dark={dark} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={branchPrev} disabled={branchMoveIdx === 0} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: `1px solid ${border}`, background: "transparent", color: branchMoveIdx === 0 ? muted : fg, fontWeight: 700, cursor: branchMoveIdx === 0 ? "not-allowed" : "pointer", opacity: branchMoveIdx === 0 ? 0.5 : 1, fontSize: "0.78rem" }}>← Prev</button>
                <button onClick={branchNext} disabled={branchMoveIdx >= branch.moves.length} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", background: branchMoveIdx >= branch.moves.length ? (dark ? "rgba(255,255,255,0.06)" : "#e5e9f5") : `linear-gradient(135deg,${PURPLE},#8b5cf6)`, color: branchMoveIdx >= branch.moves.length ? muted : "#fff", fontWeight: 700, cursor: branchMoveIdx >= branch.moves.length ? "not-allowed" : "pointer", fontSize: "0.78rem" }}>Next →</button>
              </div>
              <div style={{ marginTop: 14 }}>
                <MoveList moves={branch.moves} currentIdx={branchMoveIdx - 1} doneColor={PURPLE} currentColor={PURPLE} mutedColor={muted} idleBorder={border} />
              </div>
            </div>
          )}

          {panel === "explain" && !branchOpen && (
            <div>
              <div style={{ fontSize: "0.68rem", color: G, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                {atEnd ? "Chapter complete" : `Move ${moveIdx + 1}: ${currentMove.san}`}
              </div>
              <div style={{ fontSize: "0.92rem", color: fg, lineHeight: 1.7, marginBottom: 18 }}>
                {atEnd
                  ? `You've worked through the ${chapter.name} line. ${chapter.plans || ""}`
                  : currentMove.explain}
              </div>
              {/* Evaluation bar — shared component, material-only until an engine is connected */}
              <div style={{ marginTop: 10 }}>
                <EvaluationBar fen={fen} dark={dark} />
                <AnalysisInfo engineEval={null} dark={dark} />
              </div>
              {atEnd && chapter.traps?.length > 0 && (
                <div style={{ marginTop: 16, padding: "12px 14px", background: `${AMBER}12`, border: `1px solid ${AMBER}33`, borderRadius: 10 }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: AMBER, marginBottom: 4 }}>⚠ Watch out for</div>
                  <div style={{ fontSize: "0.8rem", color: fg, lineHeight: 1.5 }}>{chapter.traps[0]}</div>
                </div>
              )}
            </div>
          )}

          {panel === "strategy" && (
            <div>
              <div style={{ fontSize: "0.68rem", color: BLUE, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Strategic Ideas</div>
              {(opening.strategicConcepts || opening.mainIdeas || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: "0.85rem", color: fg, lineHeight: 1.5 }}>
                  <span style={{ color: BLUE }}>▸</span>{s}
                </div>
              ))}
              {!(opening.strategicConcepts || opening.mainIdeas) && <div style={{ fontSize: "0.8rem", color: muted }}>No strategic notes for this opening yet.</div>}
            </div>
          )}

          {panel === "tactics" && (
            <div>
              <div style={{ fontSize: "0.68rem", color: RED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Tactical Themes</div>
              {(opening.tacticalThemes || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: "0.85rem", color: fg, lineHeight: 1.5 }}>
                  <span style={{ color: RED }}>⚡</span>{s}
                </div>
              ))}
              {!(opening.tacticalThemes?.length) && <div style={{ fontSize: "0.8rem", color: muted }}>No tactical themes logged for this opening yet.</div>}
            </div>
          )}

          {panel === "mistakes" && (
            <div>
              <div style={{ fontSize: "0.68rem", color: AMBER, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Common Mistakes</div>
              {(opening.commonMistakes || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: "0.85rem", color: fg, lineHeight: 1.5 }}>
                  <span style={{ color: AMBER }}>✕</span>{s}
                </div>
              ))}
              {!(opening.commonMistakes?.length) && <div style={{ fontSize: "0.8rem", color: muted }}>No common mistakes logged for this opening yet.</div>}
            </div>
          )}

          {panel === "alt" && (
            <div>
              <div style={{ fontSize: "0.68rem", color: PURPLE, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Other Legal Tries Here</div>
              <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 12 }}>Not ranked or curated — just other legal moves available in this position, for context.</div>
              {atEnd ? (
                <div style={{ fontSize: "0.8rem", color: muted }}>Chapter complete — no further moves to compare.</div>
              ) : alternatives.length === 0 ? (
                <div style={{ fontSize: "0.8rem", color: muted }}>No other reasonable tries at this point.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {alternatives.map((san, i) => (
                    <span key={i} style={{ padding: "6px 12px", borderRadius: 8, background: `${PURPLE}14`, border: `1px solid ${PURPLE}33`, color: PURPLE, fontWeight: 700, fontSize: "0.78rem", fontFamily: "monospace" }}>{san}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export {
  LearningModeView,
};
