import { useEffect, useRef } from "react";

// ── COURSE VIEWER (top level) ─────────────────────────────────────────────
// ── REWARD TOAST (shown on genuine activity completion) ──────────────────────
function RewardToast({ reward, dark, onClose }) {
  // The dismiss timer is keyed to the reward, not to the callback: a parent that
  // re-creates `onClose` each render must not restart the countdown. The ref
  // keeps the newest callback reachable without becoming a dependency.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!reward) return undefined;
    const t = setTimeout(() => onCloseRef.current(), 6000);
    return () => clearTimeout(t);
  }, [reward]);

  if (!reward) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 4000, maxWidth: 320, animation: "rewardSlideIn 0.35s cubic-bezier(.2,.8,.2,1)" }}>
      <div style={{
        background: dark ? "#0d0d0d" : "#fff", border: "1px solid #C9A84C55", borderRadius: 18,
        padding: "20px 22px", boxShadow: "0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: "1.3rem" }}>🎉</span>
          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: dark ? "#f0f0f0" : "#111" }}>{reward.title}</span>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: reward.newAchievements?.length ? 12 : 16 }}>
          {reward.coins > 0 && (
            <div style={{ flex: 1, background: "#C9A84C15", border: "1px solid #C9A84C33", borderRadius: 11, padding: "9px 12px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "#C9A84C" }}>+{reward.coins} 🪙</div>
              <div style={{ fontSize: "0.62rem", color: dark ? "#999" : "#777", fontWeight: 600 }}>ProphyCoins</div>
            </div>
          )}
          {reward.xp > 0 && (
            <div style={{ flex: 1, background: "#60a5fa15", border: "1px solid #60a5fa33", borderRadius: 11, padding: "9px 12px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "#60a5fa" }}>+{reward.xp} XP</div>
              <div style={{ fontSize: "0.62rem", color: dark ? "#999" : "#777", fontWeight: 600 }}>Experience</div>
            </div>
          )}
        </div>
        {reward.leveledUp && (
          <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#4ade80", marginBottom: 12, textAlign: "center" }}>⭐ Level up! You&apos;re now Level {reward.newLevel}</div>
        )}
        {reward.newAchievements?.map(a => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#a78bfa15", border: "1px solid #a78bfa33", borderRadius: 11, padding: "8px 12px", marginBottom: 8 }}>
            <span style={{ fontSize: "1rem" }}>{a.icon}</span>
            <div>
              <div style={{ fontSize: "0.68rem", color: "#a78bfa", fontWeight: 700 }}>Achievement Unlocked</div>
              <div style={{ fontSize: "0.76rem", color: dark ? "#eee" : "#222", fontWeight: 700 }}>{a.label}</div>
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{
          width: "100%", padding: "9px 0", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg,#C9A84C,#C9A84Ccc)", color: "#0a0a0a",
          fontWeight: 800, fontSize: "0.78rem", cursor: "pointer", marginTop: 4,
        }}>Continue Learning</button>
      </div>
      <style>{`@keyframes rewardSlideIn{from{opacity:0;transform:translateY(20px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}} .cf-fade-in{animation:cfFadeIn 0.25s ease} @keyframes cfFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

export {
  RewardToast,
};
