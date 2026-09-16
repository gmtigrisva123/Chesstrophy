import { loadDQState } from "./dailyQuestionsState.js";
import { computeDNAScores } from "./dnaScores.js";
import { getWeekStart, loadEconomy } from "./economy.js";
import { getDueVariations, loadOpState } from "./openingProgress.js";
import { loadPzState } from "./puzzleProgress.js";
import { COGNITIVE_METRICS } from "../data/coachInsights.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── CHESSPROPHY AI — ANALYTICS DERIVED FROM REAL ACTIVITY ─────────────────────
// Everything the Learning Tree / AI Coach page shows about the user comes from
// here, and everything here is computed from state the user actually produced:
// the puzzle ledger, Daily Questions sessions, opening spaced-repetition
// records and the economy transaction log. Nothing is seeded, randomised or
// hand-written per user. When a signal has no data yet the function says so
// (0, an empty list, `null`) so the UI can render an honest empty state
// instead of a plausible-looking number.
// ══════════════════════════════════════════════════════════════════════════════

const DAY_MS = 86400000;
const clamp = (v) => Math.max(0, Math.min(99, Math.round(v)));
const pct = (correct, total) => (total > 0 ? Math.round((correct / total) * 100) : 0);

/** Transactions dated on or after the start of the current week (Monday). */
function transactionsThisWeek(econ = loadEconomy()) {
  const weekStart = new Date(getWeekStart() + "T00:00:00");
  return (econ.transactions || []).filter(t => new Date(t.date) >= weekStart);
}

// ── Cognitive profile ─────────────────────────────────────────────────────────
// Ten metrics, each a documented blend of live DNA scores (puzzles, questions,
// openings, tree) and the placement quiz. The placement result only ever
// contributes when the user actually sat it, and cannot exceed what the quiz
// measured.
//
// @param {{q:number,a:number}[]} placementAnswers - as saved by the placement flow
// @param {{type:string,correct:number}[]} questionCards - the cards that were asked
function buildCognitiveProfile(placementAnswers = [], questionCards = []) {
  const dna = Object.fromEntries(computeDNAScores().attrs.map(a => [a.key, a.score]));
  const pz = loadPzState();
  const dq = loadDQState();

  // Placement accuracy per question type, 0–100, only for types that were asked.
  const byType = {};
  placementAnswers.forEach(ans => {
    const card = questionCards[ans.q];
    if (!card) return;
    const t = byType[card.type] || (byType[card.type] = { correct: 0, total: 0 });
    t.total += 1;
    if (ans.a === card.correct) t.correct += 1;
  });
  const placement = (type) => (byType[type] ? pct(byType[type].correct, byType[type].total) : null);
  // Blend a live score with a placement score when one exists; otherwise the
  // live score stands alone.
  const blend = (live, place) => (place === null ? live : live * 0.7 + place * 0.3);

  // Decision confidence: share of puzzles solved without a hint.
  const attempted = (pz.solved || []).length;
  const hinted = (pz.hintUsedIds || []).length;
  const decisionConfidence = attempted > 0 ? pct(attempted - Math.min(hinted, attempted), attempted) : 0;

  // Time management: average seconds per Daily Question, 10s → 99, 60s+ → 0.
  const timed = Object.values(dq.topicStats || {}).filter(t => t.avgTime > 0);
  const avgTime = timed.length ? timed.reduce((n, t) => n + t.avgTime, 0) / timed.length : null;
  const timeManagement = avgTime === null ? 0 : clamp(99 - Math.max(0, avgTime - 10) * 2);

  // Consistency: 100 minus the spread of session accuracy across the last 14 sessions.
  const sessions = (dq.weeklyHistory || []).map(h => h.accuracy);
  const consistencyScore = sessions.length >= 3
    ? clamp(100 - (Math.max(...sessions) - Math.min(...sessions)))
    : 0;

  // Learning velocity: improvement of recent sessions over the ones before.
  const learningVelocity = (() => {
    if (sessions.length < 4) return 0;
    const half = Math.floor(sessions.length / 2);
    const early = sessions.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const late = sessions.slice(half).reduce((a, b) => a + b, 0) / (sessions.length - half);
    return clamp(50 + (late - early));
  })();

  return {
    tacticalVision:      clamp(blend(dna.tactical, placement("tactical"))),
    patternRecognition:  clamp(blend((dna.tactical + dna.accuracy) / 2, placement("pattern"))),
    calculationDepth:    clamp(dna.calc),
    positionalJudgement: clamp(blend(dna.strategy, placement("positional"))),
    endgameTechnique:    clamp(blend(dna.endgame, placement("endgame"))),
    openingKnowledge:    clamp(dna.opening),
    timeManagement,
    decisionConfidence,
    consistencyScore,
    learningVelocity,
  };
}

