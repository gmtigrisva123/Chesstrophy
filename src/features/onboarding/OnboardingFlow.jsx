import { useState } from "react";
import { OnboardingComplete } from "./OnboardingComplete.jsx";
import { OnboardingMascot, OnboardingPrimaryButton, OnboardingProgress, OnboardingShell } from "./OnboardingUI.jsx";
import { ONBOARDING_AREAS, ONBOARDING_LEVELS, ONBOARDING_TIMES } from "../../data/onboarding.js";
import { loadProfile } from "../../services/profile.js";

function OnboardingFlow({ onComplete, onGuest }) {
  const [step, setStep] = useState(0); // 0 welcome, 1 username, 2 level, 3 areas, 4 time, 5 done
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [chessLevel, setChessLevel] = useState("");
  const [improvementAreas, setImprovementAreas] = useState([]);
  const [dailyTrainingTime, setDailyTrainingTime] = useState("");

  // Create Account / Login — email+password, shown as a sub-view of the
  // Welcome step. IMPORTANT: there's no auth backend yet (see profile.email
  // comment on defaultProfile), so the password is validated for a good
  // signup UX but is deliberately never stored anywhere, not even locally —
  // only the email carries through. "Login" can only recognize an account
  // previously created on this same device/browser (matches against the
  // locally saved profile's email); it can't be a real cross-device login
  // until this connects to Supabase/real auth as originally planned.
  const [authMode, setAuthMode] = useState(null); // null | "create" | "login"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const submitCreateAccount = () => {
    if (!validateEmail(email)) { setAuthError("Enter a valid email address"); return; }
    if (password.length < 8) { setAuthError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setAuthError("Passwords don't match"); return; }
    setAuthError("");
    setPassword(""); setConfirmPassword(""); // never carried past this point
    setStep(1);
  };

  const submitLogin = () => {
    if (!validateEmail(email)) { setAuthError("Enter a valid email address"); return; }
    if (!password) { setAuthError("Enter your password"); return; }
    const p = loadProfile();
    if (p.email && p.email.trim().toLowerCase() === email.trim().toLowerCase()) {
      setAuthError("");
      setPassword("");
      onComplete({ onboardingCompleted: true }); // recognized on this device — skip straight into the app
    } else {
      setAuthError("No account found with that email on this device. Try Create Account instead, or continue as guest.");
    }
  };

  const validateUsername = (val) => {
    if (!val.trim()) return "Username is required";
    if (val.trim().length < 3) return "Username must be at least 3 characters";
    if (val.trim().length > 20) return "Username must be 20 characters or fewer";
    if (!/^[a-zA-Z0-9_]+$/.test(val.trim())) return "Only letters, numbers, and underscores allowed";
    return "";
  };

  const toggleArea = (id) => {
    setImprovementAreas(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const goNext = () => setStep(s => s + 1);

  const finish = () => {
    onComplete({
      username: username.trim(),
      ...(email.trim() ? { email: email.trim() } : {}),
      chessLevel,
      improvementAreas,
      dailyTrainingTime,
      onboardingCompleted: true,
    });
  };

  // ── STEP 0 — WELCOME / CREATE ACCOUNT / LOGIN ─────────────────────────────
  if (step === 0) {
    if (authMode === "create" || authMode === "login") {
      const isCreate = authMode === "create";
      return (
        <OnboardingShell>
          <OnboardingMascot size={100} />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "Georgia,serif", fontSize: "1.3rem", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
              {isCreate ? "Create your account" : "Welcome back"}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#9aa3c2" }}>
              {isCreate ? "Just an email and password to get started." : "Log in to pick up where you left off."}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            <div>
              <div style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,255,0.16)",
                borderRadius: 12, padding: "13px 16px",
              }}>
                <input
                  /* eslint-disable-next-line jsx-a11y/no-autofocus --
                     Single-field step in a linear wizard: this input is the only
                     interactive element on screen, so focusing it saves a tab
                     without stealing focus from anything else. */
                  className="onb-input" type="email" autoFocus
                  value={email}
                  onChange={e => { setEmail(e.target.value); setAuthError(""); }}
                  placeholder="Email address"
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontSize: "0.92rem", fontFamily: "inherit" }}
                />
              </div>
            </div>
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,255,0.16)",
                borderRadius: 12, padding: "13px 16px",
              }}>
                <input
                  className="onb-input" type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setAuthError(""); }}
                  onKeyDown={e => e.key === "Enter" && (isCreate ? submitCreateAccount() : submitLogin())}
                  placeholder="Password"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontSize: "0.92rem", fontFamily: "inherit" }}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} style={{ background: "transparent", border: "none", color: "#7d89b0", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}>
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {isCreate && <div style={{ marginTop: 6, fontSize: "0.72rem", color: "#7d89b0" }}>At least 8 characters.</div>}
            </div>
            {isCreate && (
              <div style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,255,0.16)",
                borderRadius: 12, padding: "13px 16px",
              }}>
                <input
                  className="onb-input" type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setAuthError(""); }}
                  onKeyDown={e => e.key === "Enter" && submitCreateAccount()}
                  placeholder="Confirm password"
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontSize: "0.92rem", fontFamily: "inherit" }}
                />
              </div>
            )}
          </div>

          {authError && (
            <div style={{ marginBottom: 16, fontSize: "0.78rem", color: "#ef4444", lineHeight: 1.5 }}>{authError}</div>
          )}

          <OnboardingPrimaryButton onClick={isCreate ? submitCreateAccount : submitLogin}>
            {isCreate ? "Create Account →" : "Log In →"}
          </OnboardingPrimaryButton>

          <button onClick={() => { setAuthMode(null); setAuthError(""); setPassword(""); setConfirmPassword(""); }} style={{
            width: "100%", padding: "12px 0", marginTop: 8, borderRadius: 13,
            background: "transparent", border: "none",
            color: "#7d89b0", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
          }}>← Back</button>
        </OnboardingShell>
      );
    }

    return (
      <OnboardingShell>
        <OnboardingMascot size={128} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>
            Welcome to ChessProphy ♟️
          </div>
          <div style={{ fontSize: "0.9rem", color: "#9aa3c2", lineHeight: 1.6, marginBottom: 30 }}>
            Your journey to becoming a better chess player starts here.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <OnboardingPrimaryButton onClick={() => setAuthMode("create")}>Create Account</OnboardingPrimaryButton>
          <button onClick={() => setAuthMode("login")} style={{
            width: "100%", padding: "13px 0", borderRadius: 13,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,255,0.16)",
            color: "#dbe1f0", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
          }}>Login</button>
          <button onClick={onGuest} style={{
            width: "100%", padding: "12px 0", borderRadius: 13,
            background: "transparent", border: "none",
            color: "#7d89b0", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
          }}>Continue as Guest</button>
        </div>
      </OnboardingShell>
    );
  }

  // ── STEP 1 — USERNAME ─────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <OnboardingShell>
        <OnboardingProgress step={1} total={4} />
        <OnboardingMascot size={90} />
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "1.25rem", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
            What should we call you? 👋
          </div>
          <div style={{ fontSize: "0.85rem", color: "#9aa3c2", lineHeight: 1.6 }}>
            Choose a username for your ChessProphy profile.
          </div>
        </div>
        <div style={{ marginBottom: 22 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.04)", border: `1px solid ${usernameError ? "rgba(239,68,68,0.5)" : "rgba(148,163,255,0.16)"}`,
            borderRadius: 12, padding: "13px 16px",
          }}>
            <span style={{ color: "#7d89b0", fontWeight: 700 }}>@</span>
            <input
              className="onb-input"
              /* eslint-disable-next-line jsx-a11y/no-autofocus -- see the note on the email step above. */
              autoFocus
              value={username}
              onChange={e => { setUsername(e.target.value); setUsernameError(""); }}
              onKeyDown={e => e.key === "Enter" && !validateUsername(username) && goNext()}
              placeholder="username"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontSize: "0.92rem", fontFamily: "inherit" }}
            />
          </div>
          {usernameError && (
            <div style={{ marginTop: 8, fontSize: "0.76rem", color: "#ef4444" }}>{usernameError}</div>
          )}
        </div>
        <OnboardingPrimaryButton onClick={() => {
          const err = validateUsername(username);
          if (err) { setUsernameError(err); return; }
          goNext();
        }}>Continue →</OnboardingPrimaryButton>
      </OnboardingShell>
    );
  }

  // ── STEP 2 — CHESS LEVEL ──────────────────────────────────────────────────
  if (step === 2) {
    return (
      <OnboardingShell wide>
        <OnboardingProgress step={2} total={4} />
        <OnboardingMascot size={84} />
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "1.25rem", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
            Tell me about your chess! ♟️
          </div>
          <div style={{ fontSize: "0.85rem", color: "#9aa3c2" }}>What&apos;s your current chess level?</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
          {ONBOARDING_LEVELS.map(l => {
            const selected = chessLevel === l.id;
            return (
              <button
                key={l.id}
                className="onb-option"
                onClick={() => setChessLevel(l.id)}
                style={{
                  textAlign: "left", padding: "16px 14px", borderRadius: 14, cursor: "pointer",
                  background: selected ? "linear-gradient(135deg,rgba(37,99,235,0.18),rgba(124,58,237,0.18))" : "rgba(255,255,255,0.03)",
                  border: `1.5px solid ${selected ? "#7c3aed" : "rgba(148,163,255,0.14)"}`,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>{l.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#f1f5f9", marginBottom: 3 }}>{l.id}</div>
                <div style={{ fontSize: "0.72rem", color: "#7d89b0", lineHeight: 1.4 }}>{l.desc}</div>
              </button>
            );
          })}
        </div>
        <OnboardingPrimaryButton disabled={!chessLevel} onClick={goNext}>Continue →</OnboardingPrimaryButton>
      </OnboardingShell>
    );
  }

  // ── STEP 3 — IMPROVEMENT AREAS ────────────────────────────────────────────
  if (step === 3) {
    return (
      <OnboardingShell wide>
        <OnboardingProgress step={3} total={4} />
        <OnboardingMascot size={84} />
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "1.25rem", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
            What would you like to improve? 🎯
          </div>
          <div style={{ fontSize: "0.85rem", color: "#9aa3c2" }}>Pick as many as you like.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
          {ONBOARDING_AREAS.map(a => {
            const selected = improvementAreas.includes(a.id);
            return (
              <button
                key={a.id}
                className="onb-option"
                onClick={() => toggleArea(a.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "14px 14px", borderRadius: 14, cursor: "pointer",
                  background: selected ? "linear-gradient(135deg,rgba(37,99,235,0.18),rgba(124,58,237,0.18))" : "rgba(255,255,255,0.03)",
                  border: `1.5px solid ${selected ? "#7c3aed" : "rgba(148,163,255,0.14)"}`,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{a.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "0.84rem", color: "#f1f5f9" }}>{a.id}</span>
                {selected && <span style={{ marginLeft: "auto", color: "#7c3aed", fontWeight: 800 }}>✓</span>}
              </button>
            );
          })}
        </div>
        <OnboardingPrimaryButton disabled={improvementAreas.length === 0} onClick={goNext}>Continue →</OnboardingPrimaryButton>
      </OnboardingShell>
    );
  }

  // ── STEP 4 — DAILY TRAINING TIME ──────────────────────────────────────────
  if (step === 4) {
    return (
      <OnboardingShell wide>
        <OnboardingProgress step={4} total={4} />
        <OnboardingMascot size={84} />
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "1.25rem", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
            How much time can you train each day? ⏱️
          </div>
          <div style={{ fontSize: "0.85rem", color: "#9aa3c2", lineHeight: 1.6 }}>
            We&apos;ll use this to personalize your training experience.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
          {ONBOARDING_TIMES.map(t => {
            const selected = dailyTrainingTime === t.id;
            return (
              <button
                key={t.id}
                className="onb-option"
                onClick={() => setDailyTrainingTime(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "14px 14px", borderRadius: 14, cursor: "pointer",
                  background: selected ? "linear-gradient(135deg,rgba(37,99,235,0.18),rgba(124,58,237,0.18))" : "rgba(255,255,255,0.03)",
                  border: `1.5px solid ${selected ? "#7c3aed" : "rgba(148,163,255,0.14)"}`,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{t.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "0.84rem", color: "#f1f5f9" }}>{t.id}</span>
              </button>
            );
          })}
        </div>
        <OnboardingPrimaryButton disabled={!dailyTrainingTime} onClick={goNext}>Continue →</OnboardingPrimaryButton>
      </OnboardingShell>
    );
  }

  // ── STEP 5 — COMPLETION ───────────────────────────────────────────────────
  if (step === 5) {
    return (
      <OnboardingComplete
        username={username}
        chessLevel={chessLevel}
        improvementAreas={improvementAreas}
        dailyTrainingTime={dailyTrainingTime}
        onEnter={finish}
      />
    );
  }

  return null;
}

export {
  OnboardingFlow,
};
