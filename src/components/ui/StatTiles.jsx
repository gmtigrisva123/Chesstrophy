function ProgStat({ label, value, icon, color }) {
  return (
    <div style={{ textAlign: "center", padding: "12px 8px", background: color + "10", border: `1px solid ${color}25`, borderRadius: 12 }}>
      <div style={{ fontSize: 16, marginBottom: 5 }}>{icon}</div>
      <div style={{ fontSize: "0.9rem", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: "0.6rem", color: "#888", marginTop: 3 }}>{label}</div>
    </div>
  );
}
function ProfileStat({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(128,128,128,0.12)" }}>
      <span style={{ fontSize: "0.78rem", color: "#888" }}>{label}</span>
      <span style={{ fontSize: "0.86rem", fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
function ProgressStat({ label, value, icon, color }) {
  return (
    <div style={{ background: `${color}12`, border: `1px solid ${color}33`, borderRadius: 13, padding: "16px 18px" }}>
      <div style={{ fontSize: "1.1rem", marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: "1.3rem", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: "0.7rem", color: "#888", marginTop: 2 }}>{label}</div>
    </div>
  );
}

export {
  ProgStat,
  ProgressStat,
  ProfileStat,
};
