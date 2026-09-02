// ── Analysis info — companion to EvaluationBar for Phase 10. Shows best move,
// candidate moves, and flagged threats/mistakes — all driven entirely by the
// same optional `engineEval` prop. With no engine connected (the current
// state), this renders a clear, honest "not connected" empty state instead of
// guessing or inventing numbers. Shape a future engine integration should
// produce: { cp, mate, bestMove: "Nf3", candidates: [{san,cp}], depth,
// threats: ["..."], mistakes: [{ply,note}] }
function AnalysisInfo({ engineEval, dark }) {
  const fg = dark ? "#f1f5f9" : "#111", muted = dark ? "#8891a8" : "#666";
  const border = dark ? "rgba(148,163,255,0.10)" : "#e8e8e8";
  if (!engineEval) {
    return (
      <div style={{ marginTop: 12, padding: "12px 14px", border: `1px dashed ${border}`, borderRadius: 10, textAlign: "center" }}>
        <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 2 }}>No chess engine connected</div>
        <div style={{ fontSize: "0.66rem", color: muted }}>Best move, candidate lines, and threat detection will appear here once one is.</div>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 12 }}>
      {engineEval.bestMove && (
        <div style={{ fontSize: "0.78rem", color: fg, marginBottom: 8 }}>Best move: <b style={{ fontFamily: "monospace" }}>{engineEval.bestMove}</b></div>
      )}
      {engineEval.candidates?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: "0.64rem", color: muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Candidate moves</div>
          {engineEval.candidates.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: fg, padding: "2px 0", fontFamily: "monospace" }}>
              <span>{c.san}</span><span>{c.cp > 0 ? `+${(c.cp / 100).toFixed(1)}` : (c.cp / 100).toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
      {engineEval.threats?.length > 0 && (
        <div>
          <div style={{ fontSize: "0.64rem", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Threats</div>
          {engineEval.threats.map((t, i) => <div key={i} style={{ fontSize: "0.76rem", color: fg, marginBottom: 3 }}>⚠ {t}</div>)}
        </div>
      )}
    </div>
  );
}

export {
  AnalysisInfo,
};
