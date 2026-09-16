import { readJson } from "../../lib/storage/jsonStore.js";

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

  // ── Tactical Vision — from puzzle rating + daily questions accuracy ────────
  const puzzleRating   = pz.puzzleRating || 1200;
  const dqAccuracy     = dq.totalSolved > 0 ? Math.round((dq.totalCorrect / dq.totalSolved) * 100) : 50;
  const tacticsTopic   = dq.topicStats?.["Forks"]?.correct || 0;
  const tacticsTotal   = dq.topicStats?.["Forks"]?.total   || 1;
  const tacticsAcc     = Math.round((tacticsTopic / tacticsTotal) * 100);
  const tacticalVision = Math.min(99, Math.round(
    ((puzzleRating - 800) / 1600) * 60 + dqAccuracy * 0.25 + tacticsAcc * 0.15
  ));

  // ── Calculation — from daily question calculation accuracy + LT progress ──
  const calcDQ    = dq.topicStats?.["Candidate Moves"] || dq.topicStats?.["Complex Calculation"];
  const calcAcc   = calcDQ ? Math.round((calcDQ.correct / Math.max(calcDQ.total,1)) * 100) : 45;
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
  const egDQ  = dq.topicStats?.["Basic Endgames"] || dq.topicStats?.["High-Level Endgames"] || dq.topicStats?.["Rook Endgames"];
  const egAcc = egDQ ? Math.round((egDQ.correct / Math.max(egDQ.total,1)) * 100) : 35;
  const egLTNodes = ["endgames","end_kp","end_philidor","end_lucena","end_rook","end_queen","end_minor"];
  const egLTPct   = Math.round((egLTNodes.filter(n=>ltNodes.includes(n)).length / egLTNodes.length)*100);
  const endgameTechnique = Math.min(99, Math.round(egAcc * 0.5 + egLTPct * 0.4 + 10));

  // ── Accuracy — from puzzle accuracy + daily questions overall ─────────────
  const puzzleSolved  = pz.solved?.length || 0;
  const pzAcc  = pz.puzzleRating ? Math.min(95, Math.round(((pz.puzzleRating-800)/1600)*60 + 30)) : 50;
  const accuracy = Math.min(99, Math.round(pzAcc * 0.5 + dqAccuracy * 0.4 + Number(pz.streak || 0)));

  // ── Strategic Understanding — from strategy DQ topics + LT strategy nodes ──
  const stratDQ  = dq.topicStats?.["Strategic Planning"] || dq.topicStats?.["Pawn Structures"];
  const stratAcc = stratDQ ? Math.round((stratDQ.correct / Math.max(stratDQ.total,1)) * 100) : 40;
  const stratLT  = ["strategy","str_outposts","str_weaknesses","str_pawns","str_minority","str_planning"];
  const stratPct = Math.round((stratLT.filter(n=>ltNodes.includes(n)).length / stratLT.length)*100);
  const strategicUnderstanding = Math.min(99, Math.round(stratAcc * 0.45 + stratPct * 0.35 + 15));

  // ── Trend logic: compare to a baseline of 50 ─────────────────────────────
  const trend = (val, base = 50) => val > base + 10 ? "↑" : val < base - 10 ? "↓" : "→";

  // ── Overall DNA score (weighted average) ──────────────────────────────────
  const attrs = [tacticalVision, calculation, openingKnowledge, endgameTechnique, accuracy, strategicUnderstanding];
  const overall = Math.round(attrs.reduce((a,b)=>a+b,0) / attrs.length);

  return {
    overall,
    attrs: [
      { key:"tactical",  label:"Tactical Vision",        icon:"⚔️", score: tacticalVision,        color:"#ef4444", trend: trend(tacticalVision),        explain: tacticalVision > 65 ? "Strong puzzle performance is driving your tactical sharpness." : "Regular puzzle sessions will improve this significantly." },
      { key:"calc",      label:"Calculation",            icon:"🧠", score: calculation,            color:"#8b5cf6", trend: trend(calculation),            explain: calculation > 60 ? "Your candidate move selection is improving through daily questions." : "Focus on the Calculation branch in the Learning Tree to develop deeper vision." },
      { key:"opening",   label:"Opening Knowledge",      icon:"📖", score: openingKnowledge,       color:"#C9A84C", trend: trend(openingKnowledge),       explain: openingKnowledge > 55 ? "Good opening repertoire development through the Openings section." : "Practice more openings in the Openings section to build your repertoire." },
      { key:"endgame",   label:"Endgame Technique",      icon:"♔",  score: endgameTechnique,       color:"#2563EB", trend: trend(endgameTechnique, 40),   explain: endgameTechnique > 50 ? "Solid endgame foundation being built." : "Endgames are your biggest opportunity — unlock the Endgame branch in the Learning Tree." },
      { key:"accuracy",  label:"Accuracy",               icon:"🎯", score: accuracy,               color:"#60a5fa", trend: trend(accuracy),               explain: accuracy > 65 ? "Your move accuracy is above average for your current level." : "Slow down and calculate before moving to improve accuracy." },
      { key:"strategy",  label:"Strategic Understanding",icon:"♟️", score: strategicUnderstanding, color:"#f59e0b", trend: trend(strategicUnderstanding, 40), explain: strategicUnderstanding > 55 ? "Growing positional understanding detected from your training." : "Study pawn structures and plans through the Strategy branch to improve this." },
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
