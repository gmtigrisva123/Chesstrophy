function WikiArticleCard({ article, categories, dark, onClick }) {
  const fg = dark ? "#f0f0f0" : "#111", muted = dark ? "#8891a8" : "#666";
  const card = dark ? "rgba(17,24,39,0.5)" : "#fff", border = dark ? "rgba(148,163,255,0.10)" : "#e8e8e8";
  const G = "#2563EB";
  const cat = categories.find(c => c.id === article.categoryId);
  return (
    <div onClick={onClick} style={{
      background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20,
      cursor: "pointer", transition: "all 0.16s", display: "flex", flexDirection: "column", gap: 10, height: "100%",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = `${G}55`; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "1.1rem" }}>{cat?.icon || "📖"}</span>
        {article.featured && <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#C9A84C", letterSpacing: "0.06em" }}>⭐ FEATURED</span>}
      </div>
      <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1rem", color: fg, letterSpacing: "-0.01em" }}>{article.title}</div>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.06em" }}>{cat?.label || "Article"}</div>
      <div style={{ fontSize: "0.8rem", color: muted, lineHeight: 1.6, flex: 1 }}>{article.shortDesc}</div>
      <div style={{ fontSize: "0.76rem", fontWeight: 700, color: G }}>Read Article →</div>
    </div>
  );
}

export {
  WikiArticleCard,
};
