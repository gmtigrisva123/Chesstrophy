import { useMemo } from "react";
import { materialEval } from "../../lib/chess/evaluation.js";

// ── Evaluation bar — Phase 10 architecture. Currently renders a simple material
// count (honestly labeled as such) since no chess engine is connected. Accepts
// an optional `engineEval` prop ({ cp, mate, bestMove, depth }) so a future
// engine integration can plug straight in — when engineEval is provided, this
// component is what would switch from "material only" to real evaluation.
function EvaluationBar({ fen, dark, engineEval = null }) {
  const muted = dark ? "#8891a8" : "#666";
  const fg = dark ? "#f1f5f9" : "#111";
  const score = useMemo(() => materialEval(fen), [fen]);
  const connected = !!engineEval;
  const display = connected ? (engineEval.mate != null ? `#${engineEval.mate}` : (engineEval.cp > 0 ? `+${(engineEval.cp / 100).toFixed(1)}` : (engineEval.cp / 100).toFixed(1))) : (score > 0 ? `+${score}` : `${score}`);
  const fillPct = connected ? 50 + Math.max(-50, Math.min(50, (engineEval.cp || 0) / 12)) : 50 + Math.max(-50, Math.min(50, score * 6));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: muted, marginBottom: 5 }}>
        <span>{connected ? "Engine evaluation" : "Material balance"}</span>
        <span style={{ fontWeight: 700, color: fg }}>{display}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex", background: "#222" }}>
        <div style={{ width: `${fillPct}%`, background: "#e8ecf7", transition: "width 0.3s" }} />
        <div style={{ flex: 1, background: "#1a1a1a" }} />
      </div>
      <div style={{ fontSize: "0.6rem", color: muted, marginTop: 4 }}>
        {connected ? `Depth ${engineEval.depth ?? "?"}` : "Simple material count — no chess engine is connected yet."}
      </div>
    </div>
  );
}

export {
  EvaluationBar,
};