/** True when every metric is still 0 — the user has produced no signal yet. */
function isEmptyProfile(profile) {
  return COGNITIVE_METRICS.every(m => !(profile?.[m.key] > 0));
}

// ── Skill radar ───────────────────────────────────────────────────────────────
function computeSkillRadar() {
  const dna = Object.fromEntries(computeDNAScores().attrs.map(a => [a.key, a.score]));
  return [
    { label: "Tactics",     value: dna.tactical },
    { label: "Strategy",    value: dna.strategy },
    { label: "Endgames",    value: dna.endgame },
    { label: "Openings",    value: dna.opening },
    { label: "Calculation", value: dna.calc },
    { label: "Accuracy",    value: dna.accuracy },
  ];
}

// ── Weekly goals ──────────────────────────────────────────────────────────────
// Progress is counted from this week's ledger and session records. The targets
// are the same for everyone; only the progress is the user's.
function computeWeeklyGoals() {
  const txs = transactionsThisWeek();
  const count = (type) => txs.filter(t => t.type === type).length;

  const weekStart = new Date(getWeekStart() + "T00:00:00");
  const dqSessions = (loadDQState().weeklyHistory || []).filter(h => new Date(h.date) >= weekStart).length;
  const op = loadOpState();
  const linesPracticed = Object.values(op.progress || {})
    .flatMap(o => Object.values(o))
    .filter(v => v.lastSeen && new Date(v.lastSeen) >= weekStart).length;

  return [
    { id: "puzzles",  icon: "🧩", label: "Solve 20 puzzles",                  progress: Math.min(20, count("puzzle_solved")), max: 20 },
    { id: "daily",    icon: "📊", label: "Complete 5 Daily Questions sessions", progress: Math.min(5, dqSessions),             max: 5 },
    { id: "openings", icon: "📖", label: "Practice 5 opening lines",          progress: Math.min(5, linesPracticed),         max: 5 },
    { id: "courses",  icon: "📚", label: "Complete 1 course",                 progress: Math.min(1, count("course_complete")), max: 1 },
  ];
}

