import { useMemo, useState } from "react";
import { COLLECTIONS } from "./adminSchemas.js";
import { Badge, Btn, Card, ConfirmDialog, EmptyState, Field, SectionTitle, Select, TagInput, Toggle } from "./AdminUI.jsx";
import { fmtDate, statusColor } from "./adminUtils.js";
import { CollectionManager } from "./CollectionManager.jsx";
import { deleteCommunityGame, loadCommunityGames, patchRecord, updateSection } from "../../services/adminContent.js";
import { loadAdminData } from "../../services/adminData.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── MODERATION ────────────────────────────────────────────────────────────────
// The ChessFlix review queue, who may post, and community-submitted games.
// ══════════════════════════════════════════════════════════════════════════════

function AdminModeration({ t, toast, version, bump }) {
  const data = loadAdminData();
  const pending = useMemo(() => (data.chessflixContent || []).filter(c => c.status === "pending"), [data.chessflixContent]);
  const [cfg, setCfg] = useState(() => ({ enabled: true, postPermission: "admins", approvedCreators: [], moderationEnabled: false, ...(data.chessflixConfig || {}) }));
  const cfgDirty = JSON.stringify(cfg) !== JSON.stringify({ enabled: true, postPermission: "admins", approvedCreators: [], moderationEnabled: false, ...(data.chessflixConfig || {}) });
  const [tab, setTab] = useState("queue");
  const [confirmGame, setConfirmGame] = useState(null);
  const games = useMemo(() => loadCommunityGames(), [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const decide = (post, status) => {
    patchRecord("chessflixContent", post.id, { status }, { label: "ChessFlix post", summary: `${status === "published" ? "Approved" : "Rejected"} ChessFlix post “${post.title}” by ${post.creatorName}` });
    toast({ title: `${status === "published" ? "Approved" : "Rejected"} “${post.title}”`, kind: status === "published" ? "success" : "warn" }); bump();
  };
  const saveCfg = () => { updateSection("chessflixConfig", cfg, "Updated ChessFlix posting policy"); toast({ title: "Posting policy saved", kind: "success" }); bump(); };

  const tabs = [["queue", `Review queue${pending.length ? ` · ${pending.length}` : ""}`], ["policy", "Posting policy"], ["library", "ChessFlix library"], ["games", `Community games · ${games.length}`]];

  return (
    <div>
      <SectionTitle t={t} title="Moderation" sub="Review what members submit before it goes live, and decide who is allowed to post." />
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: tab === id ? `${t.G}22` : "transparent", border: `1px solid ${tab === id ? t.G + "66" : t.border}`, color: tab === id ? t.G_LT : t.muted, borderRadius: 10, padding: "8px 14px", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer" }}>{label}</button>
        ))}
      </div>

      {tab === "queue" && (
        <Card t={t} pad={0}>
          {pending.length === 0 ? <EmptyState t={t} icon="✅" title="Queue is clear" sub="Nothing is waiting for review. Posts land here when moderation is enabled and a non-admin creator publishes." /> : pending.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 14, padding: 16, borderTop: `1px solid ${t.border}`, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: 96, height: 60, borderRadius: 8, background: p.thumbnail ? `url(${p.thumbnail}) center/cover` : t.raised, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{!p.thumbnail && (p.type === "video" ? "▶" : "🖼")}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, color: t.fg, fontSize: "0.88rem" }}>{p.title}</div>
                <div style={{ fontSize: "0.74rem", color: t.muted, marginTop: 2 }}>{p.creatorName} · {p.category || "uncategorised"} · {fmtDate(p.createdAt)}</div>
                {p.desc && <div style={{ fontSize: "0.76rem", color: t.muted, marginTop: 6, lineHeight: 1.5 }}>{p.desc}</div>}
                {p.mediaUrl && <a href={p.mediaUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: t.G_LT }}>Open media ↗</a>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn t={t} kind="success" onClick={() => decide(p, "published")}>✓ Approve</Btn>
                <Btn t={t} kind="danger" onClick={() => decide(p, "rejected")}>✕ Reject</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === "policy" && (
        <Card t={t}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 800, color: t.fg }}>Who can post to ChessFlix</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{cfgDirty && <Badge t={t} color={t.AMBER}>Unsaved</Badge>}<Btn t={t} kind="primary" size="sm" disabled={!cfgDirty} onClick={saveCfg}>Save</Btn></div>
          </div>
          <div style={{ marginBottom: 14 }}><Toggle t={t} checked={!!cfg.enabled} onChange={v => setCfg(c => ({ ...c, enabled: v }))} label={cfg.enabled ? "ChessFlix is enabled" : "ChessFlix is disabled"} /></div>
          <Field t={t} label="Posting permission">
            <Select t={t} value={cfg.postPermission} onChange={v => setCfg(c => ({ ...c, postPermission: v }))} options={[{ value: "admins", label: "Admins only (through this panel)" }, { value: "admins_approved", label: "Admins + approved creators" }, { value: "custom", label: "Custom list of creators" }]} />
          </Field>
          <Field t={t} label="Approved creator usernames" hint="matched against the learner's username"><TagInput t={t} value={cfg.approvedCreators || []} onChange={v => setCfg(c => ({ ...c, approvedCreators: v }))} placeholder="username, Enter" /></Field>
          <Toggle t={t} checked={!!cfg.moderationEnabled} onChange={v => setCfg(c => ({ ...c, moderationEnabled: v }))} label="Hold creator posts for review before they are published" />
        </Card>
      )}

      {tab === "library" && <CollectionManager t={t} schema={COLLECTIONS.chessflixContent} toast={toast} />}

      {tab === "games" && (
        <Card t={t} pad={0}>
          {games.length === 0 ? <EmptyState t={t} icon="♟" title="No community games" sub="Games members submit on the Community Games page appear here." /> : games.map(g => (
            <div key={g.id} style={{ display: "flex", gap: 14, padding: 14, borderTop: `1px solid ${t.border}`, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, color: t.fg, fontSize: "0.86rem" }}>{g.player}{g.opponent ? ` vs ${g.opponent}` : ""} {g.rating && <Badge t={t} color={t.G_LT}>{g.rating}</Badge>}</div>
                <div style={{ fontSize: "0.72rem", color: t.muted, marginTop: 2 }}>{g.event || "Community game"} · {fmtDate(g.ts)} · {(g.pgn || "").split(/\s+/).filter(x => !/^\d+\.$/.test(x)).length} plies</div>
              </div>
              <Badge t={t} color={statusColor(t, g.approved ? "published" : "pending")}>{g.approved ? "visible" : "pending"}</Badge>
              <Btn t={t} kind="danger" size="sm" onClick={() => setConfirmGame(g)}>Remove</Btn>
            </div>
          ))}
        </Card>
      )}

      <ConfirmDialog t={t} open={!!confirmGame} danger title="Remove this community game?" body={`The game submitted by ${confirmGame?.player} is deleted from the Community Games page.`} confirmLabel="Remove" onCancel={() => setConfirmGame(null)} onConfirm={() => { deleteCommunityGame(confirmGame.id); setConfirmGame(null); toast({ title: "Game removed", kind: "warn" }); bump(); }} />
    </div>
  );
}

export {
  AdminModeration,
};
