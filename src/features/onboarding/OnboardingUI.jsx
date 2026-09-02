import { MASCOT_IMG } from "../../assets/mascot.js";

function OnboardingMascot({ size = 120, celebrate = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
      <img
        src={MASCOT_IMG}
        alt="ChessProphy mascot"
        className={celebrate ? "onb-mascot onb-mascot-celebrate" : "onb-mascot"}
        style={{
          width: size, height: size, borderRadius: "50%", objectFit: "cover",
          border: "2px solid rgba(124,58,237,0.4)",
          boxShadow: "0 8px 32px rgba(37,99,235,0.35), 0 0 0 6px rgba(124,58,237,0.08)",
        }}
      />
    </div>
  );
}

function OnboardingProgress({ step, total }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 8 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            height: 4, width: 34, borderRadius: 999,
            background: i < step ? "linear-gradient(90deg,#2563EB,#7c3aed)" : "rgba(148,163,255,0.14)",
            transition: "background 0.25s",
          }} />
        ))}
      </div>
      <div style={{ textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: "#7d89b0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Step {step} of {total}
      </div>
    </div>
  );
}

function OnboardingShell({ children, wide }) {
  return (
    <div style={{
      minHeight: "100vh", background: "radial-gradient(circle at 50% 0%, #14163a 0%, #0a0a13 60%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 18px",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif",
    }}>
      <style>{`
        .onb-mascot { animation: onbFloat 3.2s ease-in-out infinite; }
        .onb-mascot-celebrate { animation: onbCelebrate 1.4s ease-in-out infinite; }
        @keyframes onbFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes onbCelebrate { 0%,100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.05) rotate(-2deg); } }
        .onb-fade { animation: onbFadeIn 0.35s ease both; }
        @keyframes onbFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .onb-option:hover { border-color: rgba(124,58,237,0.5) !important; transform: translateY(-1px); }
        .onb-primary-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 30px rgba(37,99,235,0.4); }
        .onb-input:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.18); }
      `}</style>
      <div className="onb-fade" style={{
        width: "100%", maxWidth: wide ? 560 : 420,
        background: "rgba(13,15,32,0.85)", backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)",
        border: "1px solid rgba(124,58,237,0.18)", borderRadius: 26,
        padding: "40px 32px", boxShadow: "0 32px 90px rgba(0,0,0,0.55)",
      }}>
        {children}
      </div>
    </div>
  );
}

function OnboardingPrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      className="onb-primary-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "14px 0", borderRadius: 13, border: "none",
        background: disabled ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#2563EB,#7c3aed)",
        color: disabled ? "#5a6285" : "#fff",
        fontWeight: 800, fontSize: "0.92rem", cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.18s",
        boxShadow: disabled ? "none" : "0 6px 22px rgba(37,99,235,0.3)",
      }}
    >{children}</button>
  );
}

export {
  OnboardingMascot,
  OnboardingProgress,
  OnboardingShell,
  OnboardingPrimaryButton,
};
