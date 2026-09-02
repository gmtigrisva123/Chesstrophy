import { useState } from "react";
import { PuzzlePanel } from "./PuzzlePanel.jsx";
import { MiniStaticBoard } from "../../components/chess/MiniStaticBoard.jsx";
import { OPENING_REPERTOIRE } from "../../data/openingRepertoire.js";
import { PUZZLE_DB } from "../../data/puzzles.js";
import { getOpeningProgress, loadAcademyState, saveAcademyState } from "../../services/openingProgress.js";
import { ACADEMY_FOREST, ACADEMY_FOREST_DEEP } from "../../theme/academyTheme.js";

function AcademySectionPath({ title, num, items, dark, unlockedCount }) {
  const fg = dark ? "#f0f0f0" : "#111";
  const muted = dark ? "#888" : "#666";
  const card = dark ? "rgba(255,255,255,0.03)" : "#fff";
  const border = dark ? "rgba(148,163,255,0.10)" : "#e8e8e8";

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "36px 0 18px" }}>
        <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#C9A84C", fontWeight: 700 }}>{num}</span>
        <span style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1.05rem", color: fg }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: border }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item, i) => {
          // item.completed is always authoritative. unlockedCount (really: index
          // of the first not-yet-completed item) only decides which ONE
          // not-yet-completed item is "current" vs "locked" — it must never be
          // used to infer completion for items that aren't actually completed.
          const state = item.completed ? "completed" : i === unlockedCount ? "current" : "locked";
          const isMilestone = item.milestone;
          const clickable = state !== "locked";
          return (
            <div key={item.id}
              onClick={() => clickable && item.onClick && item.onClick()}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: isMilestone ? `linear-gradient(135deg,${ACADEMY_FOREST_DEEP},#16281c)` : (state === "locked" ? (dark ? "rgba(255,255,255,0.015)" : "#f4f4f0") : card),
                border: state === "current" ? "1px solid #C9A84C77" : `1px solid ${isMilestone ? ACADEMY_FOREST_DEEP : border}`,
                borderRadius: 14, padding: isMilestone ? "20px 20px" : "14px 16px",
                cursor: clickable ? "pointer" : "default",
                boxShadow: state === "current" ? "0 8px 22px rgba(201,168,76,0.14)" : "none",
                opacity: state === "locked" ? 0.7 : 1,
                transition: "transform 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => { if (clickable) e.currentTarget.style.transform = "translateX(3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
            >
              <div style={{
                width: isMilestone ? 42 : 34, height: isMilestone ? 42 : 34, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMilestone ? 18 : 15,
                background: state === "completed" ? `${ACADEMY_FOREST}22` : state === "current" ? "#C9A84C22" : isMilestone ? "rgba(201,168,76,0.14)" : (dark ? "rgba(255,255,255,0.04)" : "#eee"),
                color: state === "completed" ? ACADEMY_FOREST : state === "current" ? "#C9A84C" : isMilestone ? "#C9A84C" : muted,
              }}>
                {state === "locked" ? "🔒" : state === "completed" ? "✓" : item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: isMilestone ? "0.95rem" : "0.85rem", color: isMilestone ? "#fff" : (state === "locked" ? muted : fg), fontFamily: isMilestone ? "Georgia,serif" : "inherit" }}>{item.title}</div>
                <div style={{ fontSize: "0.72rem", color: isMilestone ? "#B9CBBD" : muted, marginTop: 2, fontFamily: item.notation ? "monospace" : "inherit" }}>{item.notation || item.meta}</div>
              </div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: state === "completed" ? ACADEMY_FOREST : state === "current" ? "#C9A84C" : muted, flexShrink: 0 }}>
                {state === "completed" ? "Done" : state === "current" ? "Continue →" : state === "locked" ? "Locked" : "Start"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpeningAcademyView({ dark, opState, openOpening, onBrowseLibrary }) {
  const fg = dark ? "#f0f0f0" : "#111";
  const muted = dark ? "#888" : "#666";
  const border = dark ? "rgba(148,163,255,0.10)" : "#e8e8e8";

  const [academy, setAcademy] = useState(loadAcademyState);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const toggleConcept = (id) => {
    const has = academy.completedConcepts.includes(id);
    const next = { ...academy, completedConcepts: has ? academy.completedConcepts.filter(c => c !== id) : [...academy.completedConcepts, id] };
    setAcademy(next); saveAcademyState(next);
  };
  // BUG FIX: the puzzle's onComplete callback was calling toggleConcept, which
  // FLIPS state — so re-solving an already-completed puzzle would un-mark it as
  // complete instead of leaving it complete. A puzzle result should only ever
  // set completion, never toggle it off.
  const markConceptDone = (id) => {
    if (academy.completedConcepts.includes(id)) return;
    const next = { ...academy, completedConcepts: [...academy.completedConcepts, id] };
    setAcademy(next); saveAcademyState(next);
  };
  const isConceptDone = (id) => academy.completedConcepts.includes(id);
  const openingDone = (id) => getOpeningProgress(opState, id) >= 100;

  const featured = OPENING_REPERTOIRE.find(o => o.id === "italian");

  const sections = [
    {
      num: "01", title: "Opening Foundations",
      items: [
        { id: "f1", icon: "①", title: "The First 5 Moves", meta: "Concept · click to mark complete", completed: isConceptDone("f1"), onClick: () => toggleConcept("f1") },
        { id: "f2", icon: "②", title: "Development Principles", meta: "Concept · click to mark complete", completed: isConceptDone("f2"), onClick: () => toggleConcept("f2") },
        { id: "f3", icon: "③", title: "Control the Center", meta: "Concept · click to mark complete", completed: isConceptDone("f3"), onClick: () => toggleConcept("f3") },
        { id: "f4", icon: "④", title: "King Safety", meta: "Concept · click to mark complete", completed: isConceptDone("f4"), onClick: () => toggleConcept("f4") },
      ],
    },
    {
      num: "02", title: "White Repertoire",
      items: [
        { id: "w1", icon: "♙", title: "1.e4 Fundamentals", meta: "Concept · click to mark complete", completed: isConceptDone("w1"), onClick: () => toggleConcept("w1") },
        { id: "w2", icon: "♗", title: "Italian Game", notation: "1.e4 e5 2.Nf3 Nc6 3.Bc4", completed: openingDone("italian"), onClick: () => openOpening("italian") },
        { id: "w3", icon: "♕", title: "Queen's Gambit", meta: "Concept · click to mark complete", completed: isConceptDone("w3"), onClick: () => toggleConcept("w3") },
        { id: "w4", icon: "♘", title: "English Opening", notation: "1.c4", completed: openingDone("english"), onClick: () => openOpening("english") },
      ],
    },
    {
      num: "03", title: "Black Repertoire",
      items: [
        { id: "b1", icon: "♟", title: "Defenses Against 1.e4", meta: "Concept · click to mark complete", completed: isConceptDone("b1"), onClick: () => toggleConcept("b1") },
        { id: "b2", icon: "♟", title: "Defenses Against 1.d4", meta: "Concept · click to mark complete", completed: isConceptDone("b2"), onClick: () => toggleConcept("b2") },
        { id: "b3", icon: "♞", title: "Sicilian Defense", notation: "1.e4 c5", completed: openingDone("sicilian"), onClick: () => openOpening("sicilian") },
        { id: "b4", icon: "♛", title: "Queen's Gambit Declined", notation: "1.d4 d5 2.c4 e6", completed: openingDone("qgd"), onClick: () => openOpening("qgd") },
      ],
    },
    {
      num: "04", title: "Tactical Ideas",
      items: [
        { id: "t1", icon: "⚡", title: "Common Opening Traps", meta: "Concept · click to mark complete", completed: isConceptDone("t1"), onClick: () => toggleConcept("t1") },
        { id: "t2", icon: "◆", title: "Tactical Motifs", meta: "Concept · click to mark complete", completed: isConceptDone("t2"), onClick: () => toggleConcept("t2") },
        { id: "t3", icon: "◇", title: "Punishing Mistakes", meta: "Concept · click to mark complete", completed: isConceptDone("t3"), onClick: () => toggleConcept("t3") },
        { id: "t4", icon: "◈", title: "Recognizing Patterns", meta: "Concept · click to mark complete", completed: isConceptDone("t4"), onClick: () => toggleConcept("t4") },
      ],
    },
    {
      num: "05", title: "Mastery",
      items: [
        { id: "m1", icon: "📋", title: "Build Your Repertoire", meta: "Opens your Opening Library", completed: isConceptDone("m1"), onClick: () => { toggleConcept("m1"); onBrowseLibrary(); } },
        { id: "m2", icon: "🧩", title: "Practice Against the Engine", meta: "Concept · click to mark complete", completed: isConceptDone("m2"), onClick: () => toggleConcept("m2") },
        { id: "m3", icon: "📝", title: "Opening Tests", meta: isConceptDone("m3") ? "Solved" : "Interactive puzzle — powered by the new Puzzle Mode architecture", completed: isConceptDone("m3"), onClick: () => setShowPuzzle(true) },
        { id: "m4", icon: "🏆", title: "Grandmaster Challenges", meta: "Capstone milestone", completed: isConceptDone("m4"), milestone: true, onClick: () => toggleConcept("m4") },
      ],
    },
  ];

  const totalItems = sections.reduce((n, s) => n + s.items.length, 0);
  const totalDone = sections.reduce((n, s) => n + s.items.filter(i => i.completed).length, 0);

  return (
    <div style={{ animation: "opFade 0.4s ease" }}>
      <style>{`
        @media (max-width: 640px) {
          .op-academy-hero { grid-template-columns: 1fr !important; }
          .op-academy-hero > div:last-child { justify-self: start; }
        }
      `}</style>
      {/* Hero */}
      <div className="op-academy-hero" style={{
        position: "relative", overflow: "hidden", borderRadius: 20,
        padding: "30px 32px", marginBottom: 8,
        background: dark ? `linear-gradient(135deg,#0c120e,#0a0a0a 60%,#0a0e0b)` : `linear-gradient(135deg,#F6F2EA,#fff)`,
        border: `1px solid ${ACADEMY_FOREST}33`,
        display: "grid", gridTemplateColumns: "1fr auto", gap: 30, alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 10 }}>Opening Academy</div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, color: fg, letterSpacing: "-0.02em", marginBottom: 8 }}>Opening Mastery</div>
          <div style={{ fontSize: "0.85rem", color: muted, marginBottom: 20, maxWidth: 420, lineHeight: 1.55 }}>Build your opening repertoire step by step — from foundational principles to tournament-ready lines for both colors.</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem", color: fg }}>{totalDone} / {totalItems}</span>
            <span style={{ fontSize: "0.76rem", color: muted }}>steps completed</span>
          </div>
          <div style={{ height: 7, background: dark ? "#1a1a1a" : "#e8e8e8", borderRadius: 4, overflow: "hidden", marginBottom: 20, maxWidth: 340 }}>
            <div style={{ height: "100%", width: `${(totalDone / totalItems) * 100}%`, background: `linear-gradient(90deg,${ACADEMY_FOREST},#5C9271)`, borderRadius: 4, transition: "width 0.5s" }} />
          </div>
          <button onClick={onBrowseLibrary} style={{ padding: "11px 20px", borderRadius: 11, border: "none", background: ACADEMY_FOREST, color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", boxShadow: `0 6px 18px ${ACADEMY_FOREST}44` }}>Browse Full Library →</button>
        </div>
        {featured && (
          <div style={{ background: ACADEMY_FOREST_DEEP, borderRadius: 16, padding: "14px 14px 12px", boxShadow: "0 10px 26px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#CFEBD8" }}>{featured.name}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.64rem", color: "#8FAF97" }}>ECO {featured.eco}</span>
            </div>
            <MiniStaticBoard fen="r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3" size={176} />
            <div style={{ fontFamily: "monospace", fontSize: "0.66rem", color: "#B9CBBD", marginTop: 10 }}>1.e4 e5 2.Nf3 Nc6 3.Bc4</div>
          </div>
        )}
      </div>

      {/* Path */}
      {sections.map(s => {
        // BUG FIX: this used to be `filter(completed).length` used as a position
        // cutoff — but real openings (Italian/Sicilian/QGD/English) can be
        // completed independently via the Opening Library, out of Academy order.
        // That could inflate the count and falsely render an untouched earlier
        // item as "completed" just because a later one happened to be done.
        // The true sequential frontier is the first NOT-completed item, full stop.
        const firstIncomplete = s.items.findIndex(i => !i.completed);
        const unlockedIdx = firstIncomplete === -1 ? s.items.length : firstIncomplete;
        return <AcademySectionPath key={s.num} num={s.num} title={s.title} items={s.items} dark={dark} unlockedCount={unlockedIdx} />;
      })}

      {/* Opening Tests — a real puzzle powered by the new, generic PuzzlePanel (Phase 9).
          Reuses one real puzzle from the existing PUZZLE_DB read-only; the live
          Puzzles page and PUZZLE_DB itself are untouched. */}
      {showPuzzle && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowPuzzle(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: dark ? "#0c0c0c" : "#fff", border: `1px solid ${border}`, borderRadius: 18, padding: 26, maxWidth: 460, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1.05rem", color: fg }}>Opening Tests</div>
              <button onClick={() => setShowPuzzle(false)} style={{ background: "transparent", border: "none", color: muted, fontSize: "1.1rem", cursor: "pointer" }}>✕</button>
            </div>
            <PuzzlePanel
              puzzle={PUZZLE_DB.find(p => p.id === "potd")}
              dark={dark}
              onComplete={({ success }) => { if (success) markConceptDone("m3"); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export {
  OpeningAcademyView,
  AcademySectionPath,
};
