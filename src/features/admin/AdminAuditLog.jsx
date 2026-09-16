import { useMemo, useState } from "react";
import { Badge, Btn, Card, ConfirmDialog, EmptyState, SectionTitle } from "./AdminUI.jsx";
import { fmtDate, inputStyle } from "./adminUtils.js";
import { clearAuditLog, loadAuditLog } from "../../services/adminAudit.js";

// ── Activity log: every admin action, newest first, searchable ───────────────
function AdminAuditLog({ t, toast, version, bump }) {
  const entries = useMemo(() => loadAuditLog(), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(false);
  const shown = entries.filter(e => !query || `${e.summary} ${e.action} ${e.actor} ${e.target}`.toLowerCase().includes(query.toLowerCase()));
  const download = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `chessprophy-audit-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div>
      <SectionTitle t={t} title="Activity log" sub="Who changed what, and when. Kept to the last 500 actions." action={<div style={{ display: "flex", gap: 8 }}><Btn t={t} onClick={download} disabled={!entries.length}>⬇ Export JSON</Btn><Btn t={t} kind="danger" disabled={!entries.length} onClick={() => setConfirm(true)}>Clear</Btn></div>} />
      <Card t={t} pad={0}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", gap: 10, alignItems: "center" }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter by text, action or actor…" style={{ ...inputStyle(t), width: 320, maxWidth: "100%" }} />
          <span style={{ fontSize: "0.74rem", color: t.muted }}>{shown.length} of {entries.length}</span>
        </div>
        {shown.length === 0 ? <EmptyState t={t} icon="🗒️" title="Nothing logged" sub="Actions taken in the admin panel show up here." /> : shown.map(e => (
          <div key={e.id} style={{ display: "flex", gap: 12, padding: "10px 16px", borderTop: `1px solid ${t.border}`, fontSize: "0.78rem", alignItems: "flex-start" }}>
            <span style={{ color: t.faint, fontFamily: "monospace", fontSize: "0.68rem", whiteSpace: "nowrap", paddingTop: 2 }}>{fmtDate(e.ts)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: t.fg }}>{e.summary}</div>
              <div style={{ color: t.faint, fontSize: "0.68rem", marginTop: 2, fontFamily: "monospace" }}>{e.action}{e.target ? ` · ${e.target}` : ""}</div>
            </div>
            <Badge t={t} color={e.mode === "remote" ? t.G_LT : t.muted}>{e.actor}</Badge>
          </div>
        ))}
      </Card>
      <ConfirmDialog t={t} open={confirm} danger title="Clear the activity log?" body="Export it first if you need a record — this cannot be undone." confirmLabel="Clear log" onCancel={() => setConfirm(false)} onConfirm={() => { clearAuditLog(); setConfirm(false); toast({ title: "Activity log cleared", kind: "warn" }); bump(); }} />
    </div>
  );
}

export {
  AdminAuditLog,
};
