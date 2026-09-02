// ── Metric gauge ──────────────────────────────────────────────────────────────
function MetricGauge({ value, label, icon, color = "#2563EB", size = 64 }) {
  const r = (size / 2) - 6, c = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 70 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="#1e1e1e" strokeWidth="5" />
          <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform={`rotate(-90 ${c} ${c})`} style={{ transition: "stroke-dasharray 0.8s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontSize: "0.58rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
        </div>
      </div>
      <div style={{ fontSize: "0.62rem", color: "#666", textAlign: "center", lineHeight: 1.3, maxWidth: 68 }}>{label}</div>
    </div>
  );
}

export {
  MetricGauge,
};
