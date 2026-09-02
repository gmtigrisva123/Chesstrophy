import { useState } from "react";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { WEEKLY_MISSION_TEMPLATE } from "../../data/achievements.js";
import { loadAdminData } from "../../services/adminData.js";
import { claimWeeklyMission, getWeeklyMissionState, loadEconomy, spendCoins } from "../../services/economy.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── PROPHY STORE ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function ProphyStorePage({ dark, setActive }) {
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#888"    : "#666";
  const card   = dark ? "#111"    : "#fff";
  const border = dark ? "#1f1f1f" : "#e8e8e8";
  const G = "#C9A84C";

  const [econ, setEcon] = useState(loadEconomy);
  const [tab, setTab] = useState("store"); // store | earn | history
  const [toast, setToast] = useState(null);
  const mission = getWeeklyMissionState();
  const allDone = WEEKLY_MISSION_TEMPLATE.tasks.every(t => (mission.progress[t.key] || 0) >= t.target);
  const [claimed, setClaimed] = useState(mission.claimed);
  const claimMission = () => { const res = claimWeeklyMission(); if (res) { setClaimed(true); setEcon(loadEconomy()); } };
  const ways = [
    { icon: "📖", title: "Complete a free course", reward: "+100 ProphyCoins", desc: "Finish every item on a course's Practice checklist.", cta: "Browse Studies", go: "Studies" },
    { icon: "📝", title: "Complete a course test", reward: "+50 ProphyCoins", desc: "Answer every question in a course's mini quiz.", cta: "Browse Studies", go: "Studies" },
    { icon: "🎯", title: "Score 80%+ on a test", reward: "+25 bonus ProphyCoins", desc: "A bonus on top of the base test reward.", cta: "Browse Studies", go: "Studies" },
    { icon: "🧩", title: "Solve puzzles", reward: "+5 ProphyCoins each", desc: "Every genuinely solved puzzle pays out — repeats don't count twice.", cta: "Go to Puzzles", go: "Puzzles" },
    { icon: "📦", title: "Complete a puzzle pack", reward: "+60 ProphyCoins", desc: "Every 10 solved puzzles completes a pack.", cta: "Go to Puzzles", go: "Puzzles" },
    { icon: "🔥", title: "Learning streaks", reward: "Scales with streak", desc: "Milestone rewards at 3, 7, 14, 30, 60, and 100 days.", cta: "Go to Puzzles", go: "Puzzles" },
    { icon: "📚", title: "Daily Questions", reward: "+20–40 ProphyCoins", desc: "Complete your 5-question daily session.", cta: "Go to Learning Tree & AI", go: "LearningTree" },
    { icon: "🎯", title: "Weekly missions", reward: "+200 ProphyCoins", desc: "Complete all 3 weekly tasks below for a bigger payout.", cta: null, go: null },
  ];

  const items = ((loadAdminData().storeItems) || []).filter(i => i.published && !i.archived);
  const diffStars = d => d === "Beginner" ? 1 : d === "Intermediate" ? 2 : d === "Advanced" ? 4 : 3;

  const unlock = (item) => {
    const res = spendCoins(item.id, item.priceCoins, `Unlocked: ${item.title}`);
    if (res.ok) {
      setEcon(loadEconomy());
      setToast({ title: "💎 Unlocked!", coins: 0, xp: 0, newAchievements: res.newAchievements, custom: `${item.title} is now available.` });
    }
  };

  return (
    <div>
      <style>{`.cf-fade-in{animation:cfFadeIn 0.25s ease} @keyframes cfFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <SectionHeader dark={dark} eyebrow="Economy" title="Prophy Store" sub="Spend ProphyCoins you've earned from real learning on premium resources." />

      {/* Balance banner */}
      <div style={{
        display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 26,
        background: "linear-gradient(135deg, #C9A84C15, transparent)", border: `1px solid ${G}33`,
        borderRadius: 18, padding: "22px 26px",
      }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: "0.7rem", color: muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Current Balance</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: G, display: "flex", alignItems: "center", gap: 10 }}>🪙 {econ.coins.toLocaleString()}</div>
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.68rem", color: muted, marginBottom: 3 }}>Lifetime earned</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4ade80" }}>+{(econ.lifetimeEarned||0).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.68rem", color: muted, marginBottom: 3 }}>Total spent</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: dark ? "#ccc" : "#333" }}>{(econ.totalSpent||0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Tab toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[{ k: "store", l: "🛒 Store" }, { k: "earn", l: "💰 Earn" }, { k: "history", l: "📊 History" }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            padding: "9px 18px", borderRadius: 10, border: `1px solid ${tab === t.k ? G : border}`,
            background: tab === t.k ? `${G}18` : "transparent", color: tab === t.k ? G : muted,
            fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", transition: "all 0.15s",
          }}>{t.l}</button>
        ))}
      </div>

      {tab === "store" && (
        <div className="cf-fade-in">
          {items.length === 0 && <EmptyState icon="🛒" title="Store is empty" sub="Check back soon for premium resources." />}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {items.map(item => {
              const owned = !!econ.unlockedItems[item.id];
              const canAfford = econ.coins >= item.priceCoins;
              const need = item.priceCoins - econ.coins;
              return (
                <div key={item.id} style={{ background: card, border: `1px solid ${owned ? "#4ade8055" : border}`, borderRadius: 16, padding: 22, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ width: 48, height: 48, borderRadius: 13, background: `linear-gradient(135deg, ${G}28, ${G}10)`, border: `1px solid ${G}38`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, boxShadow: `0 4px 14px ${G}18` }}>{item.icon || "🎓"}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, lineHeight: 1.3 }}>{item.title}</div>
                      <div style={{ fontSize: "0.72rem", color: "#f59e0b" }}>{"⭐".repeat(diffStars(item.difficulty))}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: muted, lineHeight: 1.55, marginBottom: 12, flex: 1 }}>{item.desc}</p>
                  {item.targetRating && <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 14 }}>Rating: {item.targetRating}</div>}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: G }}>🪙 {item.priceCoins.toLocaleString()}</span>
                    {item.priceReal && <span style={{ fontSize: "0.7rem", color: muted }}>or 💳 ${item.priceReal}</span>}
                  </div>

                  {owned ? (
                    <div style={{ textAlign: "center", padding: "9px 0", borderRadius: 9, background: "#4ade8015", color: "#4ade80", fontWeight: 700, fontSize: "0.8rem" }}>✓ Owned</div>
                  ) : canAfford ? (
                    <button onClick={() => unlock(item)} style={{
                      padding: "10px 0", borderRadius: 9, border: "none",
                      background: `linear-gradient(135deg,${G},${G}cc)`, color: "#0a0a0a",
                      fontWeight: 800, fontSize: "0.82rem", cursor: "pointer",
                    }}>Unlock</button>
                  ) : (
                    <div>
                      <div style={{ textAlign: "center", fontSize: "0.72rem", color: "#ef4444", fontWeight: 600, marginBottom: 8 }}>You need {need.toLocaleString()} more ProphyCoins.</div>
                      <button onClick={() => setTab("earn")} style={{
                        width: "100%", padding: "9px 0", borderRadius: 9, border: `1px solid ${G}55`,
                        background: "transparent", color: G, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                      }}>How to earn coins →</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "earn" && (
        <div className="cf-fade-in">
          {/* Weekly mission */}
          <div style={{
            background: `linear-gradient(135deg, ${G}15, transparent)`, border: `1px solid ${G}33`,
            borderRadius: 18, padding: "22px 26px", marginBottom: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>This Week&apos;s Mission</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: fg }}>Complete all 3 to earn the bonus</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: G }}>🪙 +{WEEKLY_MISSION_TEMPLATE.rewardCoins}</div>
                <div style={{ fontSize: "0.72rem", color: "#60a5fa", fontWeight: 700 }}>⭐ +{WEEKLY_MISSION_TEMPLATE.rewardXP} XP</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {WEEKLY_MISSION_TEMPLATE.tasks.map(t => {
                const p = mission.progress[t.key] || 0;
                const done = p >= t.target;
                return (
                  <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? "#4ade80" : (dark ? "#1a1a1a" : "#eee"), color: done ? "#0a0a0a" : muted, fontSize: "0.65rem", fontWeight: 900,
                    }}>{done ? "✓" : ""}</span>
                    <span style={{ fontSize: "0.84rem", color: done ? muted : fg, textDecoration: done ? "line-through" : "none", flex: 1 }}>{t.label}</span>
                    <span style={{ fontSize: "0.74rem", color: muted, fontWeight: 600 }}>{Math.min(p, t.target)}/{t.target}</span>
                  </div>
                );
              })}
            </div>
            {allDone && !claimed ? (
              <button onClick={claimMission} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${G},${G}cc)`, color: "#0a0a0a", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}>🎁 Claim Mission Reward</button>
            ) : claimed ? (
              <div style={{ textAlign: "center", padding: "10px 0", borderRadius: 10, background: "#4ade8015", color: "#4ade80", fontWeight: 700, fontSize: "0.8rem" }}>✓ Claimed — new mission starts next Monday</div>
            ) : (
              <div style={{ textAlign: "center", fontSize: "0.76rem", color: muted }}>Keep going — complete every task to unlock the reward.</div>
            )}
          </div>

          {/* Ways to earn */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {ways.map((w, i) => (
              <div key={i} style={{ background: card, border: `1px solid ${border}`, padding: 20, borderRadius: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{w.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: "0.86rem", color: fg }}>{w.title}</span>
                </div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: G, marginBottom: 8 }}>{w.reward}</div>
                <p style={{ fontSize: "0.76rem", color: muted, lineHeight: 1.55, marginBottom: w.cta ? 14 : 0 }}>{w.desc}</p>
                {w.cta && (
                  <button onClick={() => setActive(w.go)} style={{
                    background: "transparent", border: `1px solid ${border}`, color: fg,
                    borderRadius: 8, padding: "7px 14px", fontWeight: 700, fontSize: "0.74rem", cursor: "pointer",
                  }}>{w.cta} →</button>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, fontSize: "0.72rem", color: muted, textAlign: "center", lineHeight: 1.6 }}>
            ProphyCoins are virtual and have no cash value — they can&apos;t be withdrawn, transferred, or converted to real money.
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="cf-fade-in">
          {(!econ.transactions || econ.transactions.length === 0) ? (
            <EmptyState icon="📊" title="No transactions yet" sub="Complete a course or solve some puzzles to start earning ProphyCoins." />
          ) : (
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
              {econ.transactions.map((t, i) => (
                <div key={t.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px",
                  borderBottom: i < econ.transactions.length - 1 ? `1px solid ${border}` : "none",
                }}>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: fg }}>{t.reason || t.type}</div>
                    <div style={{ fontSize: "0.68rem", color: muted, marginTop: 2 }}>{new Date(t.date).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800, color: t.amount >= 0 ? "#4ade80" : "#ef4444" }}>{t.amount >= 0 ? "+" : ""}{t.amount.toLocaleString()} 🪙</div>
                    <div style={{ fontSize: "0.66rem", color: muted, marginTop: 2 }}>Balance: {t.balanceAfter.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 4000, maxWidth: 300, animation: "rewardSlideIn 0.35s cubic-bezier(.2,.8,.2,1)" }}>
          <div style={{ background: dark ? "#0d0d0d" : "#fff", border: `1px solid ${G}55`, borderRadius: 16, padding: "18px 20px", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}>
            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: fg, marginBottom: 6 }}>{toast.title}</div>
            <div style={{ fontSize: "0.8rem", color: muted, marginBottom: 12 }}>{toast.custom}</div>
            <button onClick={() => setToast(null)} style={{ width: "100%", padding: "8px 0", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${G},${G}cc)`, color: "#0a0a0a", fontWeight: 800, fontSize: "0.76rem", cursor: "pointer" }}>Nice!</button>
          </div>
          <style>{`@keyframes rewardSlideIn{from{opacity:0;transform:translateY(20px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
        </div>
      )}
    </div>
  );
}

export {
  ProphyStorePage,
};
