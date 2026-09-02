import { useState } from "react";
import { GameViewer } from "./GameViewer.jsx";
import { ALL_GAMES } from "../../data/classicGames.js";

// ── CLASSIC GAMES PAGE ───────────────────────────────────────
function ClassicGamesPage({ dark }) {
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#666"    : "#888";
  const card   = dark ? "#0f0f0f" : "#fff";
  const border = dark ? "#1e1e1e" : "#e8e8e8";
  const G      = "#2563EB";

  const [viewGame, setViewGame] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPlayer, setFilterPlayer] = useState("All");

  const players = ["All", "Kasparov", "Fischer", "Carlsen", "Tal", "Capablanca", "Karpov", "Kramnik", "Anand", "Nakamura"];

  const filtered = ALL_GAMES.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.white.toLowerCase().includes(q) || g.black.toLowerCase().includes(q) || g.event.toLowerCase().includes(q) || g.opening.toLowerCase().includes(q) || String(g.year).includes(q);
    const matchPlayer = filterPlayer === "All" || g.white.includes(filterPlayer) || g.black.includes(filterPlayer);
    return matchSearch && matchPlayer;
  });

  if (viewGame) return <GameViewer game={viewGame} onBack={() => setViewGame(null)} dark={dark} />;

  return (
    <div>
      <style>{`@keyframes dashFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .cg-card:hover{border-color:#2563EB55!important;transform:translateY(-2px);box-shadow:0 8px 28px #00000033!important} .cg-btn:hover{background:#2563EB!important;color:#fff!important;border-color:#2563EB!important}`}</style>

      <div style={{ marginBottom: 32, animation: "dashFade 0.4s ease" }}>
        <div style={{ fontSize: "0.7rem", color: G, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Database</div>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: fg, letterSpacing: "-0.03em", marginBottom: 6 }}>Classic Games</h2>
        <p style={{ fontSize: "0.88rem", color: muted }}>Explore {ALL_GAMES.length} legendary games from the greatest players in history.</p>
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search player, event, opening…" style={{ flex: 1, minWidth: 200, background: card, border: `1px solid ${border}`, borderRadius: 11, padding: "10px 14px", color: fg, fontSize: "0.85rem", outline: "none", fontFamily: "inherit", transition: "border 0.15s" }}
          onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = border} />
        <select value={filterPlayer} onChange={e => setFilterPlayer(e.target.value)} style={{ background: card, border: `1px solid ${border}`, borderRadius: 11, padding: "10px 14px", color: fg, fontSize: "0.85rem", outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
          {players.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Count */}
      <div style={{ fontSize: "0.75rem", color: muted, marginBottom: 16 }}>{filtered.length} game{filtered.length !== 1 ? "s" : ""} found</div>

      {/* Game cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
        {filtered.map(g => {
          const resultColor = g.result === "1-0" ? G : g.result === "0-1" ? "#ef4444" : "#888";
          return (
            <div key={g.id} className="cg-card" style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 20px", cursor: "pointer", transition: "all 0.18s" }} onClick={() => setViewGame(g)}>
              {/* Top: ECO + year + result */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontSize: "0.68rem", background: `${G}15`, color: G, border: `1px solid ${G}30`, borderRadius: 6, padding: "2px 7px", fontWeight: 700 }}>{g.eco}</span>
                  <span style={{ fontSize: "0.68rem", color: muted, background: dark ? "#1a1a1a" : "#f0f0f0", borderRadius: 6, padding: "2px 7px" }}>{g.year}</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: "0.82rem", color: resultColor }}>{g.result}</span>
              </div>

              {/* Players */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: fg }}>{g.white}</span>
                  {g.wr && <span style={{ fontSize: "0.72rem", color: muted }}>{g.wr}</span>}
                </div>
                <div style={{ fontSize: "0.68rem", color: muted, marginBottom: 6, textAlign: "center", letterSpacing: "0.05em" }}>vs</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: fg }}>{g.black}</span>
                  {g.br && <span style={{ fontSize: "0.72rem", color: muted }}>{g.br}</span>}
                </div>
              </div>

              {/* Event + opening */}
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 2 }}>{g.event}</div>
                  <div style={{ fontSize: "0.72rem", color: muted, fontStyle: "italic" }}>{g.opening}</div>
                </div>
                <button className="cg-btn" style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 9, padding: "7px 14px", color: muted, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0 }}>
                  Open →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export {
  ClassicGamesPage,
};
