// ── Tab bar ────────────────────────────────────────────────────────────────
function CourseTabBar({ tabs, active, onChange, dark, color }) {
  const idx = tabs.findIndex(t => t.key === active);
  return (
    <div style={{
      position: "relative", display: "flex", background: dark ? "#111" : "#f2f2f2",
      border: `1px solid ${dark ? "#1f1f1f" : "#e5e5e5"}`, borderRadius: 14, padding: 5, gap: 4,
    }}>
      <div style={{
        position: "absolute", top: 5, bottom: 5, left: `calc(${idx} * (100% / 3) + 4px)`,
        width: `calc(100% / 3 - 8px)`, background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        borderRadius: 10, transition: "left 0.35s cubic-bezier(.4,0,.2,1)", boxShadow: `0 4px 16px ${color}44`,
        zIndex: 0,
      }} />
      {tabs.map(t => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className="course-tab-btn"
            style={{
              position: "relative", zIndex: 1, flex: 1, border: "none", background: "transparent",
              padding: "13px 10px", borderRadius: 10, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontWeight: 800, fontSize: "0.86rem",
              color: isActive ? "#fff" : (dark ? "#999" : "#666"),
              transition: "color 0.25s, transform 0.15s",
            }}
          >
            <span style={{ fontSize: "1.05rem" }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
      <style>{`
        .course-tab-btn:hover { transform: translateY(-1px); }
        .course-tab-btn:not(:hover) { transform: translateY(0); }
      `}</style>
    </div>
  );
}

export {
  CourseTabBar,
};
