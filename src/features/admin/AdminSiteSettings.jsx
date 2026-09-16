import { useState } from "react";
import { Badge, Btn, Card, Field, SectionTitle, Select, TextArea, TextInput, Toggle } from "./AdminUI.jsx";
import { NAV_ITEMS } from "../../data/navigation.js";
import { updateAdminData, updateSection } from "../../services/adminContent.js";
import { defaultAdminData, loadAdminData } from "../../services/adminData.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── SITE SETTINGS ─────────────────────────────────────────────────────────────
// Identity, landing page, socials, SEO, maintenance mode, the dashboard
// banner and its section layout. Each card saves independently.
// ══════════════════════════════════════════════════════════════════════════════

const SOCIALS = [["discordUrl", "Discord"], ["youtubeUrl", "YouTube"], ["twitchUrl", "Twitch"], ["twitterUrl", "X / Twitter"], ["githubUrl", "GitHub"], ["lichessUrl", "Lichess"], ["chessdotcomUrl", "Chess.com"]];
const SECTION_LABELS = { welcome: "Welcome hero", classicGames: "Classic Games card", openingTrainer: "Opening Trainer", continueLearning: "Continue Learning", updates: "Updates (news & announcements)", featuredEvent: "Featured event", upcomingEvents: "Upcoming events", progress: "My Chess Progress", recommendations: "Recommended for you", activity: "Recent activity" };

