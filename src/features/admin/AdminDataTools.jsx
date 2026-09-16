import { useRef, useState } from "react";
import { Btn, Card, ConfirmDialog, Field, SectionTitle, TextInput } from "./AdminUI.jsx";
import { isSupabaseConfigured } from "../../lib/supabase/client.js";
import { adminAuthMode, changeLocalPasscode } from "../../services/adminAuth.js";
import { exportAdminBackup, importAdminBackup, resetAdminDataToDefaults } from "../../services/adminContent.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── DATA & SECURITY ───────────────────────────────────────────────────────────
// Backup / restore of the whole content store, a factory reset, the admin
// passcode (local mode) and a read-out of how the panel is secured.
// ══════════════════════════════════════════════════════════════════════════════

function AdminDataTools({ t, toast, bump }) {
  const fileRef = useRef(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pending, setPending] = useState(null); // parsed backup text awaiting confirmation
  const [cur, setCur] = useState(""), [next, setNext] = useState(""), [again, setAgain] = useState("");
  const [pcError, setPcError] = useState("");

  const download = () => {
    const blob = new Blob([exportAdminBackup()], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `chessprophy-content-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(a.href);
    toast({ title: "Backup downloaded", kind: "success" });
  };
  const onFile = async (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    setPending({ name: f.name, text: await f.text() });
  };
  const restore = () => {
    try {
      const sections = importAdminBackup(pending.text);
      toast({ title: `Restored ${sections.length} sections from ${pending.name}`, kind: "success" }); bump();
    } catch (err) { toast({ title: err.message, kind: "error", ttl: 8000 }); }
    setPending(null);
  };
  const changePasscode = async (e) => {
    e.preventDefault(); setPcError("");
    if (next !== again) { setPcError("The new passcodes do not match."); return; }
    try { await changeLocalPasscode(cur, next); setCur(""); setNext(""); setAgain(""); toast({ title: "Passcode changed", kind: "success" }); }
    catch (err) { setPcError(err.message); }
  };

  const remote = isSupabaseConfigured();
  return (
    <div>
      <SectionTitle t={t} title="Data & security" sub="Back up or restore every content section, and manage how this panel is protected." />

      <div className="admin-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card t={t}>
          <div style={{ fontWeight: 800, color: t.fg, marginBottom: 6 }}>Backup & restore</div>
          <div style={{ fontSize: "0.76rem", color: t.muted, lineHeight: 1.6, marginBottom: 14 }}>Exports news, events, announcements, puzzles, store items, wiki, ChessFlix, settings and layout as one JSON file. Restoring replaces the current content (the activity log records it).</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn t={t} kind="primary" onClick={download}>⬇ Download backup</Btn>
            <Btn t={t} onClick={() => fileRef.current?.click()}>⬆ Restore from file</Btn>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} style={{ display: "none" }} />
          </div>
        </Card>
        <Card t={t} style={{ borderColor: `${t.RED}33` }}>
          <div style={{ fontWeight: 800, color: t.fg, marginBottom: 6 }}>Factory reset</div>
          <div style={{ fontSize: "0.76rem", color: t.muted, lineHeight: 1.6, marginBottom: 14 }}>Puts every content section back to the shipped defaults. Learner progress, the passcode and the activity log are not touched. Download a backup first.</div>
          <Btn t={t} kind="danger" onClick={() => setConfirmReset(true)}>Reset all content</Btn>
        </Card>
      </div>

      <Card t={t} style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, color: t.fg, marginBottom: 6 }}>How this panel is protected</div>
        {remote ? (
          <div style={{ fontSize: "0.78rem", color: t.muted, lineHeight: 1.7 }}>
            <strong style={{ color: t.GREEN }}>Remote mode.</strong> Access requires a Supabase account holding the <code>admin</code> or <code>moderator</code> role in <code>public.user_roles</code>. That table has no client write policy, so a role can only be granted from the SQL editor or with the service key — and every catalogue table re-checks <code>is_admin()</code> in its row-level-security policy on write. The panel hides itself from everyone else; the database is what actually refuses them.
          </div>
        ) : (
          <div style={{ fontSize: "0.78rem", color: t.muted, lineHeight: 1.7 }}>
            <strong style={{ color: t.AMBER }}>Local mode.</strong> No backend is configured. The panel is gated by a passcode stored as a salted SHA-256 hash in this browser, with a 30-second lockout after {5} failed attempts. This keeps the admin screens away from casual use on a shared machine — it is not a security boundary, because all content already lives in this browser. Set <code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code> and grant yourself the admin role for real, server-enforced access.
          </div>
        )}
      </Card>

      {adminAuthMode() === "local" && (
        <Card t={t}>
          <form onSubmit={changePasscode} style={{ maxWidth: 420 }}>
            <div style={{ fontWeight: 800, color: t.fg, marginBottom: 12 }}>Change admin passcode</div>
            <Field t={t} label="Current passcode"><TextInput t={t} type="password" value={cur} onChange={setCur} /></Field>
            <Field t={t} label="New passcode" hint="8+ characters"><TextInput t={t} type="password" value={next} onChange={setNext} /></Field>
            <Field t={t} label="Repeat new passcode" error={pcError}><TextInput t={t} type="password" value={again} onChange={setAgain} /></Field>
            <Btn t={t} kind="primary" type="submit" disabled={!cur || !next || !again}>Update passcode</Btn>
          </form>
        </Card>
      )}

      <ConfirmDialog t={t} open={confirmReset} danger title="Reset all site content?" body="Every news post, event, announcement, custom puzzle, store item, wiki article, ChessFlix post and setting goes back to the defaults. This cannot be undone — download a backup first." confirmLabel="Reset everything" onCancel={() => setConfirmReset(false)} onConfirm={() => { resetAdminDataToDefaults(); setConfirmReset(false); toast({ title: "Content reset to defaults", kind: "warn" }); bump(); }} />
      <ConfirmDialog t={t} open={!!pending} title={`Restore “${pending?.name}”?`} body="The current content is replaced by the backup. Sections missing from the file fall back to defaults." confirmLabel="Restore" onCancel={() => setPending(null)} onConfirm={restore} />
    </div>
  );
}

export {
  AdminDataTools,
};
