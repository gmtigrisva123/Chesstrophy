function SectionHeader({ dark, eyebrow, title, sub }) {
  const fg = dark ? "#f0f0f0" : "#111";
  const muted = dark ? "#888" : "#666";
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ color: "#C9A84C", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{eyebrow}</div>
      <h2 style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: fg, letterSpacing: "-0.03em", marginBottom: 8 }}>{title}</h2>
      {sub && <p style={{ fontSize: "0.9rem", color: muted, maxWidth: 560, lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

export {
  SectionHeader,
};
