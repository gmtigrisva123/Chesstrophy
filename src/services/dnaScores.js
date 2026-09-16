import { previousDNASnapshot, recordDNASnapshot } from "./dnaHistory.js";
import { readJson } from "../lib/storage/jsonStore.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── CHESS DNA ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── Read real localStorage data and derive 6 DNA scores ───────────────────────
function computeDNAScores() {
  const empty = () => ({});
  const pz = readJson("chessprophy_puzzles", empty);
  const dq = readJson("chessprophy_daily_questions", empty);
  const op = readJson("chessprophy_openings", empty);
  const lt = readJson("chessprophy_learningtree", empty);
  const cm = readJson("chessprophy_chessmind", empty);

  // Every score below is built only from things the user has actually done.
  // Where a signal has no data yet it contributes 0 — no invented baseline —
  // so a brand-new account reads 0 across the board rather than a made-up
  // "Developing" profile.
  const puzzleSolved  = pz.solved?.length || 0;
  const topicAcc = (...topics) => {
    const seen = topics.map(name => dq.topicStats?.[name]).filter(Boolean);
    const total = seen.reduce((n, t) => n + (t.total || 0), 0);
    const correct = seen.reduce((n, t) => n + (t.correct || 0), 0);
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  // ── Tactical Vision — from puzzle rating + daily questions accuracy ────────
  // The 1200 starting rating is a default, not a result: it only counts once
  // at least one puzzle has moved it.
  const puzzleRating   = puzzleSolved > 0 ? (pz.puzzleRating || 1200) : 800;
  const dqAccuracy     = dq.totalSolved > 0 ? Math.round((dq.totalCorrect / dq.totalSolved) * 100) : 0;
  const tacticsAcc     = topicAcc("Forks", "Basic Tactics", "Pins", "Discovered Attacks");
  const tacticalVision = Math.min(99, Math.round(
    ((puzzleRating - 800) / 1600) * 60 + dqAccuracy * 0.25 + tacticsAcc * 0.15
  ));

  // ── Calculation — from daily question calculation accuracy + LT progress ──
  const calcAcc   = topicAcc("Candidate Moves", "Complex Calculation", "Calculation");
  const ltNodes   = lt.unlockedNodes || [];
  const calcNodes = ["calculation","calc_candidates","calc_forcing","calc_sequences","calc_long"];
  const calcLT    = Math.round((calcNodes.filter(n => ltNodes.includes(n)).length / calcNodes.length) * 100);
  const calculation = Math.min(99, Math.round(calcAcc * 0.5 + calcLT * 0.3 + (cm.sessionsCompleted || 0) * 2));

  // ── Opening Knowledge — from openings localStorage progress ───────────────
  const opProgress  = op.progress || {};
  const allOpVars   = Object.values(opProgress).flatMap(o => Object.values(o));
  const opMastered  = allOpVars.filter(v => v.status === "Mastered" || v.status === "Strong").length;
  const opTotal     = Math.max(allOpVars.length, 1);
  const opLTNodes   = ["openings","op_italian","op_sicilian","op_french","op_london","op_structures","op_orders"];
  const opLTPct     = Math.round((opLTNodes.filter(n=>ltNodes.includes(n)).length / opLTNodes.length)*100);
  const openingKnowledge = Math.min(99, Math.round(
    (opMastered / opTotal) * 50 + opLTPct * 0.3 + (op.streak || 0) * 3
  ));

  // ── Endgame Technique — from endgame DQ topics + LT endgame nodes ─────────
  const egAcc = topicAcc("Basic Endgames", "High-Level Endgames", "Rook Endgames", "Transition to Endgame");
  const egLTNodes = ["endgames","end_kp","end_philidor","end_lucena","end_rook","end_queen","end_minor"];
  const egLTPct   = Math.round((egLTNodes.filter(n=>ltNodes.includes(n)).length / egLTNodes.length)*100);
  const endgameTechnique = Math.min(99, Math.round(egAcc * 0.55 + egLTPct * 0.45));

  // ── Accuracy — from puzzle accuracy + daily questions overall ─────────────
  const pzAcc  = puzzleSolved > 0 ? Math.min(95, Math.round(((puzzleRating-800)/1600)*60 + 30)) : 0;
  const accuracy = Math.min(99, Math.round(pzAcc * 0.5 + dqAccuracy * 0.4 + Number(pz.streak || 0)));

  // ── Strategic Understanding — from strategy DQ topics + LT strategy nodes ──
  const stratAcc = topicAcc("Strategic Planning", "Pawn Structures", "Positional Sacrifices", "Dynamic Imbalances");
  const stratLT  = ["strategy","str_outposts","str_weaknesses","str_pawns","str_minority","str_planning"];
  const stratPct = Math.round((stratLT.filter(n=>ltNodes.includes(n)).length / stratLT.length)*100);
  const strategicUnderstanding = Math.min(99, Math.round(stratAcc * 0.55 + stratPct * 0.45));

  // ── Overall DNA score (weighted average) ──────────────────────────────────
  const scores = { tactical: tacticalVision, calc: calculation, opening: openingKnowledge, endgame: endgameTechnique, accuracy, strategy: strategicUnderstanding };
  const overall = Math.round(Object.values(scores).reduce((a,b)=>a+b,0) / Object.keys(scores).length);

  // ── Trend: today's score against the last snapshot from an earlier day ─────
  // Flat until there is a previous day to compare with — never against an
  // invented baseline.
  const previous = previousDNASnapshot();
  recordDNASnapshot({ overall, scores });
  const trend = (key) => {
    const before = previous?.scores?.[key];
    if (before === undefined) return "→";
    const delta = scores[key] - before;
    return delta >= 3 ? "↑" : delta <= -3 ? "↓" : "→";
  };

  return {
    overall,
    attrs: [
      { key:"tactical",  label:"Tactical Vision",        icon:"⚔️", score: tacticalVision,        color:"#ef4444", trend: trend("tactical"), explain: tacticalVision > 65 ? "Strong puzzle performance is driving your tactical sharpness." : "Regular puzzle sessions will improve this significantly." },
      { key:"calc",      label:"Calculation",            icon:"🧠", score: calculation,            color:"#8b5cf6", trend: trend("calc"),     explain: calculation > 60 ? "Your candidate move selection is improving through daily questions." : "Focus on the Calculation branch in the Learning Tree to develop deeper vision." },
      { key:"opening",   label:"Opening Knowledge",      icon:"📖", score: openingKnowledge,       color:"#C9A84C", trend: trend("opening"),  explain: openingKnowledge > 55 ? "Good opening repertoire development through the Openings section." : "Practice more openings in the Openings section to build your repertoire." },
      { key:"endgame",   label:"Endgame Technique",      icon:"♔",  score: endgameTechnique,       color:"#2563EB", trend: trend("endgame"),  explain: endgameTechnique > 50 ? "Solid endgame foundation being built." : "Endgames are your biggest opportunity — unlock the Endgame branch in the Learning Tree." },
      { key:"accuracy",  label:"Accuracy",               icon:"🎯", score: accuracy,               color:"#60a5fa", trend: trend("accuracy"), explain: accuracy > 65 ? "Your move accuracy is above average for your current level." : "Slow down and calculate before moving to improve accuracy." },
      { key:"strategy",  label:"Strategic Understanding",icon:"♟️", score: strategicUnderstanding, color:"#f59e0b", trend: trend("strategy"), explain: strategicUnderstanding > 55 ? "Growing positional understanding detected from your training." : "Study pawn structures and plans through the Strategy branch to improve this." },
    ],
    // Raw data for context
    meta: { puzzleSolved, dqStreak: dq.streak||0, opStreak: op.streak||0, ltUnlocked: ltNodes.length },
  };
}

// ── Level label from score ────────────────────────────────────────────────────
function dnaLevel(score) {
  if (score >= 85) return { label: "Elite",        color: "#C9A84C" };
  if (score >= 70) return { label: "Advanced",     color: "#2563EB" };
  if (score >= 55) return { label: "Intermediate", color: "#60a5fa" };
  if (score >= 40) return { label: "Developing",   color: "#f59e0b" };
  return               { label: "Beginner",        color: "#888"    };
}

export {
  computeDNAScores,
  dnaLevel,
};
