import { useState, useMemo } from "react";
import { WikiArticleCard } from "./WikiArticleCard.jsx";
import { wikiSearchArticles } from "../../services/wiki.js";

function WikiHomeView({ categories, articles, dark, onOpenArticle, onOpenCategory }) {
  const fg = dark ? "#f0f0f0" : "#111", muted = dark ? "#8891a8" : "#666";
  const border = dark ? "rgba(148,163,255,0.10)" : "#e8e8e8";
  const G = "#2563EB";
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const results = useMemo(() => wikiSearchArticles(articles, categories, query), [articles, categories, query]);

  const featured = articles.filter(a => a.featured).slice(0, 3);
  const recent = articles.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
  const popular = articles.slice().sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.7rem,3.5vw,2.3rem)", fontWeight: 700, color: fg, letterSpacing: "-0.02em", marginBottom: 8 }}>📚 ChessWiki</div>
        <div style={{ fontSize: "0.9rem", color: muted, fontStyle: "italic" }}>«Explore everything about chess.»</div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 560, margin: "0 auto 40px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: "0.95rem", color: muted, pointerEvents: "none" }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search ChessWiki..."
            style={{
              width: "100%", padding: "14px 16px 14px 42px", borderRadius: 14,
              background: dark ? "rgba(255,255,255,0.05)" : "#fff",
              border: `1px solid ${focused ? G + "70" : border}`,
              color: fg, fontSize: "0.9rem", outline: "none", transition: "border-color 0.15s",
              boxShadow: focused ? `0 0 0 3px ${G}1f` : "none",
            }}
          />
        </div>
        {focused && query.trim() && (
          <div style={{
            position: "absolute", top: "110%", left: 0, right: 0, zIndex: 20,
            background: dark ? "#111827" : "#fff", border: `1px solid ${border}`, borderRadius: 14,
            boxShadow: "0 16px 40px rgba(0,0,0,0.3)", overflow: "hidden", maxHeight: 360, overflowY: "auto",
          }}>
            {results.length === 0
              ? <div style={{ padding: 18, fontSize: "0.82rem", color: muted, textAlign: "center" }}>No articles match &quot;{query}&quot;.</div>
              : results.map(a => {
                  const cat = categories.find(c => c.id === a.categoryId);
                  return (
                    <div key={a.id} onClick={() => onOpenArticle(a.id)} style={{
                      padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                      borderBottom: `1px solid ${border}`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.05)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontSize: "1rem" }}>{cat?.icon || "📖"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: fg }}>{a.title}</div>
                        <div style={{ fontSize: "0.72rem", color: muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat?.label} · {a.shortDesc}</div>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>

      {/* Categories */}
      <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1.1rem", color: fg, marginBottom: 16 }}>Explore Categories</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 40 }}>
        {categories.map(cat => (
          <div key={cat.id} onClick={() => onOpenCategory(cat.id)} style={{
            background: dark ? "rgba(17,24,39,0.5)" : "#fff", border: `1px solid ${border}`, borderRadius: 16,
            padding: "18px 20px", cursor: "pointer", transition: "all 0.16s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${G}55`; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>{cat.icon}</div>
            <div style={{ fontWeight: 700, fontSize: "0.92rem", color: fg, marginBottom: 4 }}>{cat.label}</div>
            <div style={{ fontSize: "0.76rem", color: muted, lineHeight: 1.5 }}>{cat.desc}</div>
          </div>
        ))}
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1.1rem", color: fg, marginBottom: 16 }}>⭐ Featured This Week</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {featured.map(a => <WikiArticleCard key={a.id} article={a} categories={categories} dark={dark} onClick={() => onOpenArticle(a.id)} />)}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
        {/* Recently added */}
        <div>
          <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1.05rem", color: fg, marginBottom: 14 }}>🆕 Recently Added</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recent.map(a => (
              <div key={a.id} onClick={() => onOpenArticle(a.id)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${border}`, cursor: "pointer",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${G}55`}
              onMouseLeave={e => e.currentTarget.style.borderColor = border}>
                <span>{categories.find(c => c.id === a.categoryId)?.icon || "📖"}</span>
                <span style={{ fontSize: "0.83rem", color: fg, fontWeight: 600 }}>{a.title}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Popular */}
        <div>
          <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1.05rem", color: fg, marginBottom: 14 }}>🔥 Popular</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {popular.map(a => (
              <div key={a.id} onClick={() => onOpenArticle(a.id)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${border}`, cursor: "pointer",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${G}55`}
              onMouseLeave={e => e.currentTarget.style.borderColor = border}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>{categories.find(c => c.id === a.categoryId)?.icon || "📖"}</span>
                  <span style={{ fontSize: "0.83rem", color: fg, fontWeight: 600 }}>{a.title}</span>
                </div>
                <span style={{ fontSize: "0.7rem", color: muted }}>{(a.views || 0).toLocaleString()} views</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export {
  WikiHomeView,
};
