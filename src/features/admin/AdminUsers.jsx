import { useEffect, useMemo, useState } from "react";
import { Badge, Btn, Card, ConfirmDialog, EmptyState, SectionTitle, Stat } from "./AdminUI.jsx";
import { fmtDate, inputStyle } from "./adminUtils.js";
import { isSupabaseConfigured } from "../../lib/supabase/client.js";
import { logAdminAction } from "../../services/adminAudit.js";
import { adminAuthMode } from "../../services/adminAuth.js";
import { loadDQState } from "../../services/dailyQuestionsState.js";
import { defaultEconomy, levelFromXP, loadEconomy, saveEconomy } from "../../services/economy.js";
import { loadOpState } from "../../services/openingProgress.js";
import { loadProfile, saveProfile } from "../../services/profile.js";
import { loadPzState, savePzState } from "../../services/puzzleProgress.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── USERS ─────────────────────────────────────────────────────────────────────
// Remote mode lists real member profiles from Supabase (admins may read every
// profile under RLS). Local mode has exactly one learner — the profile stored
// in this browser — with a few support tools for it.
// ══════════════════════════════════════════════════════════════════════════════

function RemoteMembers({ t }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getSupabaseClient } = await import("../../lib/supabase/client.js");
        const supabase = await getSupabaseClient();
        const { data, error: err } = await supabase.from("profiles").select("id, username, display_name, is_guest, onboarding_completed, chess_level, created_at").order("created_at", { ascending: false }).limit(200);
        if (err) throw new Error(err.message);
        if (!cancelled) setRows(data || []);
      } catch (e) { if (!cancelled) setError(e.message); }
    })();
    return () => { cancelled = true; };
  }, []);
  const shown = (rows || []).filter(r => !query || `${r.username} ${r.display_name || ""}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <Card t={t} pad={0}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", gap: 10, alignItems: "center" }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search members…" style={{ ...inputStyle(t), width: 260 }} />
        <span style={{ fontSize: "0.74rem", color: t.muted }}>{rows ? `${shown.length} of ${rows.length} (latest 200)` : "Loading…"}</span>
      </div>
      {error && <div style={{ padding: 16, color: t.RED, fontSize: "0.8rem" }}>{error}</div>}
      {rows && shown.length === 0 && !error && <EmptyState t={t} icon="👥" title="No members" sub="Nobody has signed up yet, or nothing matches your search." />}
      {shown.map(r => (
        <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 16px", borderTop: `1px solid ${t.border}`, fontSize: "0.8rem" }}>
          <div style={{ flex: 1 }}><span style={{ color: t.fg, fontWeight: 700 }}>@{r.username}</span>{r.display_name && <span style={{ color: t.muted }}> · {r.display_name}</span>}</div>
          <span style={{ color: t.muted }}>{r.chess_level || "—"}</span>
          {r.is_guest && <Badge t={t} color={t.PURPLE}>guest</Badge>}
          <Badge t={t} color={r.onboarding_completed ? t.GREEN : t.muted}>{r.onboarding_completed ? "onboarded" : "new"}</Badge>
          <span style={{ color: t.faint, fontFamily: "monospace", fontSize: "0.68rem" }}>{fmtDate(r.created_at)}</span>
        </div>
      ))}
    </Card>
  );
}

function LocalLearner({ t, toast, version, bump }) {
  const profile = useMemo(() => loadProfile(), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const econ = loadEconomy(), pz = loadPzState(), dq = loadDQState(), op = loadOpState();
  const [confirm, setConfirm] = useState(null); // "onboarding" | "progress"

  const resetOnboarding = () => {
    saveProfile({ ...profile, onboardingCompleted: false, isGuest: false, hasSeenLanding: false, dismissedOnboarding: false });
    logAdminAction({ action: "learner.resetOnboarding", target: `learner:${profile.username}`, summary: "Reset onboarding for this device's learner" });
    toast({ title: "Onboarding will run again on the next visit", kind: "success" }); bump();
  };
  const resetProgress = () => {
    saveEconomy(defaultEconomy());
    savePzState({ date: new Date().toDateString(), puzzleRating: 1200, streak: 0, lastSolvedDate: null, solvedToday: [], freeUsed: 0, potdSolved: false, hintUsedIds: [], solved: [] });
    logAdminAction({ action: "learner.resetProgress", target: `learner:${profile.username}`, summary: "Reset wallet and puzzle progress for this device's learner" });
    toast({ title: "Wallet and puzzle progress reset", kind: "warn" }); bump();
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 18 }}>
        <Stat t={t} label="Level" value={levelFromXP(econ.xp)} sub={`${econ.xp.toLocaleString()} XP`} color={t.G_LT} />
        <Stat t={t} label="ProphyCoins" value={econ.coins.toLocaleString()} color={t.GOLD} />
        <Stat t={t} label="Puzzle rating" value={pz.puzzleRating || 1200} sub={`${(pz.solved || []).length} attempted`} color={t.PURPLE} />
        <Stat t={t} label="Streak" value={`${Math.max(pz.streak || 0, dq.streak || 0)}d`} sub={`DQ best ${dq.longestStreak || 0}d`} />
        <Stat t={t} label="Opening lines" value={Object.values(op.progress || {}).flatMap(o => Object.values(o)).length} sub="with any progress" />
      </div>
      <div className="admin-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card t={t}>
          <div style={{ fontWeight: 800, color: t.fg, marginBottom: 12 }}>Profile</div>
          {[["Username", `@${profile.username}`], ["Display name", profile.displayName || "—"], ["Email", profile.email || "—"], ["Level", profile.chessLevel || "—"], ["Focus areas", (profile.improvementAreas || []).join(", ") || "—"], ["Daily time", profile.dailyTrainingTime || "—"], ["Joined", fmtDate(profile.joined)], ["Guest", profile.isGuest ? "yes" : "no"], ["Onboarding", profile.onboardingCompleted ? "completed" : "not completed"], ["Public profile", profile.settings?.privacy?.publicProfile ? "yes" : "no"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderTop: `1px solid ${t.border}`, fontSize: "0.78rem" }}><span style={{ color: t.muted }}>{k}</span><span style={{ color: t.fg, fontWeight: 600, textAlign: "right" }}>{v}</span></div>
          ))}
        </Card>
        <Card t={t} style={{ borderColor: `${t.RED}33` }}>
          <div style={{ fontWeight: 800, color: t.fg, marginBottom: 6 }}>Support tools</div>
          <div style={{ fontSize: "0.76rem", color: t.muted, lineHeight: 1.6, marginBottom: 14 }}>These act on the learner profile stored in this browser only. Both are recorded in the activity log.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Btn t={t} onClick={() => setConfirm("onboarding")}>↺ Re-run onboarding on next visit</Btn>
            <Btn t={t} kind="danger" onClick={() => setConfirm("progress")}>Reset wallet & puzzle progress</Btn>
          </div>
        </Card>
      </div>
      <ConfirmDialog t={t} open={confirm === "onboarding"} title="Re-run onboarding?" body="The landing page and onboarding steps will show again on the next visit. Progress is kept." confirmLabel="Reset onboarding" onCancel={() => setConfirm(null)} onConfirm={() => { resetOnboarding(); setConfirm(null); }} />
      <ConfirmDialog t={t} open={confirm === "progress"} danger title="Reset wallet and puzzle progress?" body="Coins, XP, the transaction ledger, achievements and puzzle history for this device are cleared. This cannot be undone." confirmLabel="Reset progress" onCancel={() => setConfirm(null)} onConfirm={() => { resetProgress(); setConfirm(null); }} />
    </div>
  );
}

function AdminUsers({ t, toast, version, bump }) {
  const remote = adminAuthMode() === "remote" && isSupabaseConfigured();
  return (
    <div>
      <SectionTitle t={t} title={remote ? "Members" : "Learner on this device"} sub={remote ? "Every profile in the Supabase project, newest first. Roles are granted in the database, never from here." : "No backend is configured, so there is exactly one learner: the profile stored in this browser."} />
      {remote ? <RemoteMembers t={t} /> : <LocalLearner t={t} toast={toast} version={version} bump={bump} />}
    </div>
  );
}

export {
  AdminUsers,
};
