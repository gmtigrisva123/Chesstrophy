import { useState } from "react";
import { GameViewer } from "./GameViewer.jsx";
import { readJson, writeJson } from "../../lib/storage/jsonStore.js";

// ── COMMUNITY GAMES PAGE ─────────────────────────────────────
function CommunityGamesPage({ dark }) {
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#666"    : "#888";
  const card   = dark ? "#0f0f0f" : "#fff";
  const border = dark ? "#1e1e1e" : "#e8e8e8";
  const G      = "#2563EB";

  const STORAGE_KEY = "chessprophy_community_games";

  const loadGames = () => readJson(STORAGE_KEY, () => []);
  const [games, setGames] = useState(loadGames);
  const [showForm, setShowForm] = useState(false);
  const [viewGame, setViewGame] = useState(null);
  const [form, setForm] = useState({ player:"", opponent:"", rating:"", event:"", pgn:"", description:"" });
  const [saved, setSaved] = useState(false);

  const saveGames = (g) => { writeJson(STORAGE_KEY, g); };

  const submit = () => {
    if (!form.player || !form.pgn) return;
    const newGame = { ...form, id: Date.now(), ts: Date.now(), approved: true };
    const updated = [newGame, ...games];
    setGames(updated);
    saveGames(updated);
    setForm({ player:"", opponent:"", rating:"", event:"", pgn:"", description:"" });
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const deleteGame = (id) => {
    const updated = games.filter(g => g.id !== id);
    setGames(updated);
    saveGames(updated);
  };

  if (viewGame) {
    const gameObj = { white: viewGame.player, black: viewGame.opponent || "Opponent", wr: viewGame.rating ? Number(viewGame.rating) : null, br: null, event: viewGame.event || "Community Game", year: new Date(viewGame.ts).getFullYear(), result: "*", opening: "Community Submission", eco: "-", desc: viewGame.description || "Submitted by a ChessProphy member.", pgn: viewGame.pgn };
    return <GameViewer game={gameObj} onBack={() => setViewGame(null)} dark={dark} />;
  }

  return (
    <div>
      <style>{`@keyframes dashFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .cc-card:hover{border-color:#2563EB44!important} .cc-inp:focus{border-color:#2563EB!important;outline:none}`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12, animation: "dashFade 0.4s ease" }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: G, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Members</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, color: fg, letterSpacing: "-0.03em", marginBottom: 6 }}>Community Games</h2>
          <p style={{ fontSize: "0.85rem", color: muted }}>Share your games with the ChessProphy community.</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} style={{ background: showForm ? "transparent" : `linear-gradient(135deg,${G},#16a34a)`, border: `1px solid ${showForm ? border : "transparent"}`, borderRadius: 11, padding: "10px 20px", color: showForm ? muted : "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.15s" }}>
          {showForm ? "✕ Cancel" : "+ Submit Game"}
        </button>
      </div>

      {saved && <div style={{ background: `${G}15`, border: `1px solid ${G}33`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: G, fontWeight: 600, fontSize: "0.85rem", animation: "dashFade 0.3s ease" }}>✓ Game submitted successfully!</div>}

      {/* Submit form */}
      {showForm && (
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "24px 24px", marginBottom: 24, animation: "dashFade 0.3s ease" }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: fg, marginBottom: 20 }}>Submit Your Game</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 14 }}>
            {[
              { key: "player", label: "Your Name *", placeholder: "e.g. Magnus Carlsen" },
              { key: "opponent", label: "Opponent", placeholder: "e.g. Garry Kasparov" },
              { key: "rating", label: "Your Rating", placeholder: "e.g. 1850" },
              { key: "event", label: "Event / Tournament", placeholder: "e.g. Club Championship" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: "0.72rem", color: muted, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
                <input className="cc-inp" value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: "100%", background: dark ? "#141414" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", color: fg, fontSize: "0.85rem", fontFamily: "inherit", transition: "border 0.15s" }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="cg-pgn" style={{ display: "block", fontSize: "0.72rem", color: muted, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>PGN *</label>
            <textarea id="cg-pgn" className="cc-inp" value={form.pgn} onChange={e => setForm(v => ({ ...v, pgn: e.target.value }))} placeholder="Paste your game PGN here…" rows={4} style={{ width: "100%", background: dark ? "#141414" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", color: fg, fontSize: "0.82rem", fontFamily: "monospace", resize: "vertical", transition: "border 0.15s" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="cg-description" style={{ display: "block", fontSize: "0.72rem", color: muted, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
            <textarea id="cg-description" className="cc-inp" value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} placeholder="Tell us about this game — what happened, why it's interesting…" rows={2} style={{ width: "100%", background: dark ? "#141414" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", color: fg, fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", transition: "border 0.15s" }} />
          </div>
          <button onClick={submit} disabled={!form.player || !form.pgn} style={{ background: form.player && form.pgn ? `linear-gradient(135deg,${G},#16a34a)` : "#1a1a1a", border: "none", borderRadius: 11, padding: "11px 28px", color: form.player && form.pgn ? "#fff" : "#333", fontWeight: 700, fontSize: "0.88rem", cursor: form.player && form.pgn ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
            Submit Game
          </button>
        </div>
      )}

      {/* Games list */}
      {games.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: muted }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>♟</div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: fg, marginBottom: 8 }}>No games yet</div>
          <div style={{ fontSize: "0.85rem" }}>Be the first to submit a community game!</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
          {games.map(g => (
            <div key={g.id} className="cc-card" style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 20px", transition: "all 0.15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: fg }}>{g.player}</div>
                  {g.opponent && <div style={{ fontSize: "0.78rem", color: muted, marginTop: 2 }}>vs {g.opponent}</div>}
                </div>
                {g.rating && <span style={{ fontSize: "0.72rem", background: `${G}15`, color: G, border: `1px solid ${G}30`, borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>{g.rating}</span>}
              </div>
              {g.event && <div style={{ fontSize: "0.75rem", color: muted, marginBottom: 8 }}>🏆 {g.event}</div>}
              {g.description && <p style={{ fontSize: "0.8rem", color: muted, lineHeight: 1.5, marginBottom: 14, borderTop: `1px solid ${border}`, paddingTop: 10 }}>{g.description}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setViewGame(g)} style={{ flex: 1, background: `${G}15`, border: `1px solid ${G}33`, borderRadius: 9, padding: "8px 0", color: G, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>View Game →</button>
                <button onClick={() => deleteGame(g.id)} style={{ background: "transparent", border: "1px solid #1e1e1e", borderRadius: 9, padding: "8px 12px", color: "#555", fontSize: "0.78rem", cursor: "pointer" }} title="Delete" onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef4444"; }} onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#1e1e1e"; }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export {
  CommunityGamesPage,
};
