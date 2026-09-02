import { useState } from "react";
import { grantRewardWithAchievements, rewardCfg } from "../../services/economy.js";

// ── PRACTICE TAB ──────────────────────────────────────────────────────────
function CoursePracticeTab({ course, content, dark, fg, muted, card, border, color, state, setState, setActive, onReward }) {
  const pr = content.practice || {};
  const checklist = pr.checklist || [];
  const checkedMap = state.checklist || {};
  const checkedCount = checklist.filter((_, i) => checkedMap[i]).length;
  const quiz = pr.quiz || [];
  const [quizAnswers, setQuizAnswers] = useState(state.quiz || {});

  const toggleCheck = (i) => {
    const next = { ...checkedMap, [i]: !checkedMap[i] };
    setState({ checklist: next });
    const nextCount = checklist.filter((_, idx) => next[idx]).length;
    if (checklist.length > 0 && nextCount === checklist.length && checkedCount < checklist.length) {
      // Practice mission just completed for the first time — grant the course-complete reward.
      const cfg = rewardCfg("course_complete", 100, 250);
      const result = cfg.enabled ? grantRewardWithAchievements("course_complete", course.id, { coins: cfg.coins, xp: cfg.xp, reason: `Completed course: ${course.title}` }) : null;
      if (result && onReward) onReward({ title: "🎉 Course Complete!", coins: result.coins, xp: result.xp, leveledUp: result.leveledUp, newLevel: result.newLevel, newAchievements: result.newAchievements });
    }
  };
  const answerQuiz = (qi, oi) => {
    const next = { ...quizAnswers, [qi]: oi };
    setQuizAnswers(next);
    setState({ quiz: next });
    const answeredCount = Object.keys(next).length;
    if (quiz.length > 0 && answeredCount === quiz.length && Object.keys(quizAnswers).length < quiz.length) {
      // Every question has just been answered for the first time — grant the test-complete reward.
      const correct = quiz.filter((q, i) => next[i] === q.answer).length;
      const scorePct = correct / quiz.length;
      const testCfg = rewardCfg("course_test", 50, 100);
      const base = testCfg.enabled ? grantRewardWithAchievements("course_test", course.id, { coins: testCfg.coins, xp: testCfg.xp, reason: `Completed test: ${course.title}` }) : null;
      let bonus = null;
      if (scorePct >= 0.8) {
        const bonusCfg = rewardCfg("course_test_bonus", 25, 50);
        if (bonusCfg.enabled) bonus = grantRewardWithAchievements("course_test_bonus", course.id, { coins: bonusCfg.coins, xp: bonusCfg.xp, reason: `80%+ score bonus: ${course.title}` });
      }
      if ((base || bonus) && onReward) {
        onReward({
          title: scorePct >= 0.8 ? "🎯 Test Complete — 80%+!" : "📝 Test Complete!",
          coins: (base?.coins || 0) + (bonus?.coins || 0),
          xp: (base?.xp || 0) + (bonus?.xp || 0),
          leveledUp: (base?.leveledUp || bonus?.leveledUp), newLevel: bonus?.newLevel || base?.newLevel,
          newAchievements: [...(base?.newAchievements || []), ...(bonus?.newAchievements || [])],
        });
      }
    }
  };

  return (
    <div className="cf-fade-in" style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ flex: 2, minWidth: 300, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Practice tasks */}
        {pr.tasks?.length > 0 && (
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontWeight: 800, fontSize: "0.88rem", color: fg, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📝</span> Practice Tasks
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {pr.tasks.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ color, fontWeight: 700, fontSize: "0.8rem" }}>{i + 1}.</span>
                  <span style={{ fontSize: "0.82rem", color: dark ? "#d5d5d5" : "#333", lineHeight: 1.55 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Puzzle recommendations */}
        {pr.puzzleTags?.length > 0 && (
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontWeight: 800, fontSize: "0.88rem", color: fg, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🧩</span> Recommended Puzzles
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
              {pr.puzzleTags.map(tag => (
                <span key={tag} style={{ fontSize: "0.72rem", fontWeight: 600, color: "#60a5fa", background: "#60a5fa15", border: "1px solid #60a5fa33", borderRadius: 7, padding: "4px 11px" }}>{tag}</span>
              ))}
            </div>
            <button onClick={() => setActive && setActive("Puzzles")} style={{
              padding: "9px 18px", borderRadius: 9, border: "none",
              background: `linear-gradient(135deg,${color},${color}cc)`, color: "#fff",
              fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", boxShadow: `0 4px 14px ${color}33`,
            }}>Practice these puzzles →</button>
          </div>
        )}

        {/* Mini quiz */}
        {quiz.length > 0 && (
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontWeight: 800, fontSize: "0.88rem", color: fg, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span>❓</span> Mini Quiz
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {quiz.map((q, qi) => {
                const chosen = quizAnswers[qi];
                return (
                  <div key={qi}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: fg, marginBottom: 9 }}>{qi + 1}. {q.q}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {q.options.map((opt, oi) => {
                        const isChosen = chosen === oi;
                        const isCorrect = oi === q.answer;
                        const showResult = chosen !== undefined;
                        let bg = dark ? "#141414" : "#f5f5f5", col = fg, brd = border;
                        if (showResult && isChosen && isCorrect) { bg = "#4ade8018"; col = "#4ade80"; brd = "#4ade8055"; }
                        else if (showResult && isChosen && !isCorrect) { bg = "#ef444418"; col = "#ef4444"; brd = "#ef444455"; }
                        else if (showResult && isCorrect) { bg = "#4ade8012"; col = "#4ade80"; brd = "#4ade8033"; }
                        return (
                          <button key={oi} onClick={() => answerQuiz(qi, oi)} style={{
                            textAlign: "left", padding: "9px 13px", borderRadius: 9, border: `1px solid ${brd}`,
                            background: bg, color: col, fontSize: "0.78rem", fontWeight: showResult && (isChosen || isCorrect) ? 700 : 500,
                            cursor: "pointer", transition: "all 0.15s",
                          }}>
                            {showResult && isCorrect ? "✓ " : showResult && isChosen ? "✕ " : ""}{opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Today's Mission sidebar */}
      <div style={{ flex: 1, minWidth: 260 }}>
        <div style={{
          background: `linear-gradient(160deg, ${color}15, transparent)`, border: `1px solid ${color}33`,
          borderRadius: 16, padding: "20px 22px", position: "sticky", top: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: "1.1rem" }}>🎯</span>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: fg }}>Today&apos;s Mission</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 16 }}>Before you leave, complete your checklist.</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {checklist.map((item, i) => {
              const checked = !!checkedMap[i];
              return (
                <div key={i} onClick={() => toggleCheck(i)} style={{
                  display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                  padding: "8px 10px", borderRadius: 9,
                  background: checked ? `${color}12` : "transparent", transition: "background 0.15s",
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${checked ? color : (dark ? "#333" : "#ccc")}`,
                    background: checked ? color : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: "0.62rem", fontWeight: 900, transition: "all 0.15s",
                  }}>{checked ? "✓" : ""}</span>
                  <span style={{
                    fontSize: "0.8rem", color: checked ? muted : fg,
                    textDecoration: checked ? "line-through" : "none", lineHeight: 1.4,
                  }}>{item}</span>
                </div>
              );
            })}
          </div>

          <div style={{ height: 6, background: dark ? "#1a1a1a" : "#e8e8e8", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: checklist.length ? `${(checkedCount / checklist.length) * 100}%` : "0%", background: `linear-gradient(90deg,${color},${color}bb)`, borderRadius: 3, transition: "width 0.4s" }} />
          </div>
          <div style={{ fontSize: "0.72rem", color: muted, textAlign: "right", marginBottom: 16 }}>{checkedCount}/{checklist.length} complete</div>

          {checkedCount === checklist.length && checklist.length > 0 && (
            <div style={{ background: "#4ade8015", border: "1px solid #4ade8044", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>🎉</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#4ade80" }}>Mission complete — nice work today!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export {
  CoursePracticeTab,
};
