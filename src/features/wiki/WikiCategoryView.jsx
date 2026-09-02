import { WikiArticleCard } from "./WikiArticleCard.jsx";

function WikiCategoryView({ category, articles, dark, onBack, onOpenArticle }) {
  const fg = dark ? "#f0f0f0" : "#111", muted = dark ? "#8891a8" : "#666";
  const border = dark ? "rgba(148,163,255,0.10)" : "#e8e8e8";
  return (
    <div>
      <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 10, padding: "8px 16px", color: muted, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", marginBottom: 20 }}>← Back to ChessWiki</button>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>{category?.icon}</div>
        <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1.5rem", color: fg, marginBottom: 6 }}>{category?.label}</div>
        <div style={{ fontSize: "0.86rem", color: muted, maxWidth: 560 }}>{category?.desc}</div>
      </div>
      {articles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: muted, fontSize: "0.85rem" }}>No articles in this category yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {articles.map(a => <WikiArticleCard key={a.id} article={a} categories={[category]} dark={dark} onClick={() => onOpenArticle(a.id)} />)}
        </div>
      )}
    </div>
  );
}

export {
  WikiCategoryView,
};
