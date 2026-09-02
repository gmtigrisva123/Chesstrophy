import { EmptyState } from "../../components/ui/EmptyState.jsx";

function CourseCheatSheetTab({ course, content, dark, fg, muted, card, border, color }) {
  const cs = content.cheatSheet || {};
  const sections = [
    { key: "concepts", label: "Key Concepts", icon: "🔑", color: "#60a5fa", items: cs.concepts },
    { key: "rules",    label: "Important Rules", icon: "📐", color: "#4ade80", items: cs.rules },
    { key: "mistakes", label: "Common Mistakes", icon: "⚠️", color: "#ef4444", items: cs.mistakes },
    { key: "tricks",   label: "Memory Tricks", icon: "🧠", color: "#a78bfa", items: cs.tricks },
  ].filter(s => s.items && s.items.length);

  return (
    <div className="cf-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: fg, marginBottom: 4 }}>{course.title} — One-Page Summary</h2>
          <div style={{ fontSize: "0.78rem", color: muted }}>Everything you need to revise in under 5 minutes.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${color}15`, border: `1px solid ${color}33`, borderRadius: 20, padding: "6px 14px", fontSize: "0.72rem", fontWeight: 700, color }}>
          ⏱ ~5 min read
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {sections.map(sec => (
          <div key={sec.key} style={{
            background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 20px",
            borderTop: `3px solid ${sec.color}`, transition: "transform 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 9, background: `${sec.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
              }}>{sec.icon}</span>
              <span style={{ fontWeight: 800, fontSize: "0.88rem", color: fg }}>{sec.label}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sec.items.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: sec.color, marginTop: 7, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.82rem", color: dark ? "#d5d5d5" : "#333", lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {sections.length === 0 && <EmptyState icon="📄" title="No cheat sheet yet" sub="Check back soon." />}
    </div>
  );
}

export {
  CourseCheatSheetTab,
};
