import { useEffect, useMemo, useState } from "react";
import { AdminAuditLog } from "./AdminAuditLog.jsx";
import { AdminDataTools } from "./AdminDataTools.jsx";
import { AdminEconomy } from "./AdminEconomy.jsx";
import { AdminLogin } from "./AdminLogin.jsx";
import { AdminModeration } from "./AdminModeration.jsx";
import { AdminOverview } from "./AdminOverview.jsx";
import { COLLECTIONS, recordTitle } from "./adminSchemas.js";
import { AdminSiteSettings } from "./AdminSiteSettings.jsx";
import { Badge, Btn, ToastHost } from "./AdminUI.jsx";
import { AdminUsers } from "./AdminUsers.jsx";
import { adminTheme, inputStyle, useToasts } from "./adminUtils.js";
import { CollectionManager } from "./CollectionManager.jsx";
import { subscribeAdminDataChanged } from "../../lib/storage/adminDataEvents.js";
import { adminAuthMode, getAdminSession, restoreRemoteAdminSession, signOutAdmin, subscribeAdminSession } from "../../services/adminAuth.js";
import { contentStats } from "../../services/adminContent.js";
import { loadAdminData } from "../../services/adminData.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── ADMIN PANEL SHELL ─────────────────────────────────────────────────────────
// Reached at #/admin (and #/admin/<section>). Own sidebar, command palette
// (⌘K), toasts, and a session gate — nothing here is reachable without an
// admin session, and in remote mode the database refuses writes regardless.
// ══════════════════════════════════════════════════════════════════════════════

const NAV = [
  { group: "Overview", items: [{ id: "overview", icon: "◎", label: "Overview" }] },
  { group: "Content", items: [
    { id: "news", icon: "📰", label: "News" }, { id: "events", icon: "📅", label: "Events" }, { id: "announcements", icon: "📢", label: "Announcements" },
    { id: "puzzlesAdmin", icon: "🧩", label: "Puzzles" }, { id: "storeItems", icon: "🪙", label: "Store" }, { id: "studies", icon: "✍️", label: "Studies" },
    { id: "courses", icon: "🎓", label: "Courses" }, { id: "openings", icon: "♔", label: "Openings" }, { id: "lessons", icon: "📖", label: "Lessons" },
    { id: "resources", icon: "🔗", label: "Resources" }, { id: "questionCards", icon: "🧠", label: "Placement quiz" },
  ] },
  { group: "Wiki", items: [{ id: "wikiArticles", icon: "📚", label: "Articles" }, { id: "wikiCategories", icon: "🗂️", label: "Categories" }] },
  { group: "Community", items: [{ id: "moderation", icon: "🛡️", label: "Moderation" }, { id: "users", icon: "👥", label: "Users" }] },
  { group: "Site", items: [{ id: "settings", icon: "⚙️", label: "Site settings" }, { id: "economy", icon: "💱", label: "Economy" }] },
  { group: "System", items: [{ id: "audit", icon: "🗒️", label: "Activity log" }, { id: "data", icon: "🗄️", label: "Data & security" }] },
];
const ALL_ITEMS = NAV.flatMap(g => g.items);

