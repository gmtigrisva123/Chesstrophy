import { useState, useMemo } from "react";
import { DrillModeView } from "./DrillModeView.jsx";
import { LearningModeView } from "./LearningModeView.jsx";
import { OpeningAcademyView } from "./OpeningAcademyView.jsx";
import { OpDiffBadge, SrBadge, StyleTag } from "./OpeningBadges.jsx";
import { OpeningDetailPage } from "./OpeningDetailPage.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { OPENING_REPERTOIRE } from "../../data/openingRepertoire.js";
import { loadAdminData } from "../../services/adminData.js";
import { getDueVariations, getOpeningProgress, getOverallStats, loadOpState, saveOpState } from "../../services/openingProgress.js";

// Module scope: nested inside OpeningsPage this was a new component type on
// every keystroke in the search box, remounting every card in the library.
function OpeningCard({ op, opState, theme, onOpen }) {
  const { fg, muted, card, border } = theme;
  const progress = getOpeningProgress(opState, op.id);
  const isFav = opState.favorites.includes(op.id);
  return (
    <div onClick={() => onOpen(op.id)} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 18px", cursor: "pointer", transition: "all 0.18s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = op.color + "55"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.92rem", color: fg, marginBottom: 3 }}>{op.name}</div>
          <div style={{ fontSize: "0.7rem", color: muted }}>{op.eco} · {op.forSide}</div>
        </div>
        <span style={{ fontSize: "1rem", color: isFav ? "#f59e0b" : muted }}>{isFav ? "★" : "☆"}</span>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        <OpDiffBadge level={op.difficulty} />
        {op.tags.slice(0, 2).map(t => <StyleTag key={t} tag={t} />)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: muted, marginBottom: 8 }}>
        <span>{op.variations.length} variation{op.variations.length === 1 ? "" : "s"}</span><span>{op.studyTime}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 5, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg,${op.color},${op.color}bb)`, borderRadius: 3 }} /></div>
        <span style={{ fontSize: "0.7rem", color: op.color, fontWeight: 700 }}>{progress}%</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.7rem", color: muted }}>🔥 {op.popularity}% popularity</span>
        <span style={{ fontSize: "0.74rem", color: op.color, fontWeight: 700 }}>Continue →</span>
      </div>
    </div>
  );
}

function OpeningsPage({ dark }) {
  const G = "#2563EB";
  const AMBER = "#f59e0b";
  const BLUE = "#60a5fa";
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#888"    : "#666";
  const card   = dark ? "#111"    : "#fff";
  const border = dark ? "#1f1f1f" : "#e8e8e8";

  const [opState, setOpState] = useState(loadOpState);
  const [view, setView] = useState("dashboard"); // dashboard | academy | lesson | library | detail
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDiff, setFilterDiff] = useState("All");
  const [filterStyle, setFilterStyle] = useState("All");
  const [sortBy, setSortBy] = useState("popularity");

  const saveOp = (upd) => { const ns = { ...opState, ...upd }; setOpState(ns); saveOpState(ns); };

  const stats = useMemo(() => getOverallStats(opState), [opState]);
  const dueToday = useMemo(() => getDueVariations(opState), [opState]);

  const openOpening = (id) => { setSelectedOpening(id); setView("detail"); };
  const openLesson = (id) => { setSelectedOpening(id); setView("lesson"); };

  // ── Library filtering ────────────────────────────────────────────────────────
  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];
  const styles = ["All", "Attack", "Positional", "Solid"];

  const filteredOpenings = OPENING_REPERTOIRE.filter(op => {
    const q = search.toLowerCase();
    const matchSearch = !q || op.name.toLowerCase().includes(q) || op.eco.toLowerCase().includes(q) || op.tags.some(t => t.toLowerCase().includes(q)) || op.variations.some(v => v.name.toLowerCase().includes(q));
    const matchDiff = filterDiff === "All" || op.difficulty === filterDiff;
    const matchStyle = filterStyle === "All" || op.style === filterStyle || op.tags.includes(filterStyle);
    return matchSearch && matchDiff && matchStyle;
  }).sort((a, b) => {
    if (sortBy === "popularity") return b.popularity - a.popularity;
    if (sortBy === "difficulty") return ["Beginner", "Intermediate", "Advanced"].indexOf(a.difficulty) - ["Beginner", "Intermediate", "Advanced"].indexOf(b.difficulty);
    if (sortBy === "progress") return getOpeningProgress(opState, b.id) - getOpeningProgress(opState, a.id);
    return 0;
  });

  // ── Lesson view — Opening Academy's entry point: chapter-based Learn/Practice ──
  if (view === "lesson" && selectedOpening) {
    const opening = OPENING_REPERTOIRE.find(o => o.id === selectedOpening);
    if (opening) {
      return (
        <div>
          <style>{`@keyframes opFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <button onClick={() => setView("academy")} style={{ background: "transparent", border: "none", color: muted, fontSize: "0.78rem", cursor: "pointer", marginBottom: 14, padding: 0 }}>← Back to Opening Academy</button>
          <LearningModeView opening={opening} dark={dark} onExit={() => setView("academy")} />
        </div>
      );
    }
  }

  // ── Drill Mode view ──────────────────────────────────────────────────────────
  if (view === "drill") {
    return (
      <div>
        <style>{`@keyframes opFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <button onClick={() => setView("dashboard")} style={{ background: "transparent", border: "none", color: muted, fontSize: "0.78rem", cursor: "pointer", marginBottom: 14, padding: 0 }}>← Back to Openings</button>
        <DrillModeView dark={dark} opState={opState} saveOp={saveOp} onExit={() => setView("dashboard")} G={G} AMBER={AMBER} card={card} border={border} fg={fg} muted={muted} />
      </div>
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (view === "detail" && selectedOpening) {
    const opening = OPENING_REPERTOIRE.find(o => o.id === selectedOpening);
    if (opening) {
      return (
        <div>
          <style>{`@keyframes opFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <OpeningDetailPage opening={opening} opState={opState} saveOp={saveOp} onBack={() => setView("library")} dark={dark} G={G} AMBER={AMBER} card={card} border={border} fg={fg} muted={muted} />
        </div>
      );
    }
  }

  // ── Library view ─────────────────────────────────────────────────────────────
  if (view === "library") {
    const isBrowsing = !search && filterDiff === "All" && filterStyle === "All";
    const GROUP_LABEL = { "e4 Openings": "1.e4 Openings", "d4 Openings": "1.d4 Openings", "Flank Openings": "Flank Openings" };
    const GROUP_ORDER = ["e4 Openings", "d4 Openings", "Flank Openings"];
    const bySide = { White: {}, Black: {} };
    const cardTheme = { fg, muted, card, border };
    if (isBrowsing) {
      OPENING_REPERTOIRE.forEach(op => {
        const bucket = bySide[op.forSide] || (bySide[op.forSide] = {});
        (bucket[op.group] || (bucket[op.group] = [])).push(op);
      });
    }

    return (
      <div>
        <style>{`@keyframes opFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <button onClick={() => setView("dashboard")} style={{ background: "transparent", border: "none", color: muted, fontSize: "0.78rem", cursor: "pointer", marginBottom: 8, padding: 0 }}>← Back to Dashboard</button>
            <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 700, color: fg, letterSpacing: "-0.02em" }}>Opening Library</div>
            <div style={{ fontSize: "0.82rem", color: muted, marginTop: 4 }}>{filteredOpenings.length} openings found</div>
          </div>
        </div>

        {/* Search + filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opening, variation, ECO, style…" style={{ flex: 1, minWidth: 220, background: card, border: `1px solid ${border}`, borderRadius: 11, padding: "10px 14px", color: fg, fontSize: "0.85rem", outline: "none", fontFamily: "inherit" }}
            onFocus={e => e.target.style.borderColor = "#C9A84C"} onBlur={e => e.target.style.borderColor = border} />
          <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} style={{ background: card, border: `1px solid ${border}`, borderRadius: 11, padding: "10px 14px", color: fg, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit" }}>
            {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterStyle} onChange={e => setFilterStyle(e.target.value)} style={{ background: card, border: `1px solid ${border}`, borderRadius: 11, padding: "10px 14px", color: fg, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit" }}>
            {styles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: card, border: `1px solid ${border}`, borderRadius: 11, padding: "10px 14px", color: fg, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit" }}>
            <option value="popularity">Sort: Popularity</option>
            <option value="difficulty">Sort: Difficulty</option>
            <option value="progress">Sort: My Progress</option>
          </select>
        </div>

        {isBrowsing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {[["White", "White Repertoire"], ["Black", "Black Repertoire"]].map(([sideKey, sideLabel]) => {
              const groups = bySide[sideKey] || {};
              const presentGroups = GROUP_ORDER.filter(g => groups[g]?.length);
              if (!presentGroups.length) return null;
              return (
                <div key={sideKey}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>{sideLabel}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {presentGroups.map(g => (
                      <div key={g}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: fg, marginBottom: 10 }}>{GROUP_LABEL[g] || g}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
                          {groups[g].map(op => <OpeningCard opState={opState} theme={cardTheme} onOpen={openOpening} key={op.id} op={op} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
            {filteredOpenings.map(op => <OpeningCard opState={opState} theme={cardTheme} onOpen={openOpening} key={op.id} op={op} />)}
            {filteredOpenings.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 20px", color: muted }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ fontWeight: 700, color: fg, marginBottom: 6 }}>No openings found</div>
                <div style={{ fontSize: "0.82rem" }}>Try a different search term or filter.</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── OPENING ACADEMY VIEW ─────────────────────────────────────────────────────
  if (view === "academy") {
    return (
      <div>
        <style>{`@keyframes opFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <button onClick={() => setView("dashboard")} style={{ background: "transparent", border: "none", color: muted, fontSize: "0.78rem", cursor: "pointer", marginBottom: 14, padding: 0 }}>← Back to Openings</button>
        <OpeningAcademyView dark={dark} opState={opState} openOpening={openLesson} onBrowseLibrary={() => setView("library")} />
      </div>
    );
  }

  // ── DASHBOARD VIEW (default) ────────────────────────────────────────────────
  const continueOpening = opState.recentlyPracticed[0] ? OPENING_REPERTOIRE.find(o => o.id === opState.recentlyPracticed[0]) : null;
  const recommendedOpenings = OPENING_REPERTOIRE.filter(o => !opState.repertoire.includes(o.id)).slice(0, 3);
  const repertoireOpenings = OPENING_REPERTOIRE.filter(o => opState.repertoire.includes(o.id));

  return (
    <div>
      <style>{`
        @keyframes opFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .op-card:hover{border-color:#C9A84C55!important;transform:translateY(-2px)}
      `}</style>

      <div style={{ marginBottom: 24, animation: "opFade 0.4s ease" }}>
        <div style={{ fontSize: "0.7rem", color: "#C9A84C", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Opening Mastery</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, color: fg, letterSpacing: "-0.03em" }}>Master Your Openings</h2>
            <p style={{ fontSize: "0.85rem", color: muted, marginTop: 4 }}>Your personal opening coach — learn the ideas, not just the moves.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setView("academy")} style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${border}`, borderRadius: 11, padding: "11px 20px", color: fg, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>🗺️ Opening Academy</button>
            <button onClick={() => setView("library")} style={{ background: "linear-gradient(135deg,#C9A84C,#F5D17A)", border: "none", borderRadius: 11, padding: "11px 22px", color: "#0a0a0a", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>Browse Library →</button>
          </div>
        </div>
      </div>

      {/* Opening Trainer — Learn + Practice, now live (was two separate "Phase 1/2 Preview" boxes; consolidated into one entry point once Practice Mode was wired to the real interactive engine). */}
      <div style={{ background: dark ? "rgba(201,168,76,0.06)" : "rgba(201,168,76,0.05)", border: "1px solid #C9A84C33", borderRadius: 16, padding: 20, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#C9A84C", background: "#C9A84C18", border: "1px solid #C9A84C44", borderRadius: 6, padding: "3px 8px" }}>Opening Trainer</span>
          <span style={{ fontSize: "0.78rem", color: muted }}>Chapter-by-chapter lessons with strategy/tactics/mistakes panels, plus a fully interactive Practice Mode that checks your moves for real.</span>
        </div>
        <LearningModeView opening={OPENING_REPERTOIRE[0]} dark={dark} onExit={() => {}} />
      </div>


      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { l: "Mastery %", v: `${stats.masteryPct}%`, icon: "🎯", c: "#C9A84C" },
          { l: "Variations Learned", v: stats.masteredVariations, icon: "📖", c: G },
          { l: "Accuracy", v: `${stats.accuracy}%`, icon: "✓", c: BLUE },
          { l: "Practice Due", v: dueToday.length, icon: "⏰", c: dueToday.length > 0 ? AMBER : muted },
          { l: "Streak", v: opState.streak > 0 ? `🔥${opState.streak}` : "—", icon: "📅", c: AMBER },
          { l: "Repertoire", v: opState.repertoire.length, icon: "📋", c: "#a78bfa" },
        ].map(s => (
          <div key={s.l} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><span>{s.icon}</span><span style={{ fontSize: "0.64rem", color: muted, fontWeight: 600, textTransform: "uppercase" }}>{s.l}</span></div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: "1.3rem", fontWeight: 700, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18, marginBottom: 18 }}>
        {/* Continue Learning */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 4 }}>📖 Continue Learning</div>
          <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 16 }}>Pick up where you left off</div>
          {continueOpening ? (
            <div onClick={() => openOpening(continueOpening.id)} style={{ cursor: "pointer", background: dark ? "#141414" : "#f8f8f8", borderRadius: 11, padding: "14px 16px", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = continueOpening.color}
            >
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 4 }}>{continueOpening.name}</div>
              <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 10 }}>{getOpeningProgress(opState, continueOpening.id)}% mastered</div>
              <div style={{ height: 5, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${getOpeningProgress(opState, continueOpening.id)}%`, background: continueOpening.color, borderRadius: 3 }} /></div>
            </div>
          ) : (
            <EmptyState icon="📖" title="No openings started yet" sub="Browse the library to begin your first opening." />
          )}
        </div>

        {/* Practice Due Today */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 4 }}>⏰ Practice Due Today</div>
          <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 16 }}>Spaced repetition review queue</div>
          {dueToday.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dueToday.slice(0, 3).map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: dark ? "#141414" : "#f8f8f8", borderRadius: 9, padding: "9px 12px" }}>
                  <span style={{ fontSize: "0.8rem", color: fg }}>{d.variationName}</span>
                  <SrBadge status={d.status} />
                </div>
              ))}
              {dueToday.length > 3 && <div style={{ fontSize: "0.72rem", color: muted, textAlign: "center" }}>+{dueToday.length - 3} more due</div>}
              <button onClick={() => setView("drill")} style={{ marginTop: 6, background: `${AMBER}18`, border: `1px solid ${AMBER}44`, color: AMBER, fontWeight: 700, fontSize: "0.8rem", borderRadius: 9, padding: "9px 0", cursor: "pointer" }}>🔥 Start Drill Session</button>
            </div>
          ) : (
            <EmptyState icon="✅" title="All caught up!" sub="No reviews due today. Great work!" />
          )}
        </div>

        {/* AI Recommendations */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 4 }}>🧠 AI Recommendations</div>
          <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 16 }}>Based on your level and progress</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recommendedOpenings.map(op => (
              <div key={op.id} onClick={() => openOpening(op.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: dark ? "#141414" : "#f8f8f8", borderRadius: 9, padding: "9px 12px" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: fg, fontWeight: 600 }}>{op.name}</div>
                  <div style={{ fontSize: "0.68rem", color: muted }}>{op.difficulty} · {op.style}</div>
                </div>
                <span style={{ color: op.color, fontSize: "0.78rem" }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Repertoire */}
      {repertoireOpenings.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ height: 1, flex: 1, background: border }} />
            <span style={{ fontSize: "0.7rem", color: muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>📋 My Repertoire</span>
            <div style={{ height: 1, flex: 1, background: border }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
            {repertoireOpenings.map(op => {
              const progress = getOpeningProgress(opState, op.id);
              return (
                <div key={op.id} className="op-card" onClick={() => openOpening(op.id)} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.18s" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.84rem", color: fg, marginBottom: 6 }}>{op.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${progress}%`, background: op.color, borderRadius: 3 }} /></div>
                    <span style={{ fontSize: "0.7rem", color: op.color, fontWeight: 700 }}>{progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recently Practiced */}
      {opState.recentlyPracticed.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ height: 1, flex: 1, background: border }} />
            <span style={{ fontSize: "0.7rem", color: muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Recently Practiced</span>
            <div style={{ height: 1, flex: 1, background: border }} />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {opState.recentlyPracticed.map(id => {
              const op = OPENING_REPERTOIRE.find(o => o.id === id);
              if (!op) return null;
              return (
                <button key={id} onClick={() => openOpening(id)} style={{ background: card, border: `1px solid ${border}`, borderRadius: 9, padding: "8px 14px", color: fg, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>{op.name}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* Community Openings — published by the admin Content Manager */}
      {(() => {
        const adminOpenings = (loadAdminData().openings || []).filter(o => o.published && !o.archived);
        if (adminOpenings.length === 0) return null;
        return (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ height: 1, flex: 1, background: border }} />
              <span style={{ fontSize: "0.7rem", color: muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Community Openings</span>
              <div style={{ height: 1, flex: 1, background: border }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {adminOpenings.map(o => (
                <div key={o.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    {o.eco && <span style={{ fontSize: "0.62rem", background: "#C9A84C22", color: "#C9A84C", borderRadius: 4, padding: "2px 7px", fontWeight: 700 }}>{o.eco}</span>}
                    <span style={{ fontSize: "0.62rem", background: `${G}22`, color: G, borderRadius: 4, padding: "2px 7px", fontWeight: 700 }}>{o.difficulty}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 6 }}>{o.name}</div>
                  <div style={{ fontSize: "0.76rem", color: muted, lineHeight: 1.5, marginBottom: 10 }}>{o.desc}</div>
                  {o.moves && <div style={{ fontSize: "0.7rem", color: BLUE, fontFamily: "monospace", marginBottom: 8 }}>{o.moves}</div>}
                  {o.variations?.length > 0 && (
                    <div style={{ fontSize: "0.68rem", color: muted, marginBottom: 8 }}>
                      {o.variations.length} variation{o.variations.length===1?"":"s"}: {o.variations.map(v=>v.name).filter(Boolean).join(", ")}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(o.tags||[]).map(t => <span key={t} style={{ fontSize: "0.6rem", background: dark?"#1e1e1e":"#f0f0f0", color: muted, borderRadius: 4, padding: "2px 6px" }}>{t}</span>)}
                  </div>
                  {(o.url || o.videoUrl) && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      {o.url && <a href={o.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: BLUE, textDecoration: "none", fontWeight: 700 }}>Study →</a>}
                      {o.videoUrl && <a href={o.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "#fb7185", textDecoration: "none", fontWeight: 700 }}>▶ Video</a>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export {
  OpeningsPage,
};
