import { useState, useMemo } from "react";
import { ChessFlixCard } from "./ChessFlixCard.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { loadChessFlixContent } from "../../services/chessflix.js";

function ChessFlixList({ dark, canPost, onOpenContent, onPost, onExitStudio, refreshKey }) {
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#888"    : "#666";
  const border = dark ? "#1f1f1f" : "#e8e8e8";
  const RED = "#ef4444";

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  // `refreshKey` is a deliberate cache-buster, not a value this reads: the parent
  // bumps it after a post so the list re-queries storage. ESLint sees an unused
  // dependency; removing it would make new posts invisible until remount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const all = useMemo(() => loadChessFlixContent().filter(c => c.status === "published"), [refreshKey]);
  const categories = ["All", ...Array.from(new Set(all.map(c => c.category).filter(Boolean)))];
  const featured = all.find(c => c.featured);

  const q = query.trim().toLowerCase();
  const filtered = all.filter(c => {
    const matchQ = !q || c.title.toLowerCase().includes(q) || (c.desc||"").toLowerCase().includes(q) || (c.creatorName||"").toLowerCase().includes(q) || (c.category||"").toLowerCase().includes(q);
    const matchCat = cat === "All" || c.category === cat;
    return matchQ && matchCat;
  });
  const grid = filtered.filter(c => c.id !== featured?.id || q || cat !== "All");

  return (
    <div className="cf-fade-in">
      <style>{`.cf-fade-in{animation:cfFadeIn 0.25s ease} @keyframes cfFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} .cfx-card:hover{transform:translateY(-3px);border-color:${RED}55 !important}`}</style>
      <button onClick={onExitStudio} style={{ background: "transparent", border: "none", color: muted, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", marginBottom: 18 }}>← Back to Prophy Studio</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Prophy Studio</div>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: fg, fontFamily: "Georgia,serif", marginBottom: 4 }}>ChessFlix</h1>
          <div style={{ fontSize: "0.88rem", color: muted }}>Watch. Discover. Share Chess.</div>
        </div>
        {canPost && (
          <button onClick={onPost} style={{
            padding: "11px 22px", borderRadius: 11, border: "none",
            background: `linear-gradient(135deg,${RED},#dc2626)`, color: "#fff", fontWeight: 800,
            fontSize: "0.85rem", cursor: "pointer", boxShadow: `0 4px 16px ${RED}33`,
          }}>+ Post Content</button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: "0.9rem", opacity: 0.5 }}>🔍</span>
        <input
          value={query} onChange={e => setQuery(e.target.value)} placeholder="Search ChessFlix..."
          style={{
            width: "100%", padding: "13px 16px 13px 42px", borderRadius: 13, border: `1px solid ${border}`,
            background: dark ? "#111" : "#f7f7f7", color: fg, fontSize: "0.88rem", fontFamily: "inherit",
          }}
        />
      </div>

      {/* Categories */}
      {categories.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: "7px 16px", borderRadius: 9, border: `1px solid ${cat === c ? RED : border}`,
              background: cat === c ? `${RED}15` : "transparent", color: cat === c ? RED : muted,
              fontWeight: 700, fontSize: "0.76rem", cursor: "pointer",
            }}>{c}</button>
          ))}
        </div>
      )}

      {/* Featured */}
      {featured && !q && cat === "All" && (
        <div onClick={() => onOpenContent(featured.id)} style={{
          position: "relative", borderRadius: 20, overflow: "hidden", cursor: "pointer", marginBottom: 28,
          height: 260, background: featured.type === "image" ? `url(${featured.mediaUrl}) center/cover` : `linear-gradient(135deg,#1a0a0a,#0d0d0d)`,
        }}>
          {featured.type === "video" && (
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${RED}22,transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "2px solid #fff8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff" }}>▶</div>
            </div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.85), transparent 60%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 24 }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#fbbf24", background: "#000a", borderRadius: 6, padding: "3px 10px", letterSpacing: "0.05em" }}>⭐ FEATURED</span>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginTop: 10, fontFamily: "Georgia,serif" }}>{featured.title}</div>
            <div style={{ fontSize: "0.78rem", color: "#ddd", marginTop: 6 }}>👁 {(featured.views||0).toLocaleString()} views · By {featured.creatorName}</div>
          </div>
        </div>
      )}

      {/* Grid */}
      {grid.length === 0 ? (
        <EmptyState icon="🎬" title="No ChessFlix content found." sub="Try searching for another topic." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {grid.map(c => <ChessFlixCard key={c.id} c={c} dark={dark} onClick={() => onOpenContent(c.id)} />)}
        </div>
      )}
    </div>
  );
}

export {
  ChessFlixList,
};
