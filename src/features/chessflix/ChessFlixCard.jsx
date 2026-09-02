function ChessFlixCard({ c, dark, onClick }) {
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#888"    : "#666";
  const card   = dark ? "#111"    : "#fff";
  const border = dark ? "#1f1f1f" : "#e8e8e8";
  const thumb = c.thumbnail || (c.type === "image" ? c.mediaUrl : null);
  return (
    <div className="cfx-card" onClick={onClick} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "all 0.18s" }}>
      <div style={{ position: "relative", height: 150, background: thumb ? `url(${thumb}) center/cover` : "linear-gradient(135deg,#1a1a1a,#0d0d0d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {c.type === "video" && (
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "1.5px solid #fff8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" }}>▶</div>
        )}
        {c.type === "image" && !thumb && <span style={{ fontSize: 28, opacity: 0.4 }}>🖼️</span>}
        {c.featured && <span style={{ position: "absolute", top: 10, left: 10, fontSize: "0.6rem", fontWeight: 800, color: "#fbbf24", background: "#000a", borderRadius: 6, padding: "2px 8px" }}>⭐ FEATURED</span>}
      </div>
      <div style={{ padding: "14px 16px" }}>
        {c.category && <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "#ef4444", marginBottom: 5 }}>{c.category.toUpperCase()}</div>}
        <div style={{ fontWeight: 700, fontSize: "0.86rem", color: fg, marginBottom: 6, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{c.title}</div>
        <div style={{ fontSize: "0.74rem", color: muted, marginBottom: 10, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{c.desc}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: muted }}>
          <span>👁 {(c.views||0).toLocaleString()} views</span>
          <span>By {c.creatorName}</span>
        </div>
      </div>
    </div>
  );
}

export {
  ChessFlixCard,
};
