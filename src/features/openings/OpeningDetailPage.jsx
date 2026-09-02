import { useState } from "react";
import { LearnBoard } from "./LearnBoard.jsx";
import { MasteryBars, MasteryTestRunner } from "./MasteryTest.jsx";
import { OpDiffBadge, SrBadge, StyleTag } from "./OpeningBadges.jsx";
import { LEARNING_STAGES } from "../../data/learningStages.js";
import { SR_INTERVALS, addDays, getOpeningMasteryBreakdown, getOpeningProgress, loadAcademyState, nextSrStatus, opTodayStr, saveAcademyState } from "../../services/openingProgress.js";

// Module scope: these were previously closures inside OpeningDetailPage, which
// made them a new component type on every render and remounted the entire
// stage panel whenever progress was saved.
function InfoBlock({ title, content, accent, fg }) {
  if (!content) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: accent, marginBottom: 6 }}>{title}</div>
      {Array.isArray(content)
        ? <ul style={{ margin: 0, paddingLeft: 18 }}>{content.map(c => <li key={c} style={{ fontSize: "0.83rem", color: fg, lineHeight: 1.7, marginBottom: 3 }}>{c}</li>)}</ul>
        : <div style={{ fontSize: "0.83rem", color: fg, lineHeight: 1.7 }}>{content}</div>}
    </div>
  );
}

function MarkLearnedBtn({ stageId, learned, onMarkLearned, accent }) {
  return (
    <button onClick={() => onMarkLearned(stageId)} disabled={learned} style={{
      marginTop: 4, background: learned ? "#4ade8018" : `${accent}18`,
      border: `1px solid ${learned ? "#4ade8044" : accent + "44"}`,
      color: learned ? "#4ade80" : accent, fontWeight: 700, fontSize: "0.78rem",
      borderRadius: 9, padding: "9px 16px", cursor: learned ? "default" : "pointer",
    }}>{learned ? "✓ Learned" : "Mark as Learned →"}</button>
  );
}

function VariationGrid({ startMode, opening, prog, theme, onOpenVariation }) {
  const { fg, muted, card, border } = theme;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
      {opening.variations.map(v => {
        const status = prog[v.id]?.status || "New";
        return (
          <div key={v.id} onClick={() => onOpenVariation(v.id, startMode)} style={{ background: card, border: `1px solid ${border}`, borderRadius: 13, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = opening.color + "55"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = "none"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: "0.86rem", color: fg }}>{v.name}</span>
              <SrBadge status={status} />
            </div>
            <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 8 }}>{v.moves.length} moves · <OpDiffBadge level={v.difficulty} /></div>
            <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: opening.color, background: opening.color + "12", borderRadius: 6, padding: "5px 9px" }}>{v.moves.slice(0, 4).map((m, i) => `${i % 2 === 0 ? Math.floor(i / 2) + 1 + "." : ""}${m.san}`).join(" ")}…</div>
          </div>
        );
      })}
    </div>
  );
}

