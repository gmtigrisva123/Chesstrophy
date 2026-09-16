import { useState } from "react";
import { Badge, Btn, Card, Field, SectionTitle, TextInput, Toggle } from "./AdminUI.jsx";
import { fmtDate } from "./adminUtils.js";
import { logAdminAction } from "../../services/adminAudit.js";
import { updateAdminData } from "../../services/adminContent.js";
import { defaultAdminData, loadAdminData } from "../../services/adminData.js";
import { adminAdjustBalance, levelFromXP, loadEconomy } from "../../services/economy.js";
import { loadProfile } from "../../services/profile.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── ECONOMY ───────────────────────────────────────────────────────────────────
// Reward amounts per activity (read by every grantReward call site through
// rewardCfg), and a manual wallet adjustment for this device's learner that
// always leaves an audited ledger entry.
// ══════════════════════════════════════════════════════════════════════════════

function AdminEconomy({ t, toast, version, bump }) {
  const data = loadAdminData();
  const defaults = defaultAdminData().economyConfig;
  const [cfg, setCfg] = useState(() => ({ ...defaults, ...(data.economyConfig || {}) }));
  const dirty = JSON.stringify(cfg) !== JSON.stringify({ ...defaults, ...(data.economyConfig || {}) });
  const setRow = (key, patch) => setCfg(c => ({ ...c, [key]: { ...c[key], ...patch } }));
  const save = () => {
    const clean = Object.fromEntries(Object.entries(cfg).map(([k, v]) => [k, { ...v, coins: Math.max(0, Number(v.coins) || 0), xp: Math.max(0, Number(v.xp) || 0) }]));
    updateAdminData(d => ({ ...d, economyConfig: clean }), { action: "economyConfig.update", target: "economyConfig", summary: "Updated reward amounts" });
    setCfg(clean);
    toast({ title: "Reward configuration saved", kind: "success" }); bump();
  };

  const econ = loadEconomy();
  const profile = loadProfile();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const adjust = (sign) => {
    const n = Math.abs(Number(amount));
    if (!n) { toast({ title: "Enter an amount first", kind: "warn" }); return; }
    const tx = adminAdjustBalance(sign * n, reason.trim() || "manual adjustment");
    logAdminAction({ action: "wallet.adjust", target: `learner:${profile.username}`, summary: `${tx.amount >= 0 ? "Granted" : "Removed"} ${Math.abs(tx.amount)} ProphyCoins (${reason.trim() || "manual adjustment"})`, meta: { txId: tx.id } });
    setAmount(""); setReason("");
    toast({ title: `Balance is now 🪙 ${tx.balanceAfter.toLocaleString()}`, kind: "success" }); bump();
  };

  return (
    <div key={version}>
      <SectionTitle t={t} title="Economy" sub="ProphyCoins and XP paid out for each activity, plus a manual wallet tool. Every grant stays idempotent per activity, so raising a reward never re-pays completed work." action={<div style={{ display: "flex", alignItems: "center", gap: 8 }}>{dirty && <Badge t={t} color={t.AMBER}>Unsaved</Badge>}<Btn t={t} kind="primary" disabled={!dirty} onClick={save}>Save rewards</Btn></div>} />

      <Card t={t} pad={0} style={{ marginBottom: 18 }}>
        <div className="cf-table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead><tr style={{ color: t.faint, fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              <th style={{ textAlign: "left", padding: "12px 16px" }}>Activity</th><th style={{ textAlign: "left", padding: "12px 8px" }}>Key</th><th style={{ textAlign: "left", padding: "12px 8px" }}>Coins</th><th style={{ textAlign: "left", padding: "12px 8px" }}>XP</th><th style={{ textAlign: "left", padding: "12px 16px" }}>Enabled</th>
            </tr></thead>
            <tbody>
              {Object.entries(cfg).map(([key, row]) => (
                <tr key={key} style={{ borderTop: `1px solid ${t.border}` }}>
                  <td style={{ padding: "8px 16px", color: t.fg, fontWeight: 600 }}>{row.label}</td>
                  <td style={{ padding: "8px", color: t.faint, fontFamily: "monospace", fontSize: "0.7rem" }}>{key}</td>
                  <td style={{ padding: "8px", width: 110 }}><TextInput t={t} type="number" value={row.coins} onChange={v => setRow(key, { coins: v })} /></td>
                  <td style={{ padding: "8px", width: 110 }}><TextInput t={t} type="number" value={row.xp} onChange={v => setRow(key, { xp: v })} /></td>
                  <td style={{ padding: "8px 16px" }}><Toggle t={t} checked={row.enabled !== false} onChange={v => setRow(key, { enabled: v })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="admin-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card t={t}>
          <div style={{ fontWeight: 800, fontSize: "0.92rem", color: t.fg, marginBottom: 4 }}>Wallet of @{profile.username}</div>
          <div style={{ fontSize: "0.74rem", color: t.muted, marginBottom: 14 }}>Level {levelFromXP(econ.xp)} · {econ.xp.toLocaleString()} XP · lifetime earned {(econ.lifetimeEarned || 0).toLocaleString()} · spent {(econ.totalSpent || 0).toLocaleString()}</div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "2rem", fontWeight: 800, color: t.GOLD, marginBottom: 14 }}>🪙 {econ.coins.toLocaleString()}</div>
          <Field t={t} label="Amount"><TextInput t={t} type="number" value={amount} onChange={setAmount} placeholder="e.g. 100" /></Field>
          <Field t={t} label="Reason" hint="recorded on the ledger"><TextInput t={t} value={reason} onChange={setReason} placeholder="Compensation for a lost session" /></Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn t={t} kind="success" onClick={() => adjust(1)}>+ Grant coins</Btn>
            <Btn t={t} kind="danger" onClick={() => adjust(-1)}>− Remove coins</Btn>
          </div>
        </Card>
        <Card t={t}>
          <div style={{ fontWeight: 800, fontSize: "0.92rem", color: t.fg, marginBottom: 12 }}>Recent ledger</div>
          {(econ.transactions || []).length === 0 ? <div style={{ fontSize: "0.8rem", color: t.muted }}>No transactions yet.</div> : (econ.transactions || []).slice(0, 10).map(tx => (
            <div key={tx.id} style={{ display: "flex", gap: 10, padding: "7px 0", borderTop: `1px solid ${t.border}`, fontSize: "0.76rem", alignItems: "center" }}>
              <span style={{ color: t.faint, fontFamily: "monospace", fontSize: "0.66rem", whiteSpace: "nowrap" }}>{fmtDate(tx.date)}</span>
              <span style={{ flex: 1, color: t.fg }}>{tx.reason || tx.type}</span>
              <span style={{ fontWeight: 700, color: tx.amount >= 0 ? t.GREEN : t.RED }}>{tx.amount >= 0 ? "+" : ""}{tx.amount}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export {
  AdminEconomy,
};
