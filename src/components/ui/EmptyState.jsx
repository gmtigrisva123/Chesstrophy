function DashEmpty({ icon, title, sub, dark }) {
  return (
    <div style={{ textAlign: "center", padding: "34px 20px", color: dark ? "#666" : "#999" }}>
      <div style={{ fontSize: 26, marginBottom: 8, opacity: 0.6 }}>{icon}</div>
      <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: "0.74rem" }}>{sub}</div>}
    </div>
  );
}

// ── Empty state placeholder ───────────────────────────────────────────────────
function EmptyState({ icon = "📭", title = "Nothing here yet", sub = "" }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 16px", color: "#888" }}>
      <div style={{ fontSize: 30, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#aaa", marginBottom: sub ? 4 : 0 }}>{title}</div>
      {sub && <div style={{ fontSize: "0.76rem", color: "#666" }}>{sub}</div>}
    </div>
  );
}

export {
  EmptyState,
  DashEmpty,
};