function OpeningDetailPage({ opening, opState, saveOp, onBack, dark, G, AMBER, card, border, fg, muted }) {
  const [activeVariation, setActiveVariation] = useState(null);
  const [variationMode, setVariationMode] = useState("learn"); // learn | practice
  const [openStage, setOpenStage] = useState("foundations");
  const [testing, setTesting] = useState(false);
  const isFav = opState.favorites.includes(opening.id);
  const inRepertoire = opState.repertoire.includes(opening.id);
  const progressPct = getOpeningProgress(opState, opening.id);
  const breakdown = getOpeningMasteryBreakdown(opState, opening.id);

  const [academy, setAcademy] = useState(loadAcademyState);
  const markLearned = (stageId) => {
    const key = `${opening.id}:${stageId}`;
    if (academy.completedConcepts.includes(key)) return;
    const next = { ...academy, completedConcepts: [...academy.completedConcepts, key] };
    setAcademy(next); saveAcademyState(next);
  };
  const isLearned = (stageId) => academy.completedConcepts.includes(`${opening.id}:${stageId}`);

  const toggleFav = () => {
    const nf = isFav ? opState.favorites.filter(f => f !== opening.id) : [...opState.favorites, opening.id];
    saveOp({ favorites: nf });
  };
  const toggleRepertoire = () => {
    const nr = inRepertoire ? opState.repertoire.filter(r => r !== opening.id) : [...opState.repertoire, opening.id];
    saveOp({ repertoire: nr });
  };

  const handleVariationComplete = (variationId, correct, mistakes) => {
    const prog = { ...opState.progress };
    if (!prog[opening.id]) prog[opening.id] = {};
    const current = prog[opening.id][variationId] || { status: "New", attempts: 0, correct: 0 };
    const newStatus = nextSrStatus(current.status, mistakes === 0);
    prog[opening.id][variationId] = {
      status: newStatus,
      attempts: current.attempts + 1,
      correct: current.correct + (mistakes === 0 ? 1 : 0),
      lastSeen: opTodayStr(),
      dueDate: addDays(SR_INTERVALS[newStatus] || 1),
    };
    const recents = [opening.id, ...opState.recentlyPracticed.filter(id => id !== opening.id)].slice(0, 8);
    const totalLearned = Object.values(prog).reduce((sum, o) => sum + Object.values(o).filter(v => v.status === "Mastered" || v.status === "Strong").length, 0);
    saveOp({ progress: prog, recentlyPracticed: recents, totalVariationsLearned: totalLearned });
  };

  const prog = opState.progress[opening.id] || {};
  const allSeen = opening.variations.every(v => (prog[v.id]?.status || "New") !== "New");
  const allGoodPlus = opening.variations.every(v => ["Good", "Strong", "Mastered"].includes(prog[v.id]?.status));

  const stageDone = (stageId) => {
    if (stageId === "variations") return allSeen;
    if (stageId === "practice") return allGoodPlus;
    if (stageId === "test") return isLearned("test-passed");
    return isLearned(stageId);
  };
  const stageUnlocked = (i) => i === 0 || stageDone(LEARNING_STAGES[i - 1].id);
  const gridTheme = { fg, muted, card, border };
  const openVariation = (id, startMode) => { setVariationMode(startMode); setActiveVariation(id); };

  if (activeVariation) {
    const v = opening.variations.find(x => x.id === activeVariation);
    return (
      <div style={{ animation: "opFade 0.3s ease" }}>
        <button onClick={() => setActiveVariation(null)} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 9, padding: "7px 14px", color: muted, fontSize: "0.78rem", cursor: "pointer", marginBottom: 16 }}>← Back to {opening.name}</button>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {[{ id: "learn", label: "📖 Learn Mode" }, { id: "practice", label: "🎯 Practice Mode" }].map(m => (
            <button key={m.id} onClick={() => setVariationMode(m.id)} style={{ padding: "7px 14px", background: variationMode === m.id ? `${G}18` : "transparent", border: `1px solid ${variationMode === m.id ? G + "44" : border}`, borderRadius: 9, color: variationMode === m.id ? G : muted, fontWeight: variationMode === m.id ? 700 : 500, fontSize: "0.78rem", cursor: "pointer" }}>{m.label}</button>
          ))}
        </div>
        <LearnBoard variation={v} onComplete={(c, m) => handleVariationComplete(v.id, c, m)} dark={dark} G={G} AMBER={AMBER} border={border} card={card} fg={fg} muted={muted} mode={variationMode} lineNumber={opening.variations.findIndex(x => x.id === activeVariation) + 1} lineTotal={opening.variations.length} courseName={opening.name} />
      </div>
    );
  }

  return (
    <div style={{ animation: "opFade 0.3s ease" }}>
      <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 9, padding: "7px 14px", color: muted, fontSize: "0.78rem", cursor: "pointer", marginBottom: 16 }}>← Back to Library</button>

      {/* Header */}
      <div style={{ background: card, border: `1px solid ${opening.color}33`, borderRadius: 16, padding: "22px 24px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <OpDiffBadge level={opening.difficulty} />
              {opening.tags.map(t => <StyleTag key={t} tag={t} />)}
            </div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.2rem,2.5vw,1.6rem)", fontWeight: 700, color: fg, marginBottom: 4 }}>{opening.name}</h2>
            <div style={{ fontSize: "0.78rem", color: muted }}>{opening.eco} · {opening.forSide} · Rating: {opening.rating} · {opening.studyTime} · {opening.variations.length} lines</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={toggleFav} style={{ background: isFav ? "#f59e0b18" : "transparent", border: `1px solid ${isFav ? "#f59e0b44" : border}`, borderRadius: 9, padding: "8px 12px", color: isFav ? "#f59e0b" : muted, fontSize: "1rem", cursor: "pointer" }}>{isFav ? "★" : "☆"}</button>
            <button onClick={toggleRepertoire} style={{ background: inRepertoire ? `${G}18` : "transparent", border: `1px solid ${inRepertoire ? G + "44" : border}`, borderRadius: 9, padding: "8px 14px", color: inRepertoire ? G : muted, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>{inRepertoire ? "✓ In Repertoire" : "+ Add to Repertoire"}</button>
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 3 }}>Opening Mastery</div>
            <div style={{ fontSize: "1.7rem", fontWeight: 800, color: opening.color, fontFamily: "Georgia,serif" }}>{progressPct}%</div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <MasteryBars breakdown={breakdown} color={opening.color} muted={muted} fg={fg} />
          </div>
        </div>
      </div>

      {/* Learning path */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {LEARNING_STAGES.map((stage, i) => {
          const unlocked = stageUnlocked(i);
          const done = stageDone(stage.id);
          const isOpen = openStage === stage.id && unlocked;
          return (
            <div key={stage.id} style={{ background: card, border: `1px solid ${isOpen ? opening.color + "55" : border}`, borderRadius: 14, overflow: "hidden", opacity: unlocked ? 1 : 0.55 }}>
              <button
                onClick={() => unlocked && setOpenStage(isOpen ? null : stage.id)}
                disabled={!unlocked}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "transparent", border: "none", cursor: unlocked ? "pointer" : "not-allowed", textAlign: "left" }}
              >
                <span style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: done ? 14 : 15, background: done ? "#4ade8018" : unlocked ? `${opening.color}18` : "rgba(148,163,255,0.06)",
                  color: done ? "#4ade80" : unlocked ? opening.color : muted, border: `1px solid ${done ? "#4ade8044" : unlocked ? opening.color + "44" : border}`,
                }}>{done ? "✓" : unlocked ? stage.icon : "🔒"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.86rem", color: unlocked ? fg : muted }}>{stage.label}</div>
                </div>
                <span style={{ color: muted, fontSize: "0.78rem", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
              </button>
              {isOpen && (
                <div style={{ padding: "0 18px 20px", borderTop: `1px solid ${border}`, marginTop: -1, paddingTop: 16 }}>
                  {stage.id === "foundations" && (<>
                    <InfoBlock accent={opening.color} fg={fg} title="Overview" content={opening.overview} />
                    <InfoBlock accent={opening.color} fg={fg} title="History" content={opening.history} />
                    <InfoBlock accent={opening.color} fg={fg} title="Main Ideas" content={opening.mainIdeas} />
                    <InfoBlock accent={opening.color} fg={fg} title="Piece Development" content={opening.pieceDevelopment} />
                    <InfoBlock accent={opening.color} fg={fg} title="Famous Players" content={opening.famousPlayers} />
                    {opening.modelGames?.length > 0 && (
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: opening.color, marginBottom: 8 }}>Model Games</div>
                        {opening.modelGames.map((g, i) => (
                          <div key={i} style={{ background: dark ? "#141414" : "#f5f5f5", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: fg }}>{g.white} vs {g.black} <span style={{ color: muted, fontWeight: 400 }}>({g.year})</span></div>
                            <div style={{ fontSize: "0.78rem", color: muted, marginTop: 4 }}>{g.note}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <MarkLearnedBtn stageId="foundations" learned={isLearned("foundations")} onMarkLearned={markLearned} accent={G} />
                  </>)}
                  {stage.id === "concepts" && (<>
                    <InfoBlock accent={opening.color} fg={fg} title="Strategic Concepts" content={opening.strategicConcepts} />
                    <InfoBlock accent={opening.color} fg={fg} title="Common Mistakes" content={opening.commonMistakes} />
                    <InfoBlock accent={opening.color} fg={fg} title="Move Order Tricks" content={opening.moveOrderTricks} />
                    <InfoBlock accent={opening.color} fg={fg} title="Transpositions" content={opening.transpositions} />
                    <InfoBlock accent={opening.color} fg={fg} title="How Opponents Usually Respond" content={opening.opponentResponses} />
                    <MarkLearnedBtn stageId="concepts" learned={isLearned("concepts")} onMarkLearned={markLearned} accent={G} />
                  </>)}
                  {stage.id === "variations" && (<>
                    <div style={{ fontSize: "0.8rem", color: muted, marginBottom: 12 }}>Go through each line in Learn Mode — the board plays the moves for you with an explanation at each step.</div>
                    <VariationGrid startMode="learn" opening={opening} prog={prog} theme={gridTheme} onOpenVariation={openVariation} />
                  </>)}
                  {stage.id === "plans" && (<>
                    <InfoBlock accent={opening.color} fg={fg} title="Typical Plans" content={opening.typicalPlans} />
                    {opening.variations.map(v => v.plans && (
                      <InfoBlock accent={opening.color} fg={fg} key={v.id} title={`Plan — ${v.name}`} content={v.plans} />
                    ))}
                    <MarkLearnedBtn stageId="plans" learned={isLearned("plans")} onMarkLearned={markLearned} accent={G} />
                  </>)}
                  {stage.id === "positions" && (<>
                    <InfoBlock accent={opening.color} fg={fg} title="Important Squares" content={opening.importantSquares} />
                    <InfoBlock accent={opening.color} fg={fg} title="Pawn Structures" content={opening.pawnStructures} />
                    <MarkLearnedBtn stageId="positions" learned={isLearned("positions")} onMarkLearned={markLearned} accent={G} />
                  </>)}
                  {stage.id === "tactics" && (<>
                    <InfoBlock accent={opening.color} fg={fg} title="Tactical Themes" content={opening.tacticalThemes} />
                    <InfoBlock accent={opening.color} fg={fg} title="Typical Sacrifices" content={opening.typicalSacrifices} />
                    <InfoBlock accent={opening.color} fg={fg} title="Common Traps" content={opening.commonTraps?.length ? opening.commonTraps : "No major traps documented for this opening — solid, low-risk play."} />
                    <MarkLearnedBtn stageId="tactics" learned={isLearned("tactics")} onMarkLearned={markLearned} accent={G} />
                  </>)}
                  {stage.id === "practice" && (<>
                    <div style={{ fontSize: "0.8rem", color: muted, marginBottom: 12 }}>Now find the moves yourself. Reaching &quot;Good&quot; or better on every line unlocks the Mastery Test.</div>
                    <VariationGrid startMode="practice" opening={opening} prog={prog} theme={gridTheme} onOpenVariation={openVariation} />
                  </>)}
                  {stage.id === "test" && (<>
                    {!testing ? (
                      <div style={{ textAlign: "center", padding: "10px 0" }}>
                        <div style={{ fontSize: "0.82rem", color: muted, marginBottom: 14 }}>Reproduce every line in this opening back to back, no explanations shown. Passing marks {opening.name} as tested.</div>
                        <button onClick={() => setTesting(true)} style={{ background: `${G}18`, border: `1px solid ${G}44`, color: G, fontWeight: 700, fontSize: "0.82rem", borderRadius: 10, padding: "10px 20px", cursor: "pointer" }}>Start Mastery Test</button>
                      </div>
                    ) : (
                      <MasteryTestRunner
                        opening={opening} dark={dark} G={G} AMBER={AMBER} border={border} card={card} fg={fg} muted={muted}
                        onVariationComplete={handleVariationComplete}
                        onFinished={() => { markLearned("test-passed"); setTesting(false); }}
                      />
                    )}
                  </>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export {
  OpeningDetailPage,
};
