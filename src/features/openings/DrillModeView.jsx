import { useState, useMemo } from "react";
import { LearnBoard } from "./LearnBoard.jsx";
import { OPENING_REPERTOIRE } from "../../data/openingRepertoire.js";
import { SR_INTERVALS, addDays, getDueVariations, nextSrStatus, opTodayStr } from "../../services/openingProgress.js";

// ── DRILL MODE ─────────────────────────────────────────────────────────────
// Cycles through every variation due for review (real spaced-repetition due
// dates from getDueVariations — same data the Dashboard's "Practice Due
// Today" card already reads) and, when nothing is due, falls back to lines
// still at New/Learning across the whole repertoire. Reuses LearnBoard
// exactly like MasteryTestRunner does — same Hint/Reveal/Flip/Reset controls,
// same SR persistence via nextSrStatus/addDays. A wrong attempt requeues that
// line at the end of the session's queue, so weak lines really do repeat more
// within a sitting — no new backend, just reusing what already exists.
function DrillModeView({ dark, opState, saveOp, onExit, G, AMBER, card, border, fg, muted }) {
  // Snapshot at session start: the queue must not reshuffle under the user
  // mid-drill, so `opState` is read once and deliberately not a dependency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const due = useMemo(() => getDueVariations(opState), []);
  const weakFallback = useMemo(() => {
    if (due.length) return [];
    const list = [];
    OPENING_REPERTOIRE.forEach(op => op.variations.forEach(v => {
      const p = opState.progress[op.id]?.[v.id];
      if (p && (p.status === "New" || p.status === "Learning")) {
        list.push({ openingId: op.id, openingName: op.name, variationId: v.id, variationName: v.name, status: p.status });
      }
    }));
    return list;
    // Same session-snapshot reasoning as `due` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const originalQueue = due.length ? due : weakFallback;

  const [queue, setQueue] = useState(originalQueue);
  const [idx, setIdx] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [sessionResults, setSessionResults] = useState([]); // [{variationName, mistakes}]

  const cycle = originalQueue.length ? Math.floor(completedCount / originalQueue.length) + 1 : 1;
  const item = queue[idx];
  const opening = item && OPENING_REPERTOIRE.find(o => o.id === item.openingId);
  const variation = opening && opening.variations.find(v => v.id === item.variationId);

  const handleComplete = (correct, mistakes) => {
    const prog = { ...opState.progress };
    if (!prog[item.openingId]) prog[item.openingId] = {};
    const cur = prog[item.openingId][item.variationId] || { status: "New", attempts: 0, correct: 0 };
    const newStatus = nextSrStatus(cur.status, mistakes === 0);
    prog[item.openingId][item.variationId] = {
      status: newStatus, attempts: cur.attempts + 1, correct: cur.correct + (mistakes === 0 ? 1 : 0),
      lastSeen: opTodayStr(), dueDate: addDays(SR_INTERVALS[newStatus] || 1),
    };
    const totalLearned = Object.values(prog).reduce((sum, o) => sum + Object.values(o).filter(v => v.status === "Mastered" || v.status === "Strong").length, 0);
    saveOp({ progress: prog, totalVariationsLearned: totalLearned });

    setSessionResults(r => [...r, { variationName: variation.name, openingName: opening.name, mistakes }]);
    setCompletedCount(c => c + 1);
    if (mistakes > 0) setQueue(q => [...q, item]); // weak line — repeat later in this session
    setTimeout(() => setIdx(i => i + 1), 1500);
  };

  if (originalQueue.length === 0) {
    return (
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>✅</div>
        <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1.1rem", color: fg, marginBottom: 6 }}>All caught up!</div>
        <div style={{ fontSize: "0.85rem", color: muted, marginBottom: 18 }}>Nothing due for review, and no lines still at New/Learning. Head to the library to start a new opening.</div>
        <button onClick={onExit} style={{ background: `${G}18`, border: `1px solid ${G}44`, color: G, fontWeight: 700, fontSize: "0.82rem", borderRadius: 10, padding: "10px 20px", cursor: "pointer" }}>Back</button>
      </div>
    );
  }

  if (!item) {
    const clean = sessionResults.filter(r => r.mistakes === 0).length;
    return (
      <div style={{ background: card, border: `1px solid #4ade8055`, borderRadius: 16, padding: "36px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>🔥</div>
        <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1.15rem", color: fg, marginBottom: 6 }}>Drill Session Complete</div>
        <div style={{ fontSize: "0.85rem", color: muted, marginBottom: 18 }}>{clean} of {sessionResults.length} reps reproduced cleanly across {cycle > 1 ? `${cycle} cycles` : "1 cycle"}.</div>
        <button onClick={onExit} style={{ background: `${G}18`, border: `1px solid ${G}44`, color: G, fontWeight: 700, fontSize: "0.82rem", borderRadius: 10, padding: "10px 20px", cursor: "pointer" }}>Done</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: AMBER, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Drill Mode · Cycle #{cycle} · Line {idx + 1} of {queue.length}</div>
          <div style={{ fontWeight: 700, fontSize: "1.05rem", color: fg }}>{opening.name} <span style={{ color: muted, fontWeight: 500 }}>— {variation.name}</span></div>
        </div>
        <button onClick={onExit} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 9, padding: "7px 14px", color: muted, fontSize: "0.78rem", cursor: "pointer" }}>Exit Drill</button>
      </div>
      <LearnBoard key={`${item.openingId}:${item.variationId}:${idx}`} variation={variation} mode="practice" onComplete={handleComplete} dark={dark} G={G} AMBER={AMBER} border={border} card={card} fg={fg} muted={muted} lineNumber={idx + 1} lineTotal={queue.length} courseName={opening.name} />
    </div>
  );
}

export {
  DrillModeView,
};
