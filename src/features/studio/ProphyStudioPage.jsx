import { useState } from "react";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { ChessFlixApp } from "../chessflix/ChessFlixApp.jsx";

// ══════════════════════════════════════════════════════════════════════════════
// ── PROPHY STUDIO ───────────────────────────────────────────────────────────
// A modular hub under Economy for content-platform features. ChessFlix is the
// first; more feature cards can be added to FEATURES below without touching
// the surrounding page — Prophy Studio itself never hard-codes ChessFlix.
// ══════════════════════════════════════════════════════════════════════════════
// ── PROPHY STUDIO — COMING SOON GATE ────────────────────────────────────────
// The whole Prophy Studio channel is temporarily closed to visitors. This
// placeholder replaces ProphyStudioPage at the router level (see renderPage's
// "ProphyStudio" case below) so the channel cannot be opened from any entry
// point, without touching ProphyStudioPage/ChessFlixApp — flip the router
// case back to <ProphyStudioPage .../> to reopen it later.
function ProphyStudioComingSoon({ dark, setActive }) {
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#888"    : "#666";
  const card   = dark ? "#111"    : "#fff";
  const border = dark ? "#1f1f1f" : "#e8e8e8";
  const G = "#C9A84C";

  return (
    <div>
      <SectionHeader dark={dark} eyebrow="Economy" title="Prophy Studio" sub="A growing set of content and creator tools, built into ChessProphy." />
      <div style={{
        background: card, border: `1px solid ${border}`, borderRadius: 18,
        padding: "56px 32px", textAlign: "center", maxWidth: 560, margin: "0 auto",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, background: `${G}18`, border: `1px solid ${G}33`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
          margin: "0 auto 20px",
        }}>🎬</div>
        <div style={{
          display: "inline-block", fontSize: "0.68rem", fontWeight: 700, color: G,
          background: `${G}18`, border: `1px solid ${G}33`, borderRadius: 999,
          padding: "4px 12px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14,
        }}>Coming Soon</div>
        <div style={{ fontWeight: 800, fontSize: "1.2rem", color: fg, marginBottom: 10 }}>Prophy Studio isn&apos;t open yet</div>
        <div style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.7, marginBottom: 24 }}>
          ChessFlix and the rest of Prophy Studio&apos;s content tools are being polished up. Check back soon.
        </div>
        <button
          onClick={() => setActive("Home")}
          style={{
            background: "transparent", border: `1px solid ${border}`, color: fg,
            fontSize: "0.82rem", fontWeight: 700, borderRadius: 10, padding: "10px 20px", cursor: "pointer",
          }}
        >← Back to Dashboard</button>
      </div>
    </div>
  );
}

function ProphyStudioPage({ dark }) {
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#888"    : "#666";
  const card   = dark ? "#111"    : "#fff";
  const border = dark ? "#1f1f1f" : "#e8e8e8";

  const [feature, setFeature] = useState(null); // null = grid, else feature id

  const FEATURES = [
    { id: "chessflix", icon: "🎬", title: "ChessFlix", desc: "A platform for posting and discovering chess content.", live: true, color: "#ef4444" },
    { id: "soon1", icon: "🎙️", title: "Prophy Radio", desc: "Chess talk shows and podcasts. Coming soon.", live: false, color: "#a78bfa" },
    { id: "soon2", icon: "📸", title: "Prophy Snaps", desc: "Share puzzle screenshots and game moments. Coming soon.", live: false, color: "#60a5fa" },
  ];

  if (feature === "chessflix") {
    return <ChessFlixApp dark={dark} onExitStudio={() => setFeature(null)} />;
  }

  return (
    <div>
      <style>{`.cf-fade-in{animation:cfFadeIn 0.25s ease} @keyframes cfFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} .ps-card:hover{transform:translateY(-3px)}`}</style>
      <SectionHeader dark={dark} eyebrow="Economy" title="Prophy Studio" sub="A growing set of content and creator tools, built into ChessProphy." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
        {FEATURES.map(f => (
          <div
            key={f.id}
            className="ps-card"
            onClick={() => f.live && setFeature(f.id)}
            style={{
              background: card, border: `1px solid ${f.live ? f.color + "44" : border}`, borderRadius: 18,
              padding: 26, cursor: f.live ? "pointer" : "default", transition: "transform 0.18s",
              opacity: f.live ? 1 : 0.6, position: "relative", overflow: "hidden",
            }}>
            {!f.live && <div style={{ position: "absolute", top: 14, right: 14, fontSize: "0.6rem", fontWeight: 700, color: muted, background: dark ? "#1a1a1a" : "#f0f0f0", borderRadius: 6, padding: "3px 9px" }}>SOON</div>}
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.color}18`, border: `1px solid ${f.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>{f.icon}</div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: fg, marginBottom: 8 }}>{f.title}</div>
            <div style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.6, marginBottom: f.live ? 16 : 0 }}>{f.desc}</div>
            {f.live && <span style={{ fontSize: "0.78rem", fontWeight: 700, color: f.color }}>Open ChessFlix →</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  ProphyStudioPage,
  ProphyStudioComingSoon,
};
