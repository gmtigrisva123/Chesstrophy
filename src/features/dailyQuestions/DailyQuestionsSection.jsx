import { useState, useEffect } from "react";
import { DQBoard } from "../../components/chess/DQBoard.jsx";
import { RewardToast } from "../../components/ui/RewardToast.jsx";
import { DQ_TYPE_ICONS, QUIZ_CATEGORIES, RATING_GROUP_COLORS, STUDY_LIBRARY } from "../../data/dailyQuestions.js";
import { classifyRating, dqTodayStr, dqYesterdayStr, generateDailyQuestions, generateQuizQuestions, loadDQState, saveDQState } from "../../services/dailyQuestionsState.js";
import { grantRewardWithAchievements, rewardCfg } from "../../services/economy.js";

// ── DAILY QUESTIONS MAIN COMPONENT ────────────────────────────────────────────
// These three live at module scope deliberately. Declared inside
// DailyQuestionsSection they would be a new component type on every render,
// so React would unmount and remount their subtrees on each keystroke — which
// is exactly what made the rating input below lose focus after one character.
function SCard({ children, style = {}, card, border }) {
  return <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, ...style }}>{children}</div>;
}

function ProgressBar2({ value, max = 100, color, height = 6 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return <div style={{ height, background: "#1a1a1a", borderRadius: height, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}bb)`, borderRadius: height, transition: "width 0.5s" }} /></div>;
}

function SubTab({ id, label, icon, section, setSection, accent, border, muted }) {
  const isActive = section === id;
  return (
    <button onClick={() => setSection(id)} aria-pressed={isActive} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
      background: isActive ? `${accent}18` : "transparent",
      border: `1px solid ${isActive ? accent + "55" : border}`,
      borderRadius: 9, color: isActive ? accent : muted,
      fontWeight: isActive ? 700 : 500, fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s",
    }}>{icon} {label}</button>
  );
}

function DailyQuestionsSection({ dark, fg, muted, card, border, G, PURPLE, AMBER, BLUE }) {
  const [dq, setDq] = useState(loadDQState);
  const [section, setSection] = useState("daily"); // daily | tester | stats
  const [setupStep, setSetupStep] = useState(0);    // 0=source, 1=rating
  const [setupSource, setSetupSource] = useState(null);
  const [setupRating, setSetupRating] = useState("");
  const [qIdx, setQIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [qStartTime, setQStartTime] = useState(Date.now());
  const [sessionDone, setSessionDone] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reward, setReward] = useState(null);

  // Quiz tester state
  const [quizCategory, setQuizCategory] = useState(null);
  const [quizCount, setQuizCount] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(null);

  const save = (upd) => { const ns = { ...dq, ...upd }; setDq(ns); saveDQState(ns); };

  // Init today's session if needed
  useEffect(() => {
    if (!dq.setupDone) return;
    const today = dqTodayStr();
    if (dq.todaySession && dq.todaySession.date === today) {
      // Resume session
      if (dq.todaySession.done) { setSessionDone(true); setShowReport(false); }
      else { setQIdx(dq.todaySession.idx || 0); }
    } else {
      // New day — generate fresh questions
      const questions = generateDailyQuestions(dq.ratingGroup);
      save({ todaySession: { date: today, questions, answers: [], idx: 0, done: false } });
      setQIdx(0); setSessionDone(false); setShowReport(false);
    }
    setQStartTime(Date.now());
    // Runs when setup completes, reading the rest of `dq` as it is at that
    // moment. Listing `dq.todaySession` would re-enter this on every answer and
    // regenerate the session the user is midway through.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq.setupDone]);

  // ── Setup flow ─────────────────────────────────────────────────────────────
  const completeSetup = () => {
    const rating = parseInt(setupRating, 10);
    if (isNaN(rating) || rating < 100 || rating > 3000) return;
    const group = classifyRating(rating);
    const questions = generateDailyQuestions(group);
    save({
      ratingSource: setupSource, userRating: rating, ratingGroup: group, setupDone: true,
      todaySession: { date: dqTodayStr(), questions, answers: [], idx: 0, done: false },
    });
    setQIdx(0);
  };

  // ── Daily question answer handling ───────────────────────────────────────────
  const submitAnswer = () => {
    if (selectedAns === null || answered) return;
    const session = dq.todaySession;
    const question = session.questions[qIdx];
    const correct = selectedAns === question.answer;
    const timeTaken = Math.round((Date.now() - qStartTime) / 1000);

    const newAnswers = [...session.answers, { qId: question.id, topic: question.topic, correct, selected: selectedAns, time: timeTaken }];
    const newTopicStats = { ...dq.topicStats };
    const t = question.topic;
    if (!newTopicStats[t]) newTopicStats[t] = { correct: 0, total: 0, avgTime: 0 };
    newTopicStats[t] = {
      correct: newTopicStats[t].correct + (correct ? 1 : 0),
      total: newTopicStats[t].total + 1,
      avgTime: Math.round(((newTopicStats[t].avgTime * newTopicStats[t].total) + timeTaken) / (newTopicStats[t].total + 1)),
    };

    save({
      todaySession: { ...session, answers: newAnswers },
      topicStats: newTopicStats,
      totalSolved: dq.totalSolved + 1,
      totalCorrect: dq.totalCorrect + (correct ? 1 : 0),
    });
    // Per-answer timing is already persisted on the answer record and folded
    // into topicStats.avgTime above — no separate component state needed.
    setAnswered(true);
  };

  const nextQuestion = () => {
    const session = dq.todaySession;
    const nextIdx = qIdx + 1;
    if (nextIdx >= session.questions.length) {
      // Session complete
      const today = dqTodayStr();
      const yesterday = dqYesterdayStr();
      let newStreak = dq.streak;
      if (dq.lastSessionDate === yesterday || dq.lastSessionDate === today) {
        if (dq.lastSessionDate !== today) newStreak = dq.streak + 1;
      } else { newStreak = 1; }
      const longest = Math.max(dq.longestStreak, newStreak);

      const score = session.answers.filter(a => a.correct).length;
      const xpEarned = score * 15 + (score === 5 ? 25 : 0);
      const newBadges = [...dq.badges];
      if (newStreak === 7 && !newBadges.includes("7-Day Learner")) newBadges.push("7-Day Learner");
      if (newStreak === 30 && !newBadges.includes("30-Day Grinder")) newBadges.push("30-Day Grinder");
      if (score === 5 && !newBadges.includes("Perfect Session")) newBadges.push("Perfect Session");

      save({
        todaySession: { ...session, idx: nextIdx, done: true },
        lastSessionDate: today, streak: newStreak, longestStreak: longest,
        xp: dq.xp + xpEarned, badges: newBadges,
        weeklyHistory: [...dq.weeklyHistory.slice(-13), { date: today, score, accuracy: Math.round((score / 5) * 100) }],
      });
      // ProphyCoins — keyed by today's date so the daily session can only pay out once per day.
      const dqCfg = rewardCfg("daily_questions", 20, 30);
      const r = dqCfg.enabled ? grantRewardWithAchievements("daily_questions", today, { coins: dqCfg.coins + score * 4, xp: dqCfg.xp, reason: `Daily Questions completed (${score}/5)` }) : null;
      if (r) setReward({ title: "📚 Daily Questions Complete!", coins: r.coins, xp: r.xp, leveledUp: r.leveledUp, newLevel: r.newLevel, newAchievements: r.newAchievements });
      setSessionDone(true); setShowReport(true);
    } else {
      save({ todaySession: { ...session, idx: nextIdx } });
      setQIdx(nextIdx); setSelectedAns(null); setAnswered(false); setQStartTime(Date.now());
    }
  };

  // ── Quiz tester handlers ──────────────────────────────────────────────────
  const startQuiz = () => {
    if (!quizCategory || !quizCount) return;
    const qs = generateQuizQuestions(quizCategory, quizCount);
    setQuizQuestions(qs); setQuizIdx(0); setQuizSelected(null); setQuizAnswered(false);
    setQuizCorrect(0); setQuizDone(false); setQuizStartTime(Date.now());
  };
  const submitQuizAnswer = () => {
    if (quizSelected === null || quizAnswered) return;
    const correct = quizSelected === quizQuestions[quizIdx].answer;
    if (correct) setQuizCorrect(c => c + 1);
    setQuizAnswered(true);
  };
  const nextQuizQuestion = () => {
    const next = quizIdx + 1;
    if (next >= quizQuestions.length) {
      const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);
      save({ quizHistory: [...dq.quizHistory.slice(-19), { category: quizCategory, score: quizCorrect, total: quizQuestions.length, time: timeTaken, date: dqTodayStr() }] });
      setQuizDone(true);
    } else {
      setQuizIdx(next); setQuizSelected(null); setQuizAnswered(false);
    }
  };
  const resetQuiz = () => { setQuizCategory(null); setQuizCount(null); setQuizQuestions([]); setQuizDone(false); };

  // ══════════════════ SETUP FLOW ══════════════════
  if (!dq.setupDone) {
    const SOURCES = ["Chess.com", "Lichess", "FIDE", "Other"];
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", animation: "cmFade 0.4s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg,${PURPLE},#a78bfa)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24, boxShadow: `0 0 20px ${PURPLE}44` }}>📊</div>
          <h3 style={{ fontFamily: "Georgia,serif", fontSize: "1.3rem", fontWeight: 700, color: fg, marginBottom: 6 }}>Let&apos;s personalize your questions</h3>
          <p style={{ fontSize: "0.82rem", color: muted }}>{setupStep === 0 ? "Where do you usually track your rating?" : "What is your current chess rating?"}</p>
        </div>
        <SCard card={card} border={border} style={{ padding: "26px 26px" }}>
          {setupStep === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SOURCES.map(s => (
                <button key={s} onClick={() => { setSetupSource(s); setSetupStep(1); }} style={{
                  padding: "12px 16px", textAlign: "left", background: "transparent", border: `1px solid ${border}`,
                  borderRadius: 10, color: fg, fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = PURPLE + "66"; e.currentTarget.style.color = PURPLE; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = fg; }}>
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "0.7rem", color: PURPLE, fontWeight: 700, marginBottom: 10 }}>Source: {setupSource}</div>
              <input type="number" min="100" max="3000" value={setupRating} onChange={e => setSetupRating(e.target.value)}
                onKeyDown={e => e.key === "Enter" && completeSetup()}
                /* eslint-disable-next-line jsx-a11y/no-autofocus --
                   Sole interactive element of this setup step; focusing it is
                   the expected behaviour rather than a focus steal. */
                placeholder="e.g. 1200" autoFocus
                style={{ width: "100%", background: dark ? "#141414" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 10, padding: "12px 14px", color: fg, fontSize: "1rem", outline: "none", fontFamily: "inherit", marginBottom: 16 }} />
              {setupRating && !isNaN(parseInt(setupRating, 10)) && (
                <div style={{ marginBottom: 16, fontSize: "0.8rem", color: muted }}>
                  Classification: <strong style={{ color: RATING_GROUP_COLORS[classifyRating(parseInt(setupRating, 10))] }}>{classifyRating(parseInt(setupRating, 10))}</strong>
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setSetupStep(0)} style={{ flex: 1, padding: "11px", background: "transparent", border: `1px solid ${border}`, borderRadius: 10, color: muted, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>← Back</button>
                <button onClick={completeSetup} disabled={!setupRating || isNaN(parseInt(setupRating, 10))} style={{ flex: 2, padding: "11px", background: setupRating ? `linear-gradient(135deg,${PURPLE},#a78bfa)` : "#1a1a1a", border: "none", borderRadius: 10, color: setupRating ? "#fff" : "#333", fontWeight: 700, fontSize: "0.85rem", cursor: setupRating ? "pointer" : "not-allowed" }}>Start Learning →</button>
              </div>
            </div>
          )}
        </SCard>
      </div>
    );
  }

  // ══════════════════ SUB-TABS: Daily | Tester | Stats ══════════════════
  return (
    <div>
      <style>{`@keyframes cmFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "1.2rem", fontWeight: 700, color: fg }}>📊 Daily Questions</div>
          <div style={{ fontSize: "0.78rem", color: muted }}>Train your chess understanding with AI-personalized daily questions.</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.72rem", color: RATING_GROUP_COLORS[dq.ratingGroup], background: RATING_GROUP_COLORS[dq.ratingGroup] + "18", border: `1px solid ${RATING_GROUP_COLORS[dq.ratingGroup]}33`, borderRadius: 999, padding: "4px 12px", fontWeight: 700 }}>{dq.ratingGroup} · {dq.userRating}</span>
          <span style={{ fontSize: "0.72rem", color: AMBER, fontWeight: 700 }}>{dq.streak > 0 ? `🔥 ${dq.streak} day streak` : "No streak yet"}</span>
          <button onClick={() => save({ setupDone: false })} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 8, padding: "5px 10px", color: muted, fontSize: "0.7rem", cursor: "pointer" }}>Edit Rating</button>
        </div>
      </div>

      {/* Sub tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        <SubTab section={section} setSection={setSection} accent={PURPLE} border={border} muted={muted} id="daily" label="Daily Questions" icon="📅" />
        <SubTab section={section} setSection={setSection} accent={PURPLE} border={border} muted={muted} id="tester" label="Knowledge Tester" icon="🧪" />
        <SubTab section={section} setSection={setSection} accent={PURPLE} border={border} muted={muted} id="stats" label="Statistics" icon="📈" />
      </div>

      {/* ══════════ DAILY TAB ══════════ */}
      {section === "daily" && !showReport && !sessionDone && dq.todaySession && (
        <div key={qIdx} style={{ animation: "cmFade 0.25s ease" }}>
          {(() => {
            const session = dq.todaySession;
            const question = session.questions[qIdx];
            if (!question) return null;
            return (
              <div style={{ maxWidth: 640, margin: "0 auto" }}>
                {/* Progress */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: muted, marginBottom: 6 }}>
                    <span>Question {qIdx + 1}/5</span>
                    <span style={{ color: PURPLE, fontWeight: 700 }}>{DQ_TYPE_ICONS[question.type]} {question.type}</span>
                  </div>
                  <ProgressBar2 value={qIdx} max={5} color={PURPLE} />
                </div>

                <SCard card={card} border={border} style={{ padding: "24px 26px" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: PURPLE, background: `${PURPLE}15`, border: `1px solid ${PURPLE}30`, borderRadius: 6, padding: "2px 9px" }}>{question.topic}</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: muted, background: dark ? "#1a1a1a" : "#f0f0f0", borderRadius: 6, padding: "2px 9px" }}>{question.difficulty}</span>
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, color: fg, lineHeight: 1.6, marginBottom: question.fen ? 16 : 22 }}>{question.q}</div>

                  {question.fen && (
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                      <DQBoard fen={question.fen} size={36} />
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {question.options.map((opt, i) => {
                      const isCorrect = i === question.answer;
                      const isChosen = i === selectedAns;
                      let bg = "transparent", bc = border, col = fg;
                      if (answered) {
                        if (isCorrect) { bg = `${G}18`; bc = G; col = G; }
                        else if (isChosen) { bg = "#ef444418"; bc = "#ef4444"; col = "#ef4444"; }
                      } else if (isChosen) { bg = `${PURPLE}12`; bc = PURPLE; col = PURPLE; }
                      return (
                        <button key={i} onClick={() => !answered && setSelectedAns(i)} disabled={answered} style={{
                          padding: "12px 16px", textAlign: "left", background: bg, border: `1px solid ${bc}`,
                          borderRadius: 10, color: col, fontWeight: isChosen || (answered && isCorrect) ? 600 : 400,
                          fontSize: "0.85rem", cursor: answered ? "default" : "pointer", transition: "all 0.15s", lineHeight: 1.4,
                        }}>
                          <span style={{ fontWeight: 700, marginRight: 8, color: isChosen && !answered ? PURPLE : col }}>{String.fromCharCode(65 + i)}.</span>{opt}
                        </button>
                      );
                    })}
                  </div>

                  {!answered ? (
                    <button onClick={submitAnswer} disabled={selectedAns === null} style={{
                      width: "100%", marginTop: 20, padding: "12px 0",
                      background: selectedAns !== null ? `linear-gradient(135deg,${PURPLE},#a78bfa)` : "#1a1a1a",
                      border: "none", borderRadius: 10, color: selectedAns !== null ? "#fff" : "#333",
                      fontWeight: 700, fontSize: "0.88rem", cursor: selectedAns !== null ? "pointer" : "not-allowed",
                    }}>Submit Answer</button>
                  ) : (
                    <div style={{ marginTop: 20, animation: "cmFade 0.25s ease" }}>
                      <div style={{
                        background: selectedAns === question.answer ? `${G}12` : "#ef444412",
                        border: `1px solid ${selectedAns === question.answer ? G + "33" : "#ef444433"}`,
                        borderRadius: 12, padding: "16px 18px", marginBottom: 14,
                      }}>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: selectedAns === question.answer ? G : "#ef4444", marginBottom: 8 }}>
                          {selectedAns === question.answer ? "✓ Correct!" : "✗ Not quite"}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: fg, lineHeight: 1.6, marginBottom: 10 }}>{question.explain}</div>
                        <div style={{ fontSize: "0.78rem", color: muted, lineHeight: 1.6, paddingTop: 10, borderTop: `1px solid ${border}` }}>
                          💡 <strong style={{ color: fg }}>Key learning:</strong> {question.learning}
                        </div>
                        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: "0.7rem", color: muted, flexWrap: "wrap" }}>
                          <span>Difficulty: <strong style={{ color: fg }}>{question.difficulty}</strong></span>
                          <span>Topic: <strong style={{ color: fg }}>{question.topic}</strong></span>
                          <span>Strength needed: <strong style={{ color: fg }}>{question.strengthNeeded}</strong></span>
                        </div>
                      </div>
                      <button onClick={nextQuestion} style={{ width: "100%", padding: "12px 0", background: `linear-gradient(135deg,${PURPLE},#a78bfa)`, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
                        {qIdx === 4 ? "View Report →" : "Next Question →"}
                      </button>
                    </div>
                  )}
                </SCard>
              </div>
            );
          })()}
        </div>
      )}

      {/* ══════════ DAILY REPORT ══════════ */}
      {section === "daily" && showReport && dq.todaySession && (
        <div style={{ maxWidth: 640, margin: "0 auto", animation: "cmFade 0.3s ease" }}>
          {(() => {
            const session = dq.todaySession;
            const score = session.answers.filter(a => a.correct).length;
            const accuracy = Math.round((score / 5) * 100);
            const topicGroups = {};
            session.answers.forEach(a => { if (!topicGroups[a.topic]) topicGroups[a.topic] = { correct: 0, total: 0 }; topicGroups[a.topic].correct += a.correct ? 1 : 0; topicGroups[a.topic].total += 1; });
            const strong = Object.entries(topicGroups).filter(([, v]) => v.correct === v.total).map(([k]) => k);
            const weak = Object.entries(topicGroups).filter(([, v]) => v.correct < v.total).map(([k]) => k);
            const xpEarned = score * 15 + (score === 5 ? 25 : 0);
            const recs = weak.map(t => STUDY_LIBRARY[t]).filter(Boolean).slice(0, 4);

            return (
              <>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 44, marginBottom: 10 }}>{accuracy >= 80 ? "🎉" : accuracy >= 50 ? "👍" : "💪"}</div>
                  <h3 style={{ fontFamily: "Georgia,serif", fontSize: "1.4rem", fontWeight: 700, color: fg, marginBottom: 4 }}>Daily Performance Report</h3>
                  <p style={{ fontSize: "0.82rem", color: muted }}>Here&apos;s how you did today</p>
                </div>

                <SCard card={card} border={border} style={{ padding: "24px 26px", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 20 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "Georgia,serif", fontSize: "2rem", fontWeight: 800, color: G }}>{score}/5</div>
                      <div style={{ fontSize: "0.68rem", color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Score</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "Georgia,serif", fontSize: "2rem", fontWeight: 800, color: accuracy >= 60 ? G : AMBER }}>{accuracy}%</div>
                      <div style={{ fontSize: "0.68rem", color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Accuracy</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "Georgia,serif", fontSize: "2rem", fontWeight: 800, color: PURPLE }}>+{xpEarned}</div>
                      <div style={{ fontSize: "0.68rem", color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>XP Earned</div>
                    </div>
                  </div>

                  {strong.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: G, marginBottom: 6 }}>💪 Strong Areas</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{strong.map(t => <span key={t} style={{ fontSize: "0.72rem", background: `${G}15`, color: G, border: `1px solid ${G}30`, borderRadius: 6, padding: "3px 9px" }}>{t}</span>)}</div>
                    </div>
                  )}
                  {weak.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: AMBER, marginBottom: 6 }}>🎯 Needs Improvement</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{weak.map(t => <span key={t} style={{ fontSize: "0.72rem", background: `${AMBER}15`, color: AMBER, border: `1px solid ${AMBER}30`, borderRadius: 6, padding: "3px 9px" }}>{t}</span>)}</div>
                    </div>
                  )}

                  {weak.length > 0 && (
                    <div style={{ background: dark ? "#141414" : "#f5f0ff", border: `1px solid ${PURPLE}22`, borderRadius: 10, padding: "14px 16px", marginTop: 10 }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: PURPLE, marginBottom: 6 }}>🧠 AI Recommendation</div>
                      <div style={{ fontSize: "0.82rem", color: fg, lineHeight: 1.6 }}>
                        You consistently need work on <strong>{weak[0]}</strong>. We recommend studying the <strong>{STUDY_LIBRARY[weak[0]]?.title || "related lesson"}</strong> before tomorrow&apos;s questions.
                      </div>
                    </div>
                  )}
                </SCard>

                {recs.length > 0 && (
                  <SCard card={card} border={border} style={{ padding: "20px 22px", marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 14 }}>📚 Recommended Studies</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {recs.map((r, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: dark ? "#141414" : "#f8f8f8", borderRadius: 10 }}>
                          <span style={{ color: G, fontSize: 16 }}>✓</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.84rem", color: fg }}>{r.title}</div>
                            <div style={{ fontSize: "0.7rem", color: muted }}>{r.difficulty} · {r.time} · Recommended due to {weak[i] || weak[0]} mistakes</div>
                          </div>
                          <button style={{ background: `${PURPLE}18`, border: `1px solid ${PURPLE}33`, borderRadius: 8, padding: "6px 12px", color: PURPLE, fontWeight: 700, fontSize: "0.72rem", cursor: "pointer", flexShrink: 0 }}>Start Study</button>
                        </div>
                      ))}
                    </div>
                  </SCard>
                )}

                <div style={{ textAlign: "center" }}>
                  <button onClick={() => setShowReport(false)} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 10, padding: "10px 22px", color: muted, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>View Summary</button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ══════════ ALREADY DONE TODAY ══════════ */}
      {section === "daily" && sessionDone && !showReport && (
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h3 style={{ fontFamily: "Georgia,serif", fontSize: "1.3rem", fontWeight: 700, color: fg, marginBottom: 8 }}>Today&apos;s questions complete!</h3>
          <p style={{ fontSize: "0.85rem", color: muted, marginBottom: 20 }}>Come back tomorrow for 5 new personalized questions. Your streak is {dq.streak} day{dq.streak !== 1 ? "s" : ""}.</p>
          <button onClick={() => setShowReport(true)} style={{ background: `linear-gradient(135deg,${PURPLE},#a78bfa)`, border: "none", borderRadius: 10, padding: "11px 24px", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>View Today&apos;s Report</button>
        </div>
      )}

      {/* ══════════ KNOWLEDGE TESTER TAB ══════════ */}
      {section === "tester" && (
        <div style={{ animation: "cmFade 0.25s ease" }}>
          {!quizQuestions.length && (
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <SCard card={card} border={border} style={{ padding: "24px 24px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: fg, marginBottom: 14 }}>1. Choose a Category</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                  {QUIZ_CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setQuizCategory(c.id)} style={{
                      padding: "14px 12px", background: quizCategory === c.id ? `${PURPLE}18` : "transparent",
                      border: `1px solid ${quizCategory === c.id ? PURPLE + "55" : border}`, borderRadius: 10,
                      color: quizCategory === c.id ? PURPLE : fg, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer",
                      display: "flex", flexDirection: "column", gap: 6, alignItems: "center", transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 18 }}>{c.icon}</span>{c.label}
                    </button>
                  ))}
                </div>
              </SCard>
              {quizCategory && (
                <SCard card={card} border={border} style={{ padding: "24px 24px", marginBottom: 16, animation: "cmFade 0.2s ease" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: fg, marginBottom: 14 }}>2. Number of Questions</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[5, 10, 20].map(n => (
                      <button key={n} onClick={() => setQuizCount(n)} style={{
                        flex: 1, padding: "14px 0", background: quizCount === n ? `${PURPLE}18` : "transparent",
                        border: `1px solid ${quizCount === n ? PURPLE + "55" : border}`, borderRadius: 10,
                        color: quizCount === n ? PURPLE : fg, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.15s",
                      }}>{n}</button>
                    ))}
                  </div>
                </SCard>
              )}
              {quizCategory && quizCount && (
                <button onClick={startQuiz} style={{ width: "100%", padding: "13px 0", background: `linear-gradient(135deg,${PURPLE},#a78bfa)`, border: "none", borderRadius: 11, color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", boxShadow: `0 4px 14px ${PURPLE}33` }}>Start Knowledge Test →</button>
              )}
            </div>
          )}

          {quizQuestions.length > 0 && !quizDone && (
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: muted, marginBottom: 6 }}>
                  <span>Question {quizIdx + 1}/{quizQuestions.length}</span>
                  <span style={{ color: PURPLE, fontWeight: 700 }}>{QUIZ_CATEGORIES.find(c => c.id === quizCategory)?.label}</span>
                </div>
                <ProgressBar2 value={quizIdx} max={quizQuestions.length} color={PURPLE} />
              </div>
              <SCard card={card} border={border} style={{ padding: "24px 26px" }}>
                <div style={{ fontSize: "0.92rem", fontWeight: 600, color: fg, lineHeight: 1.6, marginBottom: 20 }}>{quizQuestions[quizIdx].q}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {quizQuestions[quizIdx].options.map((opt, i) => {
                    const isCorrect = i === quizQuestions[quizIdx].answer;
                    const isChosen = i === quizSelected;
                    let bg = "transparent", bc = border, col = fg;
                    if (quizAnswered) { if (isCorrect) { bg = `${G}18`; bc = G; col = G; } else if (isChosen) { bg = "#ef444418"; bc = "#ef4444"; col = "#ef4444"; } }
                    else if (isChosen) { bg = `${PURPLE}12`; bc = PURPLE; col = PURPLE; }
                    return (
                      <button key={i} onClick={() => !quizAnswered && setQuizSelected(i)} disabled={quizAnswered} style={{ padding: "12px 16px", textAlign: "left", background: bg, border: `1px solid ${bc}`, borderRadius: 10, color: col, fontSize: "0.85rem", cursor: quizAnswered ? "default" : "pointer", transition: "all 0.15s" }}>
                        <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>{opt}
                      </button>
                    );
                  })}
                </div>
                {!quizAnswered ? (
                  <button onClick={submitQuizAnswer} disabled={quizSelected === null} style={{ width: "100%", marginTop: 18, padding: "11px 0", background: quizSelected !== null ? `linear-gradient(135deg,${PURPLE},#a78bfa)` : "#1a1a1a", border: "none", borderRadius: 10, color: quizSelected !== null ? "#fff" : "#333", fontWeight: 700, fontSize: "0.85rem", cursor: quizSelected !== null ? "pointer" : "not-allowed" }}>Submit</button>
                ) : (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ background: dark ? "#141414" : "#f5f0ff", border: `1px solid ${PURPLE}22`, borderRadius: 10, padding: "12px 14px", marginBottom: 12, fontSize: "0.8rem", color: muted, lineHeight: 1.6 }}>{quizQuestions[quizIdx].explain}</div>
                    <button onClick={nextQuizQuestion} style={{ width: "100%", padding: "11px 0", background: `linear-gradient(135deg,${PURPLE},#a78bfa)`, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>{quizIdx === quizQuestions.length - 1 ? "Finish →" : "Next →"}</button>
                  </div>
                )}
              </SCard>
            </div>
          )}

          {quizDone && (
            <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>{quizCorrect / quizQuestions.length >= 0.8 ? "🏆" : "📊"}</div>
              <h3 style={{ fontFamily: "Georgia,serif", fontSize: "1.3rem", fontWeight: 700, color: fg, marginBottom: 16 }}>Quiz Complete!</h3>
              <SCard card={card} border={border} style={{ padding: "22px 24px", marginBottom: 16, textAlign: "left" }}>
                {[["Category", QUIZ_CATEGORIES.find(c => c.id === quizCategory)?.label], ["Score", `${quizCorrect}/${quizQuestions.length}`], ["Accuracy", `${Math.round((quizCorrect / quizQuestions.length) * 100)}%`], ["Time Taken", `${Math.round((Date.now() - quizStartTime) / 1000)}s`]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${border}`, fontSize: "0.82rem" }}><span style={{ color: muted }}>{k}</span><span style={{ color: fg, fontWeight: 700 }}>{v}</span></div>
                ))}
              </SCard>
              <button onClick={resetQuiz} style={{ background: `linear-gradient(135deg,${PURPLE},#a78bfa)`, border: "none", borderRadius: 10, padding: "11px 24px", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>Take Another Quiz</button>
            </div>
          )}
        </div>
      )}

      {/* ══════════ STATISTICS TAB ══════════ */}
      {section === "stats" && (
        <div style={{ animation: "cmFade 0.25s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { l: "Daily Streak", v: dq.streak, icon: "🔥", c: AMBER },
              { l: "Longest Streak", v: dq.longestStreak, icon: "🏆", c: PURPLE },
              { l: "Questions Solved", v: dq.totalSolved, icon: "📝", c: G },
              { l: "Overall Accuracy", v: dq.totalSolved ? `${Math.round((dq.totalCorrect / dq.totalSolved) * 100)}%` : "—", icon: "🎯", c: BLUE },
              { l: "XP Earned", v: dq.xp, icon: "⭐", c: PURPLE },
              { l: "Badges", v: dq.badges.length, icon: "🏅", c: AMBER },
            ].map(s => (
              <SCard card={card} border={border} key={s.l} style={{ padding: "14px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><span>{s.icon}</span><span style={{ fontSize: "0.65rem", color: muted, fontWeight: 600, textTransform: "uppercase" }}>{s.l}</span></div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "1.3rem", fontWeight: 700, color: s.c }}>{s.v}</div>
              </SCard>
            ))}
          </div>

          {/* Topic breakdown */}
          {Object.keys(dq.topicStats).length > 0 && (
            <SCard card={card} border={border} style={{ padding: "20px 22px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 14 }}>Topic Breakdown</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(dq.topicStats).map(([topic, s]) => {
                  const acc = Math.round((s.correct / s.total) * 100);
                  const col = acc >= 70 ? G : acc >= 40 ? AMBER : "#ef4444";
                  return (
                    <div key={topic}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: fg, marginBottom: 5 }}>
                        <span>{topic}</span><span style={{ color: col, fontWeight: 700 }}>{s.correct}/{s.total} ({acc}%)</span>
                      </div>
                      <ProgressBar2 value={acc} color={col} />
                    </div>
                  );
                })}
              </div>
            </SCard>
          )}

          {/* Badges */}
          <SCard card={card} border={border} style={{ padding: "20px 22px" }}>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 14 }}>🏅 Achievements</div>
            {dq.badges.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {dq.badges.map(b => <span key={b} style={{ fontSize: "0.78rem", fontWeight: 700, color: PURPLE, background: `${PURPLE}15`, border: `1px solid ${PURPLE}30`, borderRadius: 8, padding: "6px 14px" }}>🏅 {b}</span>)}
              </div>
            ) : (
              <div style={{ fontSize: "0.8rem", color: muted }}>Complete daily sessions to earn badges like &quot;7-Day Learner&quot; and &quot;Perfect Session&quot;.</div>
            )}
          </SCard>
        </div>
      )}
      <RewardToast reward={reward} dark={dark} onClose={() => setReward(null)} />
    </div>
  );
}

export {
  DailyQuestionsSection,
};
