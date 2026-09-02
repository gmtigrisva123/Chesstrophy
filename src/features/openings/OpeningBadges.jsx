// ── Difficulty badge ──────────────────────────────────────────────────────────
function OpDiffBadge({ level }) {
  const c = level === "Beginner" ? "#4ade80" : level === "Intermediate" ? "#60a5fa" : level === "Advanced" ? "#f59e0b" : "#a78bfa";
  return <span style={{ fontSize: "0.65rem", fontWeight: 700, color: c, background: c + "18", border: `1px solid ${c}33`, borderRadius: 5, padding: "2px 7px" }}>{level}</span>;
}

// ── Style tag badge ────────────────────────────────────────────────────────────
function StyleTag({ tag }) {
  const colors = { Attack: "#ef4444", Positional: "#60a5fa", Solid: "#2563EB", Sharp: "#f59e0b", Classical: "#a78bfa", "Theory-heavy": "#fb7185", "Low theory": "#4ade80", "System opening": "#2563EB", Flexible: "#60a5fa", Counterattacking: "#f59e0b" };
  const c = colors[tag] || "#888";
  return <span style={{ fontSize: "0.62rem", fontWeight: 600, color: c, background: c + "15", borderRadius: 5, padding: "2px 7px" }}>{tag}</span>;
}

// ── SR status badge ────────────────────────────────────────────────────────────
function SrBadge({ status }) {
  const colors = { New: "#888", Learning: "#f59e0b", Good: "#60a5fa", Strong: "#2563EB", Mastered: "#C9A84C" };
  const c = colors[status] || "#888";
  return <span style={{ fontSize: "0.62rem", fontWeight: 700, color: c, background: c + "18", border: `1px solid ${c}33`, borderRadius: 5, padding: "2px 8px" }}>{status}</span>;
}

export {
  OpDiffBadge,
  StyleTag,
  SrBadge,
};
