import { useMemo } from "react";
import { Badge, Btn, Card, SectionTitle, Stat } from "./AdminUI.jsx";
import { fmtDate } from "./adminUtils.js";
import { loadAuditLog } from "../../services/adminAudit.js";
import { getAdminSession } from "../../services/adminAuth.js";
import { contentStats } from "../../services/adminContent.js";

// ── Overview: live numbers from the content store + the latest admin activity ──
function AdminOverview({ t, go, version }) {
  const stats = useMemo(() => contentStats(), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const audit = useMemo(() => loadAuditLog().slice(0, 8), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const session = getAdminSession();

  const attention = [
    stats.chessflix.pending > 0 && { label: `${stats.chessflix.pending} ChessFlix post${stats.chessflix.pending === 1 ? "" : "s"} awaiting review`, go: "moderation", color: t.AMBER },
    stats.maintenance && { label: "Maintenance mode is ON — visitors see the offline screen", go: "settings", color: t.RED },
    stats.events.upcoming === 0 && { label: "No upcoming events — the dashboard shows an empty state", go: "events", color: t.muted },
    stats.news.published === 0 && { label: "No published news — the Updates strip is empty", go: "news", color: t.muted },
  ].filter(Boolean);

  return (
    <div>
      <SectionTitle t={t} title="Overview" sub={`Signed in as ${session?.actor || "admin"} · ${session?.mode === "remote" ? "Supabase roles" : "local passcode"} · ${session?.role}`} />

      {attention.length > 0 && (
        <Card t={t} style={{ marginBottom: 18, borderColor: `${t.AMBER}44` }} pad={16}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: t.AMBER, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Needs attention</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {attention.map(a => (
              <button key={a.label} onClick={() => go(a.go)} style={{ display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", padding: 0, cursor: "pointer", color: t.fg, fontSize: "0.82rem", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }} />{a.label}<span style={{ color: t.G_LT, marginLeft: "auto" }}>Open →</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 22 }}>
        <Stat t={t} label="News" value={stats.news.published} sub={`${stats.news.total} total`} color={t.G_LT} onClick={() => go("news")} />
        <Stat t={t} label="Upcoming events" value={stats.events.upcoming} sub={`${stats.events.total} total`} color={t.GOLD} onClick={() => go("events")} />
        <Stat t={t} label="Active announcements" value={stats.announcements.active} sub={`${stats.announcements.total} total`} onClick={() => go("announcements")} />
        <Stat t={t} label="Puzzles" value={stats.puzzles.builtIn + stats.puzzles.custom} sub={`${stats.puzzles.custom} custom`} color={t.PURPLE} onClick={() => go("puzzlesAdmin")} />
        <Stat t={t} label="Store items live" value={stats.storeItems.live} sub={`${stats.storeItems.total} total`} color={t.GOLD} onClick={() => go("storeItems")} />
        <Stat t={t} label="Wiki articles" value={stats.wiki.published} sub={`${stats.wiki.categories} categories`} onClick={() => go("wikiArticles")} />
        <Stat t={t} label="ChessFlix pending" value={stats.chessflix.pending} sub={`${stats.chessflix.published} published`} color={stats.chessflix.pending ? t.AMBER : undefined} onClick={() => go("moderation")} />
        <Stat t={t} label="Community games" value={stats.communityGames} onClick={() => go("moderation")} />
      </div>

      <div className="admin-two-col" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card t={t}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: t.fg }}>Recent activity</div>
            <Btn t={t} size="sm" onClick={() => go("audit")}>Full log →</Btn>
          </div>
          {audit.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: t.muted }}>No admin actions recorded yet. Every change you make here is logged with who, when and what.</div>
          ) : audit.map(e => (
            <div key={e.id} style={{ display: "flex", gap: 10, padding: "9px 0", borderTop: `1px solid ${t.border}`, fontSize: "0.78rem" }}>
              <span style={{ color: t.faint, whiteSpace: "nowrap", fontFamily: "monospace", fontSize: "0.68rem", paddingTop: 2 }}>{fmtDate(e.ts)}</span>
              <span style={{ color: t.fg, flex: 1 }}>{e.summary}</span>
              <Badge t={t}>{e.action.split(".")[1] || e.action}</Badge>
            </div>
          ))}
        </Card>

        <Card t={t}>
          <div style={{ fontWeight: 800, fontSize: "0.9rem", color: t.fg, marginBottom: 12 }}>This device&apos;s learner</div>
          <div style={{ fontSize: "0.76rem", color: t.muted, lineHeight: 1.6, marginBottom: 12 }}>The app is local-first: progress is stored per browser. These are the real numbers for the learner profile on this device.</div>
          {[
            ["Username", stats.learner.username],
            ["ProphyCoins", `🪙 ${stats.learner.coins.toLocaleString()}`],
            ["XP", stats.learner.xp.toLocaleString()],
            ["Puzzles attempted", stats.learner.puzzlesSolved],
            ["Ledger entries", stats.learner.transactions],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${t.border}`, fontSize: "0.78rem" }}>
              <span style={{ color: t.muted }}>{k}</span><span style={{ color: t.fg, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 12 }}><Btn t={t} size="sm" onClick={() => go("users")}>Manage learner →</Btn></div>
        </Card>
      </div>
    </div>
  );
}

export {
  AdminOverview,
};