function sectionFromHash() {
  const m = (typeof window !== "undefined" ? window.location.hash : "").match(/^#\/admin\/?([^/?]*)/);
  const id = m?.[1];
  return ALL_ITEMS.some(i => i.id === id) ? id : "overview";
}

// ── ⌘K command palette: jump to a section, create a record, or open one ──────
function CommandPalette({ t, open, onClose, go, version }) {
  const [q, setQ] = useState("");
  useEffect(() => { if (open) setQ(""); }, [open]);
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const sections = ALL_ITEMS.map(i => ({ kind: "Section", label: i.label, icon: i.icon, run: () => go(i.id) }));
    const creates = Object.values(COLLECTIONS).map(s => ({ kind: "Create", label: `New ${s.label.toLowerCase()}`, icon: "＋", run: () => go(s.key, { create: true }) }));
    const data = loadAdminData();
    const records = needle.length < 2 ? [] : Object.values(COLLECTIONS).flatMap(s => (data[s.key] || []).map(r => ({ kind: s.plural, label: recordTitle(s, r), icon: s.icon, run: () => go(s.key === "chessflixContent" ? "moderation" : s.key, { edit: r.id }) })));
    const all = [...sections, ...creates, ...records];
    return (needle ? all.filter(x => `${x.kind} ${x.label}`.toLowerCase().includes(needle)) : all.slice(0, 12)).slice(0, 14);
  }, [q, go, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [q]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9350, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "12vh" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(2,6,16,0.6)", backdropFilter: "blur(4px)" }} />
      <div role="dialog" aria-modal="true" aria-label="Command palette" style={{ position: "relative", width: 560, maxWidth: "92vw", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,0.55)", overflow: "hidden", animation: "adminFade 0.15s ease" }}>
        {/* eslint-disable-next-line jsx-a11y/no-autofocus -- the palette exists to type into */}
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Jump to a section, create a record, or search content…" style={{ ...inputStyle(t, { border: "none", borderRadius: 0, padding: "16px 18px", fontSize: "0.95rem", background: "transparent" }) }}
          onKeyDown={e => {
            if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(results.length - 1, i + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
            if (e.key === "Enter" && results[idx]) { results[idx].run(); onClose(); }
            if (e.key === "Escape") onClose();
          }} />
        <div style={{ borderTop: `1px solid ${t.border}`, maxHeight: 380, overflowY: "auto" }}>
          {results.length === 0 && <div style={{ padding: 18, fontSize: "0.8rem", color: t.muted }}>No matches.</div>}
          {results.map((r, i) => (
            <button key={`${r.kind}-${r.label}-${i}`} onClick={() => { r.run(); onClose(); }} onMouseEnter={() => setIdx(i)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: i === idx ? `${t.G}1f` : "transparent", border: "none", padding: "10px 18px", cursor: "pointer", color: t.fg, fontFamily: "inherit" }}>
              <span style={{ width: 22, textAlign: "center" }}>{r.icon}</span>
              <span style={{ flex: 1, fontSize: "0.84rem", fontWeight: 600 }}>{r.label}</span>
              <span style={{ fontSize: "0.64rem", color: t.faint, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.kind}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: "8px 18px", borderTop: `1px solid ${t.border}`, fontSize: "0.66rem", color: t.faint }}>↑↓ navigate · Enter open · Esc close</div>
      </div>
    </div>
  );
}

function AdminApp({ dark, setThemeMode }) {
  const t = adminTheme(dark);
  const [session, setSession] = useState(() => getAdminSession());
  const [restoring, setRestoring] = useState(() => !getAdminSession() && adminAuthMode() === "remote");
  const [section, setSection] = useState(sectionFromHash);
  const [intent, setIntent] = useState(null); // { create } | { edit }
  const [palette, setPalette] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const bump = () => setVersion(v => v + 1);
  const { toasts, push, dismiss } = useToasts();

  useEffect(() => subscribeAdminSession(() => setSession(getAdminSession())), []);
  useEffect(() => subscribeAdminDataChanged(bump), []);
  useEffect(() => {
    if (!restoring) return;
    restoreRemoteAdminSession().finally(() => { setSession(getAdminSession()); setRestoring(false); });
  }, [restoring]);
  useEffect(() => {
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(p => !p); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (id, opts = null) => { window.location.hash = `#/admin/${id}`; setSection(id); setIntent(opts); setNavOpen(false); };
  const exitToSite = () => { window.location.hash = ""; };

  if (restoring) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: t.bg, color: t.muted, fontSize: "0.85rem" }}>Checking your admin session…</div>;
  }
  if (!session) {
    return <><style>{ADMIN_CSS}</style><AdminLogin t={t} onSignedIn={() => setSession(getAdminSession())} onExit={exitToSite} /></>;
  }

  const stats = contentStats();
  const badgeFor = (id) => (id === "moderation" && stats.chessflix.pending ? stats.chessflix.pending : null);

  const renderSection = () => {
    if (COLLECTIONS[section]) return <CollectionManager key={`${section}-${intent?.edit || ""}-${intent?.create ? version : ""}`} t={t} schema={COLLECTIONS[section]} toast={push} initialEditId={intent?.edit || null} initialCreate={!!intent?.create} />;
    switch (section) {
      case "moderation": return <AdminModeration t={t} toast={push} version={version} bump={bump} />;
      case "users":      return <AdminUsers t={t} toast={push} version={version} bump={bump} />;
      case "settings":   return <AdminSiteSettings t={t} toast={push} version={version} bump={bump} />;
      case "economy":    return <AdminEconomy t={t} toast={push} version={version} bump={bump} />;
      case "audit":      return <AdminAuditLog t={t} toast={push} version={version} bump={bump} />;
      case "data":       return <AdminDataTools t={t} toast={push} bump={bump} />;
      default:           return <AdminOverview t={t} go={go} version={version} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.fg, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif" }}>
      <style>{ADMIN_CSS}</style>

      {/* Sidebar */}
      <aside className={`admin-nav${navOpen ? " open" : ""}`} style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 236, background: t.panel, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", zIndex: 300 }}>
        <div style={{ height: 60, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg,${t.G},${t.G_LT})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 15, boxShadow: `0 3px 10px ${t.G}55` }}>♞</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "0.92rem" }}>Chess<span style={{ color: t.G_LT }}>Prophy</span></div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: t.faint, textTransform: "uppercase", letterSpacing: "0.12em" }}>Admin</div>
          </div>
        </div>
        <nav style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
          {NAV.map(g => (
            <div key={g.group} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: t.faint, textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 20px 6px" }}>{g.group}</div>
              {g.items.map(item => {
                const active = section === item.id;
                const badge = badgeFor(item.id);
                return (
                  <button key={item.id} onClick={() => go(item.id)} aria-current={active ? "page" : undefined} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", padding: "9px 18px 9px 17px", background: active ? `${t.G}18` : "transparent", border: "none", borderLeft: `3px solid ${active ? t.G_LT : "transparent"}`, color: active ? t.G_LT : t.muted, fontWeight: active ? 700 : 500, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = t.fg; }} onMouseLeave={e => { if (!active) e.currentTarget.style.color = t.muted; }}>
                    <span style={{ width: 18, textAlign: "center", fontSize: 14 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {badge && <span style={{ fontSize: "0.62rem", fontWeight: 800, background: t.AMBER, color: "#0a0a0a", borderRadius: 999, padding: "1px 7px" }}>{badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding: 14, borderTop: `1px solid ${t.border}`, fontSize: "0.72rem", color: t.muted }}>
          <div style={{ fontWeight: 700, color: t.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.actor}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}><Badge t={t} color={session.mode === "remote" ? t.GREEN : t.AMBER}>{session.mode === "remote" ? "supabase" : "local"}</Badge><Badge t={t}>{session.role}</Badge></div>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main" style={{ paddingLeft: 236, minHeight: "100vh" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 250, height: 60, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", background: t.dark ? "rgba(7,10,18,0.85)" : "rgba(244,246,251,0.85)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${t.border}` }}>
          <button className="admin-burger" onClick={() => setNavOpen(o => !o)} aria-label="Toggle navigation" style={{ display: "none", background: "transparent", border: `1px solid ${t.border}`, borderRadius: 8, color: t.fg, padding: "6px 10px", cursor: "pointer" }}>☰</button>
          <button onClick={() => setPalette(true)} style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 160px", minWidth: 0, maxWidth: 420, background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: "8px 12px", color: t.muted, fontSize: "0.78rem", cursor: "text", textAlign: "left", fontFamily: "inherit" }}>
            <span>🔍</span><span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Search or jump to…</span><kbd className="admin-hide-mobile" style={{ fontSize: "0.62rem", border: `1px solid ${t.border}`, borderRadius: 5, padding: "1px 6px", color: t.faint }}>⌘K</kbd>
          </button>
          <div style={{ flex: "1 0 0" }} />
          {stats.maintenance && <Badge t={t} color={t.RED}>Maintenance ON</Badge>}
          {setThemeMode && <Btn t={t} size="sm" onClick={() => setThemeMode(dark ? "light" : "dark")} title="Toggle theme">{dark ? "☀️" : "🌙"}</Btn>}
          <Btn t={t} size="sm" onClick={exitToSite} title="View site"><span className="admin-hide-mobile">View site </span>↗</Btn>
          <Btn t={t} size="sm" kind="ghost" onClick={async () => { await signOutAdmin(); exitToSite(); }}>Sign out</Btn>
        </header>
        <main style={{ padding: "28px 28px 60px", maxWidth: 1180, margin: "0 auto", animation: "adminFade 0.2s ease" }} key={section}>
          {renderSection()}
        </main>
      </div>

      {navOpen && <div className="admin-scrim" onClick={() => setNavOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 290, background: "rgba(2,6,16,0.6)" }} />}
      <CommandPalette t={t} open={palette} onClose={() => setPalette(false)} go={go} version={version} />
      <ToastHost t={t} toasts={toasts} dismiss={dismiss} />
    </div>
  );
}

const ADMIN_CSS = `
  @keyframes adminFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes adminSlide { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }
  .admin-nav { transition: transform 0.22s cubic-bezier(.4,0,.2,1); }
  .cf-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .cf-table-scroll > table { min-width: 640px; }
  input[type="checkbox"] { accent-color: #2563EB; }
  @media (max-width: 600px) {
    .admin-hide-mobile { display: none !important; }
  }
  @media (max-width: 900px) {
    .admin-nav { transform: translateX(-100%); }
    .admin-nav.open { transform: none; }
    .admin-main { padding-left: 0 !important; }
    .admin-burger { display: inline-flex !important; }
    .admin-two-col, .admin-form-grid { grid-template-columns: 1fr !important; }
    .admin-drawer { width: 100% !important; }
  }
`;

export {
  AdminApp,
};
