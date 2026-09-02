// ── Mini progress bar ─────────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = "#2563EB", height = 6 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ height, background: "#1a1a1a", borderRadius: height, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}bb)`, borderRadius: height, transition: "width 0.6s ease" }} />
    </div>
  );
}

export {
  ProgressBar,
};