// ── AI insights ───────────────────────────────────────────────────────────────
// Rule-based observations, each backed by a specific number from the user's
// own records. An insight's id encodes what it is about, so dismissing
// "weak topic: Forks" stays dismissed until a different topic becomes the
// weakest. `go` names the tab or page the action button should open.
function computeAIInsights() {
  const insights = [];
  const dq = loadDQState();
  const pz = loadPzState();
  const op = loadOpState();
  const today = new Date().toDateString();

  // Weakest Daily Questions topic with enough attempts to mean something.
  const topics = Object.entries(dq.topicStats || {})
    .filter(([, t]) => t.total >= 3)
    .map(([name, t]) => ({ name, acc: pct(t.correct, t.total), total: t.total }))
    .sort((a, b) => a.acc - b.acc);
  if (topics.length && topics[0].acc < 60) {
    const t = topics[0];
    insights.push({
      id: `weak_topic:${t.name}`, icon: "🔥", priority: "high",
      title: `Blind spot: ${t.name}`,
      body: `You answered ${t.acc}% of ${t.total} ${t.name} questions correctly. A focused session on this topic will lift your weakest area fastest.`,
      action: "Daily Questions", go: { tab: "daily" },
    });
  }
  if (topics.length && topics[topics.length - 1].acc >= 80 && topics.length > 1) {
    const t = topics[topics.length - 1];
    insights.push({
      id: `strong_topic:${t.name}`, icon: "💪", priority: "medium",
      title: `Strength: ${t.name}`,
      body: `${t.acc}% accuracy across ${t.total} questions — this is your most reliable topic right now.`,
      action: "Skill Tree", go: { tab: "tree" },
    });
  }

  // Opening lines whose spaced-repetition review is due today.
  const due = getDueVariations(op);
  if (due.length) {
    insights.push({
      id: `due_reviews:${today}`, icon: "📖", priority: due.length >= 5 ? "high" : "medium",
      title: `${due.length} opening line${due.length === 1 ? "" : "s"} due for review`,
      body: `${due.slice(0, 3).map(d => d.variationName).join(", ")}${due.length > 3 ? ` and ${due.length - 3} more` : ""} — reviewing on the day they fall due is what keeps them in long-term memory.`,
      action: "Review Openings", go: { page: "Openings" },
    });
  }

  // A streak that has not been extended today.
  const streak = Math.max(pz.streak || 0, dq.streak || 0);
  const extendedToday = pz.lastSolvedDate === today || dq.lastSessionDate === today;
  if (streak >= 2 && !extendedToday) {
    insights.push({
      id: `streak_risk:${today}`, icon: "⏱️", priority: "medium",
      title: `Keep your ${streak}-day streak alive`,
      body: "Nothing logged yet today. One puzzle or a Daily Questions session before midnight keeps the streak going.",
      action: "Solve a Puzzle", go: { page: "Puzzles" },
    });
  }

  // Heavy reliance on hints.
  const attempted = (pz.solved || []).length;
  const hinted = (pz.hintUsedIds || []).length;
  if (attempted >= 5 && hinted / attempted >= 0.4) {
    insights.push({
      id: "hint_reliance", icon: "🎯", priority: "medium",
      title: "Try solving without hints",
      body: `You used a hint on ${pct(hinted, attempted)}% of your ${attempted} puzzles. Committing to a move first — even a wrong one — builds calculation faster than reading the hint.`,
      action: "Solve Puzzles", go: { page: "Puzzles" },
    });
  }

  // Learning velocity from Daily Questions session history.
  const sessions = (dq.weeklyHistory || []).map(h => h.accuracy);
  if (sessions.length >= 4) {
    const half = Math.floor(sessions.length / 2);
    const early = sessions.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const late = sessions.slice(half).reduce((a, b) => a + b, 0) / (sessions.length - half);
    const delta = Math.round(late - early);
    if (Math.abs(delta) >= 5) {
      insights.push({
        id: `velocity:${delta > 0 ? "up" : "down"}`, icon: delta > 0 ? "📈" : "📉", priority: delta > 0 ? "medium" : "high",
        title: delta > 0 ? `Accuracy up ${delta} points` : `Accuracy down ${Math.abs(delta)} points`,
        body: `Your last ${sessions.length - half} Daily Questions sessions averaged ${Math.round(late)}% against ${Math.round(early)}% before that.`,
        action: "Daily Questions", go: { tab: "daily" },
      });
    }
  }

  return insights;
}

// ── Research lab ──────────────────────────────────────────────────────────────
// Time series drawn straight from the records: one point per Daily Questions
// session, and one per ISO week for puzzles and XP from the ledger.
function computeResearchSeries() {
  const dq = loadDQState();
  const econ = loadEconomy();
  const txs = econ.transactions || [];

  const now = Date.now();
  const weeks = 8;
  const weekIndex = (date) => Math.floor((now - new Date(date).getTime()) / (7 * DAY_MS));
  const perWeek = (pick) => {
    const buckets = Array(weeks).fill(0);
    txs.forEach(t => {
      const w = weekIndex(t.date);
      if (w >= 0 && w < weeks) buckets[weeks - 1 - w] += pick(t);
    });
    return buckets;
  };

  const dqSessions = (dq.weeklyHistory || []).slice(-8);

  return [
    { key: "dq_accuracy", title: "Daily Questions Accuracy", icon: "📈", desc: "Accuracy % of your last 8 sessions.", unit: "%",
      data: dqSessions.map(h => h.accuracy), labels: dqSessions.map(h => new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })), color: "#2563EB" },
    { key: "puzzles_week", title: "Puzzles Solved per Week", icon: "🧩", desc: "Rewarded solves from the last 8 weeks.", unit: "",
      data: perWeek(t => (t.type === "puzzle_solved" ? 1 : 0)), labels: null, color: "#60a5fa" },
    { key: "xp_week", title: "XP Earned per Week", icon: "🚀", desc: "All XP from puzzles, courses and sessions, by week.", unit: " XP",
      data: perWeek(t => t.xp || 0), labels: null, color: "#8b5cf6" },
  ].map(series => ({ ...series, hasData: series.data.some(v => v > 0) }));
}

