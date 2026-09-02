import { useState, useRef, useEffect } from "react";
import { MASCOT_IMG } from "../../assets/mascot.js";
import { ChapterBoard } from "../../components/chess/ChapterBoard.jsx";
import { InteractiveBoard } from "../../components/chess/InteractiveBoard.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { useBoardSize } from "../../hooks/useBoardSize.js";
import { createChess } from "../../lib/chess/engine.js";
import { sanToMove } from "../../lib/chess/pgn.js";
import { playBoardSound } from "../../lib/chess/sound.js";
import { CHESS_ARROW_BEST } from "../../theme/boardTheme.js";

// ── LEARN TAB ─────────────────────────────────────────────────────────────
// Module scope so the icon rail is not rebuilt from scratch on every board move.
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

function CourseLearnTab({ course, content, dark, fg, muted, card, border, color, state, setState }) {
  const chapters = content.chapters || [];
  const idx = Math.min(state.chapterIndex || 0, chapters.length - 1);
  const chapter = chapters[idx] || chapters[0];
  const furthest = Math.max(state.furthest || 0, idx);
  const readPct = chapters.length ? Math.round(((furthest + 1) / chapters.length) * 100) : 100;
  const chapterStats = state.chapterStats || {}; // { [idx]: { attempts, solvedFirstTry, timeMs } }

  const [chapterSearch, setChapterSearch] = useState("");
  const filteredChapters = chapters
    .map((c, i) => ({ ...c, _i: i }))
    .filter(c => !chapterSearch.trim() || c.title.toLowerCase().includes(chapterSearch.trim().toLowerCase()));

  const goTo = (i) => {
    const clamped = Math.max(0, Math.min(chapters.length - 1, i));
    setState({ chapterIndex: clamped, furthest: Math.max(furthest, clamped) });
  };

  // ── Interactive "find the move" state for the current chapter — resets whenever the chapter changes ──
  const isInteractive = !!(chapter?.fen && chapter?.expectedMove);
  const [chess] = useState(() => createChess());
  const [liveFen, setLiveFen] = useState(chapter?.fen);
  const [sqFeedback, setSqFeedback] = useState(null);
  const [hintArrow, setHintArrow] = useState(null);
  const [solved, setSolved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [analysing, setAnalysing] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    chess.loadFen(chapter?.fen || createChess().getFen());
    setLiveFen(chapter?.fen);
    setSqFeedback(null); setHintArrow(null); setSolved(false); setAttempts(0); setAnalysing(false); setRevealed(false);
    startedAtRef.current = Date.now();
    // Keyed on the chapter index alone: this resets the board *because the
    // chapter changed*, not because its FEN string happened to. `chess` is a
    // stable useState lazy-init instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const recordStats = (firstTry) => {
    const timeMs = Date.now() - startedAtRef.current;
    setState({ chapterStats: { ...chapterStats, [idx]: { attempts: attempts + 1, solvedFirstTry: firstTry, timeMs } } });
  };

  const checkMove = (from, to) => {
    if (solved || analysing) return;
    const expected = sanToMove(chess, chapter.expectedMove);
    if (expected && expected.from === from && expected.to === to) {
      chess.move(from, to, expected.promo);
      setLiveFen(chess.getFen());
      setSqFeedback({ from, to, type: "correct" });
      setHintArrow(null);
      setSolved(true);
      if (soundOn) playBoardSound(chess.isInCheck() ? "check" : "move");
      recordStats(attempts === 0);
      setTimeout(() => setSqFeedback(null), 1200);
    } else {
      setAttempts(a => a + 1);
      setSqFeedback({ from, to, type: "incorrect" });
      if (soundOn) playBoardSound("illegal");
      if (expected) setHintArrow({ from: expected.from, to: expected.to, color: CHESS_ARROW_BEST });
      setTimeout(() => { setSqFeedback(null); setHintArrow(null); }, 1800);
    }
  };
  const freeMove = (from, to) => { const mv = chess.move(from, to, "q"); if (mv) { setLiveFen(chess.getFen()); if (soundOn) playBoardSound(mv.captured ? "capture" : "move"); } };
  const getLegal = (sq) => (solved && !analysing) ? [] : chess.legalMoves(sq);
  const playAgain = () => { chess.loadFen(chapter.fen); setLiveFen(chapter.fen); setSolved(false); setAttempts(0); setAnalysing(false); setSqFeedback(null); setHintArrow(null); startedAtRef.current = Date.now(); };

  const [SQ, boardSizeRef] = useBoardSize(48);
  const [soundOn, setSoundOn] = useState(true);
  const [navTab, setNavTab] = useState("board"); // board | chapters | settings — the reference's floating icon rail

  if (!chapter) return <EmptyState icon="📖" title="No lesson content yet" sub="Check back soon." />;

  const sideToMove = (chapter.fen || "").split(" ")[1] === "b" ? "Black" : "White";
  const stat = chapterStats[idx];

  const navTabs = [
    { key: "board", icon: "♟️", label: "Board" },
    { key: "chapters", icon: "📋", label: "Chapters" },
    { key: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="cf-fade-in" style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* LEFT — board column */}
      <div style={{ flex: "1 1 440px", maxWidth: 560, minWidth: 280 }}>
        {/* Navigation rail — Board / Chapters / Settings, echoing the reference's floating icon panel */}
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

        {navTab === "board" && chapter.fen && (
          isInteractive ? (
            <div>
              <div ref={boardSizeRef}>
                <InteractiveBoard fen={liveFen} onMove={analysing ? freeMove : checkMove} getLegal={getLegal} lastMove={null} flipped={flipped} sqSize={SQ} feedback={analysing ? null : sqFeedback} hintArrow={analysing ? null : hintArrow} />
              </div>

              {/* Board control bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <IconBtn accent={color} border={border} muted={muted} fg={fg} onClick={playAgain} title="Reset position">↺</IconBtn>
                  <IconBtn accent={color} border={border} muted={muted} fg={fg} onClick={() => setFlipped(f => !f)} title="Flip board">⇅</IconBtn>
                </div>
                <div style={{ fontSize: "0.72rem", color: muted, fontWeight: 600 }}>
                  {solved ? "✓ Solved" : attempts > 0 ? `${attempts} attempt${attempts === 1 ? "" : "s"}` : `${sideToMove} to move`}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <IconBtn accent={color} border={border} muted={muted} fg={fg} onClick={() => setHintArrow(h => h ? null : { from: sanToMove(chess, chapter.expectedMove)?.from, to: sanToMove(chess, chapter.expectedMove)?.to, color: CHESS_ARROW_BEST })} disabled={solved || analysing} title="Hint">💡</IconBtn>
                  <IconBtn accent={color} border={border} muted={muted} fg={fg} onClick={() => setAnalysing(a => !a)} active={analysing} title="Analysis board">🔬</IconBtn>
                </div>
              </div>

              {!solved && revealed && (
                <div style={{ marginTop: 8, fontSize: "0.76rem", color, fontWeight: 700 }}>Answer: {chapter.expectedMove}</div>
              )}
            </div>
          ) : (
            <ChapterBoard fen={chapter.fen} dark={dark} />
          )
        )}

        {navTab === "chapters" && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: muted, marginBottom: 6 }}>
                <span>Study progress</span>
                <span style={{ color, fontWeight: 700 }}>{readPct}%</span>
              </div>
              <div style={{ height: 6, background: dark ? "#1a1a1a" : "#e8e8e8", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${readPct}%`, background: `linear-gradient(90deg,${color},${color}bb)`, borderRadius: 3, transition: "width 0.4s" }} />
              </div>
              <div style={{ fontSize: "0.68rem", color: muted, marginTop: 4 }}>{Math.min(furthest + 1, chapters.length)} / {chapters.length} chapters completed</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, position: "relative" }}>
              <span style={{ position: "absolute", left: 9, fontSize: "0.72rem", color: muted, pointerEvents: "none" }}>🔍</span>
              <input value={chapterSearch} onChange={e => setChapterSearch(e.target.value)} placeholder="Search chapters…" style={{
                width: "100%", padding: "7px 10px 7px 26px", borderRadius: 8, fontSize: "0.76rem",
                background: dark ? "rgba(255,255,255,0.04)" : "#f4f4f4", border: `1px solid ${border}`, color: fg, outline: "none",
              }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 420, overflowY: "auto" }}>
              {filteredChapters.map((c) => {
                const i = c._i;
                return (
                  <button key={i} onClick={() => { goTo(i); setNavTab("board"); }} style={{
                    display: "flex", alignItems: "center", gap: 9, textAlign: "left", padding: "9px 10px",
                    borderRadius: 9, border: "none", cursor: "pointer",
                    background: i === idx ? `${color}18` : "transparent",
                    color: i === idx ? color : (i <= furthest ? fg : muted),
                    fontWeight: i === idx ? 700 : 600, fontSize: "0.78rem", transition: "background 0.15s",
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.62rem", fontWeight: 700,
                      background: i <= furthest ? color : (dark ? "#1f1f1f" : "#e5e5e5"),
                      color: i <= furthest ? "#fff" : muted,
                    }}>{i < furthest ? "✓" : i === idx ? "▶" : i + 1}</span>
                    <span style={{ lineHeight: 1.3, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                    {c.result && <span style={{ fontSize: "0.68rem", color: muted, flexShrink: 0 }}>{c.result}</span>}
                  </button>
                );
              })}
              {filteredChapters.length === 0 && <div style={{ fontSize: "0.75rem", color: muted, padding: "8px 10px" }}>No chapters match &quot;{chapterSearch}&quot;.</div>}
            </div>
          </div>
        )}

        {navTab === "settings" && (
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
      <div style={{ flex: "1 1 380px", minWidth: 300, background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "22px 24px" }}>
        {/* Top bar — study progress + sound toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: border, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${readPct}%`, background: color, transition: "width 0.3s ease", borderRadius: 2 }} />
          </div>
          <button onClick={() => setSoundOn(s => !s)} title={soundOn ? "Mute" : "Unmute"} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1rem", color: muted, flexShrink: 0 }}>{soundOn ? "🔊" : "🔇"}</button>
        </div>

        {/* Breadcrumb */}
        <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span>Courses</span><span style={{ opacity: 0.5 }}>›</span><span>{course.name}</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: fg, fontWeight: 600 }}>Chapter {idx + 1}: {chapter.title}</span>
        </div>

        {/* Chapter badge + lesson counter + prev/next */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <span style={{ background: `${color}18`, color, fontWeight: 800, fontSize: "0.72rem", padding: "5px 12px", borderRadius: 20 }}>Chapter {idx + 1}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.76rem", color: muted, fontWeight: 600 }}>Lesson {idx + 1} of {chapters.length}</span>
            <button onClick={() => goTo(idx - 1)} disabled={idx === 0} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${border}`, background: "transparent", color: idx === 0 ? muted : fg, cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.4 : 1, fontSize: "0.8rem" }}>‹</button>
            <button onClick={() => goTo(idx + 1)} disabled={idx === chapters.length - 1} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${border}`, background: "transparent", color: idx === chapters.length - 1 ? muted : fg, cursor: idx === chapters.length - 1 ? "default" : "pointer", opacity: idx === chapters.length - 1 ? 0.4 : 1, fontSize: "0.8rem" }}>›</button>
          </div>
        </div>

        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: fg, marginBottom: 14, lineHeight: 1.3 }}>{chapter.title}</h2>

        {(chapter.body || []).map((p, i) => (
          <p key={i} style={{ fontSize: "0.87rem", color: dark ? "#d0d0d0" : "#333", lineHeight: 1.75, marginBottom: 14 }}>{p}</p>
        ))}

        {chapter.note && (
          <div style={{ background: dark ? "#181205" : "#fdf8ea", border: "1px solid #C9A84C55", borderRadius: 12, padding: "13px 16px", marginBottom: 14, display: "flex", gap: 10 }}>
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#C9A84C", marginBottom: 3 }}>Key Idea</div>
              <div style={{ fontSize: "0.8rem", color: fg, lineHeight: 1.6 }}>{chapter.note}</div>
            </div>
          </div>
        )}

        {chapter.example && (
          <div style={{ background: dark ? "#141414" : "#f6f6f6", borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Example</div>
            <div style={{ fontSize: "0.8rem", color: fg, lineHeight: 1.6 }}>{chapter.example}</div>
          </div>
        )}

        {isInteractive && chapter.question && (
          <div style={{ background: dark ? "rgba(255,255,255,0.03)" : "#f6f6f6", border: `1px solid ${border}`, borderRadius: 12, padding: "13px 16px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color }}>🎯 Your Move</div>
              <button onClick={() => setRevealed(r => !r)} disabled={solved || analysing} style={{
                padding: "6px 12px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${color},${color}cc)`,
                color: "#fff", fontWeight: 700, fontSize: "0.7rem", cursor: solved || analysing ? "default" : "pointer",
                opacity: solved || analysing ? 0.5 : 1, flexShrink: 0,
              }}>👁 {revealed ? "Hide Solution" : "Show Solution"}</button>
            </div>
            <div style={{ fontSize: "0.84rem", color: fg, fontWeight: 600 }}>{chapter.question}</div>
          </div>
        )}

        {/* Coach nudge — ChessProphy's own mascot + tip bubble, shown while still working the position */}
        {isInteractive && !solved && !analysing && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
            <img src={MASCOT_IMG} alt="" style={{ width: 40, height: 40, borderRadius: "50%", display: "block", objectFit: "cover", flexShrink: 0 }} />
            <div style={{ background: dark ? "#132a3d" : "#eaf4ff", border: `1px solid ${dark ? "#1e3a52" : "#cfe6fb"}`, borderRadius: "4px 14px 14px 14px", padding: "11px 15px", fontSize: "0.8rem", color: dark ? "#cfe9ff" : "#0f4c75" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Think about:</div>
              <div style={{ lineHeight: 1.7 }}>
                • What are the weaknesses in this position?<br/>
                • Which pieces are best placed?<br/>
                • What plan gives you the most chances?
              </div>
            </div>
          </div>
        )}

        {isInteractive && solved && (
          <div className="cf-fade-in" style={{ marginBottom: 16, background: `${color}12`, border: `1px solid ${color}33`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <img src={MASCOT_IMG} alt="" style={{ width: 32, height: 32, borderRadius: "50%", display: "block", objectFit: "cover" }} />
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color }}>✓ Nicely done{stat?.solvedFirstTry ? " — first try!" : "!"}</div>
            </div>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: "0.76rem", color: muted, marginBottom: 14 }}>
              <span>⏱ {Math.max(1, Math.round((stat?.timeMs || 0) / 1000))}s</span>
              <span>🎯 {stat?.solvedFirstTry ? "100% — solved first try" : `Solved after ${(stat?.attempts || 1)} attempt${(stat?.attempts || 1) === 1 ? "" : "s"}`}</span>
              <span>📊 {readPct}% of study complete</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={playAgain} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${border}`, background: "transparent", color: fg, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>↺ Play Again</button>
              <button onClick={() => setAnalysing(true)} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${border}`, background: "transparent", color: fg, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>🔬 Analysis Board</button>
            </div>
          </div>
        )}

        {/* Bottom nav — Previous / Next Lesson */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, paddingTop: 16, borderTop: `1px solid ${border}` }}>
          <button onClick={() => goTo(idx - 1)} disabled={idx === 0} style={{
            padding: "10px 18px", borderRadius: 10, border: `1px solid ${border}`, background: "transparent",
            color: idx === 0 ? muted : fg, fontWeight: 700, fontSize: "0.8rem", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.4 : 1,
          }}>← Previous</button>
          <button onClick={() => goTo(idx + 1)} disabled={idx === chapters.length - 1} style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: idx === chapters.length - 1 ? (dark ? "#1a1a1a" : "#eee") : `linear-gradient(135deg,${color},${color}cc)`,
            color: idx === chapters.length - 1 ? muted : "#fff", fontWeight: 700, fontSize: "0.8rem",
            cursor: idx === chapters.length - 1 ? "default" : "pointer", boxShadow: idx === chapters.length - 1 ? "none" : `0 4px 14px ${color}33`,
          }}>{idx === chapters.length - 1 ? "✓ Last lesson" : "Next Lesson →"}</button>
        </div>
      </div>
    </div>
  );
}

export {
  CourseLearnTab,
};
