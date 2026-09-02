import { OnboardingMascot, OnboardingPrimaryButton, OnboardingShell } from "./OnboardingUI.jsx";

// ── ONBOARDING COMPLETION SCREEN ─────────────────────────────────────────────
// Shown for a beat after the last step finishes, then hands off to the Dashboard.
function OnboardingComplete({ username, chessLevel, improvementAreas, dailyTrainingTime, onEnter }) {
  return (
    <OnboardingShell>
      <OnboardingMascot size={128} celebrate />
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: "1.4rem", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
          You&apos;re all set, @{username}! 🎉
        </div>
        <div style={{ fontSize: "0.88rem", color: "#9aa3c2" }}>Your ChessProphy experience is ready.</div>
      </div>
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,255,0.14)",
        borderRadius: 14, padding: "18px 20px", marginBottom: 26, display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
          <span style={{ color: "#7d89b0" }}>Chess Level</span>
          <span style={{ color: "#f1f5f9", fontWeight: 700 }}>{chessLevel}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", gap: 12 }}>
          <span style={{ color: "#7d89b0", flexShrink: 0 }}>Focus</span>
          <span style={{ color: "#f1f5f9", fontWeight: 700, textAlign: "right" }}>{improvementAreas.join(" • ")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
          <span style={{ color: "#7d89b0" }}>Daily Training</span>
          <span style={{ color: "#f1f5f9", fontWeight: 700 }}>{dailyTrainingTime}</span>
        </div>
      </div>
      <OnboardingPrimaryButton onClick={onEnter}>Enter ChessProphy →</OnboardingPrimaryButton>
    </OnboardingShell>
  );
}

export {
  OnboardingComplete,
};