// Observations only when the sample is big enough to support them. Each one
// states the sample size (`n`) it was drawn from.
function computeResearchFindings() {
  const findings = [];
  const dq = loadDQState();
  const pz = loadPzState();
  const econ = loadEconomy();
  const txs = econ.transactions || [];

  const topics = Object.entries(dq.topicStats || {}).filter(([, t]) => t.total >= 3);
  if (topics.length >= 2) {
    const ranked = topics.map(([name, t]) => ({ name, acc: pct(t.correct, t.total), n: t.total })).sort((a, b) => b.acc - a.acc);
    findings.push({ finding: `${ranked[0].name} is your most accurate topic (${ranked[0].acc}%)`, n: ranked[0].n, strong: ranked[0].acc >= 75 });
    const last = ranked[ranked.length - 1];
    findings.push({ finding: `${last.name} is where you miss most often (${last.acc}%)`, n: last.n, strong: last.acc < 50 });
  }

  const attempted = (pz.solved || []).length;
  if (attempted >= 10) {
    const hinted = Math.min((pz.hintUsedIds || []).length, attempted);
    findings.push({ finding: `You solve ${pct(attempted - hinted, attempted)}% of puzzles without a hint`, n: attempted, strong: hinted / attempted < 0.2 });
  }

  if (txs.length >= 10) {
    const byDay = Array(7).fill(0);
    txs.forEach(t => { byDay[new Date(t.date).getDay()] += 1; });
    const best = byDay.indexOf(Math.max(...byDay));
    const name = new Date(2024, 0, 7 + best).toLocaleDateString(undefined, { weekday: "long" });
    findings.push({ finding: `${name} is your most active training day (${pct(byDay[best], txs.length)}% of activity)`, n: txs.length, strong: true });
  }

  const timed = Object.entries(dq.topicStats || {}).filter(([, t]) => t.avgTime > 0 && t.total >= 3);
  if (timed.length >= 2) {
    const slowest = timed.sort((a, b) => b[1].avgTime - a[1].avgTime)[0];
    findings.push({ finding: `${slowest[0]} questions take you longest (${Math.round(slowest[1].avgTime)}s on average)`, n: slowest[1].total, strong: false });
  }

  return findings;
}

// ── Skill-tree recommendation ─────────────────────────────────────────────────
// Which branch to work on next, from the branch mastery the tree actually
// records. `branches` are TREE_DATA.children annotated by the page with their
// unlocked/mastered counts.
function recommendBranch(branches) {
  const scored = branches.map(b => ({ ...b, pct: b.total ? b.unlocked / b.total : 0 }));
  const touched = scored.filter(b => b.unlocked > 0 || b.mastered > 0);
  if (!touched.length) return null;
  const strongest = [...scored].sort((a, b) => b.pct - a.pct || b.mastered - a.mastered)[0];
  const weakest = [...scored].sort((a, b) => a.pct - b.pct || a.mastered - b.mastered)[0];
  if (strongest.id === weakest.id) return null;
  return { strongest, weakest };
}

export {
  buildCognitiveProfile,
  isEmptyProfile,
  computeSkillRadar,
  computeWeeklyGoals,
  computeAIInsights,
  computeResearchSeries,
  computeResearchFindings,
  recommendBranch,
};