function SettingsCard({ t, title, sub, draft, original, onSave, children, danger }) {
  const dirty = JSON.stringify(draft) !== JSON.stringify(original);
  return (
    <Card t={t} style={{ marginBottom: 18, borderColor: danger ? `${t.RED}44` : t.border }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.92rem", color: t.fg }}>{title}</div>
          {sub && <div style={{ fontSize: "0.74rem", color: t.muted, marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {dirty && <Badge t={t} color={t.AMBER}>Unsaved</Badge>}
          <Btn t={t} kind="primary" size="sm" disabled={!dirty} onClick={onSave}>Save</Btn>
        </div>
      </div>
      {children}
    </Card>
  );
}

function AdminSiteSettings({ t, toast, version, bump }) {
  const data = loadAdminData();
  const [settings, setSettings] = useState(data.settings || {});
  const [homepage, setHomepage] = useState(data.homepage || { features: [] });
  const [dash, setDash] = useState(data.dashboardConfig || defaultAdminData().dashboardConfig);
  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));
  const setBanner = (k, v) => setDash(d => ({ ...d, banner: { ...(d.banner || {}), [k]: v } }));
  const moveSection = (key, dir) => setDash(d => {
    const order = [...d.order]; const i = order.indexOf(key); const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return d;
    [order[i], order[j]] = [order[j], order[i]];
    return { ...d, order };
  });

  const saveSettings = (keys, label) => {
    const patch = Object.fromEntries(keys.map(k => [k, settings[k] ?? ""]));
    updateSection("settings", patch, `Updated ${label}`);
    toast({ title: `${label} saved`, kind: "success" }); bump();
  };
  const saveHomepage = () => { updateSection("homepage", { features: homepage.features }, "Updated landing page features"); toast({ title: "Landing page features saved", kind: "success" }); bump(); };
  const saveDash = () => { updateAdminData(d => ({ ...d, dashboardConfig: dash }), { action: "dashboardConfig.update", target: "dashboardConfig", summary: "Updated dashboard layout & banner" }); toast({ title: "Dashboard layout saved", kind: "success" }); bump(); };

  const orig = data.settings || {};
  const pick = (obj, keys) => Object.fromEntries(keys.map(k => [k, obj[k] ?? ""]));
  const IDENTITY = ["siteName", "tagline", "heroTitle", "heroSubtitle", "heroCtaLabel", "logoUrl", "footerText", "primaryColor", "accentColor"];
  const SEO = ["seoTitle"];
  const SOCIAL = SOCIALS.map(([k]) => k);
  const MAINT = ["maintenanceMode", "maintenanceMsg"];

  return (
    <div key={version}>
      <SectionTitle t={t} title="Site settings" sub="Branding, the public landing page, social links, maintenance mode and the dashboard layout. Changes apply to every open page instantly." />

      <SettingsCard t={t} title="Maintenance mode" sub="Visitors see an offline screen; the admin panel stays reachable at #/admin." draft={pick(settings, MAINT)} original={pick(orig, MAINT)} onSave={() => saveSettings(MAINT, "maintenance mode")} danger={!!settings.maintenanceMode}>
        <div style={{ marginBottom: 12 }}><Toggle t={t} checked={!!settings.maintenanceMode} onChange={v => set("maintenanceMode", v)} label={settings.maintenanceMode ? "Site is OFFLINE for visitors" : "Site is live"} /></div>
        <Field t={t} label="Message shown to visitors"><TextArea t={t} rows={2} value={settings.maintenanceMsg} onChange={v => set("maintenanceMsg", v)} placeholder="ChessProphy is undergoing scheduled maintenance. Back soon!" /></Field>
      </SettingsCard>

      <SettingsCard t={t} title="Identity & landing page" sub="Name, hero copy and colours used on the public landing page." draft={pick(settings, IDENTITY)} original={pick(orig, IDENTITY)} onSave={() => saveSettings(IDENTITY, "site identity")}>
        <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16 }}>
          <Field t={t} label="Site name"><TextInput t={t} value={settings.siteName} onChange={v => set("siteName", v)} placeholder="ChessProphy" /></Field>
          <Field t={t} label="Tagline"><TextInput t={t} value={settings.tagline} onChange={v => set("tagline", v)} placeholder="AI-Powered Chess Learning Platform" /></Field>
          <div style={{ gridColumn: "1 / -1" }}><Field t={t} label="Hero title"><TextInput t={t} value={settings.heroTitle} onChange={v => set("heroTitle", v)} placeholder="Master Chess with AI-Powered Learning" /></Field></div>
          <div style={{ gridColumn: "1 / -1" }}><Field t={t} label="Hero subtitle"><TextArea t={t} rows={2} value={settings.heroSubtitle} onChange={v => set("heroSubtitle", v)} /></Field></div>
          <Field t={t} label="Call-to-action label"><TextInput t={t} value={settings.heroCtaLabel} onChange={v => set("heroCtaLabel", v)} placeholder="Start Learning Free" /></Field>
          <Field t={t} label="Logo image URL"><TextInput t={t} value={settings.logoUrl} onChange={v => set("logoUrl", v)} placeholder="https://…" /></Field>
          <Field t={t} label="Primary colour"><TextInput t={t} value={settings.primaryColor} onChange={v => set("primaryColor", v)} placeholder="#2563EB" mono /></Field>
          <Field t={t} label="Accent colour"><TextInput t={t} value={settings.accentColor} onChange={v => set("accentColor", v)} placeholder="#C9A84C" mono /></Field>
          <div style={{ gridColumn: "1 / -1" }}><Field t={t} label="Footer text"><TextInput t={t} value={settings.footerText} onChange={v => set("footerText", v)} placeholder="© 2026 ChessProphy · Free chess education for everyone." /></Field></div>
        </div>
      </SettingsCard>

      <SettingsCard t={t} title="Landing page features" sub="The three-up feature grid under the hero." draft={homepage.features} original={data.homepage?.features || []} onSave={saveHomepage}>
        {(homepage.features || []).map((f, i) => (
          <div key={f.id || i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 2fr auto", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <TextInput t={t} value={f.icon} onChange={v => setHomepage(h => ({ ...h, features: h.features.map((x, j) => (j === i ? { ...x, icon: v } : x)) }))} />
            <TextInput t={t} value={f.title} onChange={v => setHomepage(h => ({ ...h, features: h.features.map((x, j) => (j === i ? { ...x, title: v } : x)) }))} placeholder="Title" />
            <TextInput t={t} value={f.desc} onChange={v => setHomepage(h => ({ ...h, features: h.features.map((x, j) => (j === i ? { ...x, desc: v } : x)) }))} placeholder="Description" />
            <Btn t={t} size="sm" kind="ghost" onClick={() => setHomepage(h => ({ ...h, features: h.features.filter((_, j) => j !== i) }))} title="Remove">×</Btn>
          </div>
        ))}
        <Btn t={t} size="sm" onClick={() => setHomepage(h => ({ ...h, features: [...(h.features || []), { id: "f" + Date.now().toString(36), icon: "✨", title: "", desc: "" }] }))}>+ Add feature</Btn>
      </SettingsCard>

      <SettingsCard t={t} title="Social links" sub="Only filled-in links appear in the landing page footer." draft={pick(settings, SOCIAL)} original={pick(orig, SOCIAL)} onSave={() => saveSettings(SOCIAL, "social links")}>
        <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16 }}>
          {SOCIALS.map(([k, label]) => <Field key={k} t={t} label={label}><TextInput t={t} value={settings[k]} onChange={v => set(k, v)} placeholder="https://…" /></Field>)}
        </div>
      </SettingsCard>

      <SettingsCard t={t} title="SEO" draft={pick(settings, SEO)} original={pick(orig, SEO)} onSave={() => saveSettings(SEO, "SEO")}>
        <Field t={t} label="Browser tab title" hint="falls back to the site name"><TextInput t={t} value={settings.seoTitle} onChange={v => set("seoTitle", v)} /></Field>
      </SettingsCard>

      <SettingsCard t={t} title="Dashboard banner & layout" sub="A dismissable strip at the top of the learner dashboard, and the order/visibility of its sections." draft={dash} original={data.dashboardConfig} onSave={saveDash}>
        <div style={{ marginBottom: 12 }}><Toggle t={t} checked={!!dash.banner?.active} onChange={v => setBanner("active", v)} label={dash.banner?.active ? "Banner shown" : "Banner hidden"} /></div>
        <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", columnGap: 16 }}>
          <Field t={t} label="Banner text"><TextInput t={t} value={dash.banner?.text} onChange={v => setBanner("text", v)} /></Field>
          <Field t={t} label="Colour"><TextInput t={t} value={dash.banner?.color} onChange={v => setBanner("color", v)} mono placeholder="#2563EB" /></Field>
          <Field t={t} label="Link label"><TextInput t={t} value={dash.banner?.linkLabel} onChange={v => setBanner("linkLabel", v)} placeholder="Learn more" /></Field>
          <Field t={t} label="Link target"><Select t={t} value={dash.banner?.linkTarget || ""} onChange={v => setBanner("linkTarget", v)} options={[{ value: "", label: "— none —" }, ...NAV_ITEMS.map(n => ({ value: n.id, label: n.label }))]} /></Field>
        </div>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: t.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "8px 0 8px" }}>Sections (top to bottom)</div>
        {dash.order.map((key, i) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${t.border}` }}>
            <span style={{ width: 22, fontSize: "0.7rem", color: t.faint, fontFamily: "monospace" }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: "0.82rem", color: dash.sections[key] === false ? t.faint : t.fg, textDecoration: dash.sections[key] === false ? "line-through" : "none" }}>{SECTION_LABELS[key] || key}</span>
            <Toggle t={t} checked={dash.sections[key] !== false} onChange={v => setDash(d => ({ ...d, sections: { ...d.sections, [key]: v } }))} />
            <Btn t={t} size="sm" kind="ghost" disabled={i === 0} onClick={() => moveSection(key, -1)} title="Move up">↑</Btn>
            <Btn t={t} size="sm" kind="ghost" disabled={i === dash.order.length - 1} onClick={() => moveSection(key, 1)} title="Move down">↓</Btn>
          </div>
        ))}
      </SettingsCard>
    </div>
  );
}

export {
  AdminSiteSettings,
};
