import { loadAdminData } from "../../services/adminData.js";

// ── APP ───────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// ── PUBLIC LANDING PAGE ──────────────────────────────────────────────────────
// Reads the site's content store (homepage config, site-identity, hero,
// footer, social fields) — that data model and this read path are unchanged;
// there's just no Admin Portal left to edit any of it anymore.
// ══════════════════════════════════════════════════════════════════════════════
function LandingPage({ onEnter }) {
  const ad = loadAdminData();
  const s = ad.settings || {};
  const hp = ad.homepage || {};
  const siteName = s.siteName || "ChessProphy";
  const tagline = s.tagline || "AI-Powered Chess Learning Platform";
  const heroTitle = s.heroTitle || "Master Chess with AI-Powered Learning";
  const heroSubtitle = s.heroSubtitle || "Personalized training, daily puzzles, and an AI coach — all in one place.";
  const heroCta = s.heroCtaLabel || "Start Learning Free";
  const G = s.primaryColor || "#2563EB";
  const GOLD = s.accentColor || "#C9A84C";
  const features = hp.features || [];
  const stats = hp.stats || [];
  const testimonials = hp.testimonials || [];
  const socials = [
    { label: "Discord", url: s.discordUrl, icon: "💬" },
    { label: "YouTube", url: s.youtubeUrl, icon: "▶" },
    { label: "Twitch", url: s.twitchUrl, icon: "🎮" },
    { label: "X", url: s.twitterUrl, icon: "𝕏" },
    { label: "GitHub", url: s.githubUrl, icon: "💻" },
    { label: "Lichess", url: s.lichessUrl, icon: "♞" },
    { label: "Chess.com", url: s.chessdotcomUrl, icon: "♟" },
  ].filter(x => x.url);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif" }}>
      <style>{`
        .lp-fade { animation: lpFade 0.6s ease both; }
        @keyframes lpFade { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .lp-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px ${G}55; }
        .lp-feature:hover { transform: translateY(-4px); border-color: ${G}55; }
        .lp-nav-link:hover { color: #fff; }
      `}</style>

      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px clamp(20px,5vw,64px)", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: "1.3rem", fontWeight: 700 }}>
          {s.logoUrl ? <img src={s.logoUrl} alt={siteName} style={{ height: 30 }} /> : <>Chess<span style={{ color: GOLD }}>{siteName.replace(/^Chess/i, "") || "Prophy"}</span></>}
        </div>
        <button className="lp-cta" onClick={onEnter} style={{
          padding: "9px 20px", borderRadius: 10, border: "none",
          background: `linear-gradient(135deg,${G},${G}cc)`, color: "#fff",
          fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s",
        }}>Enter App →</button>
      </div>

      {/* Hero */}
      <div className="lp-fade" style={{ textAlign: "center", padding: "70px clamp(20px,5vw,64px) 90px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>{tagline}</div>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(2.1rem,5vw,3.4rem)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 22 }}>
          {heroTitle}
        </h1>
        <p style={{ fontSize: "1.05rem", color: "#999", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 34px" }}>{heroSubtitle}</p>
        <button className="lp-cta" onClick={onEnter} style={{
          padding: "15px 34px", borderRadius: 13, border: "none",
          background: `linear-gradient(135deg,${G},${G}cc)`, color: "#fff",
          fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.2s",
          boxShadow: `0 6px 24px ${G}33`,
        }}>{heroCta}</button>
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="lp-fade" style={{ borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", padding: "36px clamp(20px,5vw,64px)" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(28px,6vw,72px)", flexWrap: "wrap", maxWidth: 1000, margin: "0 auto" }}>
            {stats.map(st => (
              <div key={st.id} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "1.8rem", fontWeight: 700, color: GOLD }}>{st.value}</div>
                <div style={{ fontSize: "0.76rem", color: "#888", marginTop: 4 }}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div className="lp-fade" style={{ padding: "80px clamp(20px,5vw,64px)", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "1.9rem", fontWeight: 700, marginBottom: 12 }}>Everything you need to improve</h2>
            <p style={{ color: "#888", fontSize: "0.95rem" }}>Built for players who want to actually get better, not just play.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {features.map(f => (
              <div key={f.id} className="lp-feature" style={{
                background: "#111", border: "1px solid #1f1f1f", borderRadius: 18, padding: 28, transition: "all 0.2s",
              }}>
                <div style={{ fontSize: "1.7rem", marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "1.02rem", marginBottom: 10 }}>{f.title}</div>
                <div style={{ fontSize: "0.85rem", color: "#999", lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <div className="lp-fade" style={{ background: "#0d0d0d", padding: "80px clamp(20px,5vw,64px)", borderTop: "1px solid #1a1a1a" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "1.7rem", fontWeight: 700, textAlign: "center", marginBottom: 40 }}>What players are saying</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              {testimonials.map(t => (
                <div key={t.id} style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 26 }}>
                  <div style={{ fontSize: "1.3rem", color: GOLD, marginBottom: 12 }}>&quot;</div>
                  <p style={{ fontSize: "0.9rem", color: "#ddd", lineHeight: 1.7, marginBottom: 16, fontStyle: "italic" }}>{t.quote}</p>
                  <div style={{ fontSize: "0.78rem", color: "#888", fontWeight: 600 }}>{t.author}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Final CTA */}
      <div className="lp-fade" style={{ textAlign: "center", padding: "80px clamp(20px,5vw,64px)" }}>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: "1.8rem", fontWeight: 700, marginBottom: 18 }}>Ready to start improving?</h2>
        <button className="lp-cta" onClick={onEnter} style={{
          padding: "14px 32px", borderRadius: 12, border: "none",
          background: `linear-gradient(135deg,${G},${G}cc)`, color: "#fff",
          fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s",
        }}>{heroCta}</button>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1a1a1a", padding: "28px clamp(20px,5vw,64px)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div style={{ fontSize: "0.76rem", color: "#666" }}>{s.footerText || `© ${new Date().getFullYear()} ${siteName} · Free chess education for everyone.`}</div>
        {socials.length > 0 && (
          <div style={{ display: "flex", gap: 14 }}>
            {socials.map(so => (
              <a key={so.label} href={so.url} target="_blank" rel="noopener noreferrer" className="lp-nav-link" style={{ color: "#666", fontSize: "0.85rem", textDecoration: "none", transition: "color 0.15s" }} title={so.label}>{so.icon}</a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export {
  LandingPage,
};
