import { useEffect, useState } from "react";
import { Btn, Field, TextInput, Toggle } from "./AdminUI.jsx";
import { adminAuthMode, hasLocalPasscode, lockoutRemaining, setLocalPasscode, signInAdminRemote, startAdminSession, validatePasscode, verifyLocalPasscode } from "../../services/adminAuth.js";

// ── Admin sign-in ─────────────────────────────────────────────────────────────
// Local mode: create a passcode on first visit, then enter it. Remote mode:
// sign in with the Supabase account that holds the admin role.
function AdminLogin({ t, onSignedIn, onExit }) {
  const mode = adminAuthMode();
  const setup = mode === "local" && !hasLocalPasscode();
  const [passcode, setPasscode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lock, setLock] = useState(lockoutRemaining());

  useEffect(() => {
    if (lock <= 0) return;
    const id = setInterval(() => setLock(lockoutRemaining()), 500);
    return () => clearInterval(id);
  }, [lock]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "remote") {
        await signInAdminRemote({ email: email.trim(), password: passcode, remember });
      } else if (setup) {
        const problem = validatePasscode(passcode);
        if (problem) throw new Error(problem);
        if (passcode !== confirm) throw new Error("The two passcodes do not match.");
        await setLocalPasscode(passcode);
        startAdminSession({ actor: "site owner", role: "admin", mode: "local", remember });
      } else {
        const ok = await verifyLocalPasscode(passcode);
        if (!ok) {
          const remaining = lockoutRemaining();
          setLock(remaining);
          throw new Error(remaining > 0 ? "Too many attempts — wait a moment." : "Incorrect passcode.");
        }
        startAdminSession({ actor: "site owner", role: "admin", mode: "local", remember });
      }
      onSignedIn();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "remote" ? "Admin sign in" : setup ? "Create your admin passcode" : "Admin sign in";
  const blurb = mode === "remote"
    ? "Sign in with the account that holds the admin or moderator role. Roles are granted in the database (supabase/README.md → Grant yourself admin) and enforced by row-level security on every write."
    : setup
      ? "No backend is configured, so the admin panel is protected by a passcode stored (salted and hashed) in this browser. Pick one now — you will need it on every visit."
      : "Enter the passcode you created for this browser.";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: t.bg, color: t.fg, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(600px 300px at 20% 10%, ${t.G}22, transparent 60%), radial-gradient(500px 300px at 90% 90%, ${t.PURPLE}18, transparent 60%)` }} />
      <form onSubmit={submit} style={{ position: "relative", width: "100%", maxWidth: 420, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 22, padding: 30, boxShadow: "0 30px 80px rgba(0,0,0,0.45)", animation: "adminFade 0.25s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg,${t.G},${t.G_LT})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff", boxShadow: `0 4px 14px ${t.G}55` }}>♞</div>
          <div>
            <div style={{ fontSize: "0.66rem", fontWeight: 700, color: t.G_LT, textTransform: "uppercase", letterSpacing: "0.1em" }}>ChessProphy · Admin</div>
            <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>{title}</div>
          </div>
        </div>
        <p style={{ fontSize: "0.8rem", color: t.muted, lineHeight: 1.6, marginBottom: 20 }}>{blurb}</p>

        {mode === "remote" && (
          <Field t={t} label="Email"><TextInput t={t} type="email" value={email} onChange={setEmail} placeholder="you@example.com" /></Field>
        )}
        <Field t={t} label={mode === "remote" ? "Password" : "Passcode"} hint={setup ? "8+ characters" : undefined}>
          <TextInput t={t} type="password" value={passcode} onChange={setPasscode} />
        </Field>
        {setup && (
          <Field t={t} label="Confirm passcode"><TextInput t={t} type="password" value={confirm} onChange={setConfirm} /></Field>
        )}
        <div style={{ marginBottom: 18 }}>
          <Toggle t={t} checked={remember} onChange={setRemember} label="Keep me signed in for 7 days on this device" />
        </div>

        {error && <div style={{ background: `${t.RED}14`, border: `1px solid ${t.RED}44`, color: t.RED, borderRadius: 10, padding: "10px 12px", fontSize: "0.78rem", marginBottom: 14 }}>{error}</div>}
        {lock > 0 && <div style={{ fontSize: "0.74rem", color: t.AMBER, marginBottom: 12 }}>Locked for {Math.ceil(lock / 1000)}s after repeated failures.</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <Btn t={t} kind="primary" type="submit" size="lg" disabled={busy || lock > 0} style={{ flex: 1, justifyContent: "center" }}>{busy ? "…" : setup ? "Create & enter" : "Sign in"}</Btn>
          <Btn t={t} size="lg" onClick={onExit}>Back to site</Btn>
        </div>

        {mode === "local" && !setup && (
          <div style={{ fontSize: "0.7rem", color: t.faint, marginTop: 16, lineHeight: 1.6 }}>
            Forgot it? Clearing this site&apos;s browser storage removes the passcode along with every other locally stored setting.
          </div>
        )}
        {mode === "local" && (
          <div style={{ fontSize: "0.7rem", color: t.faint, marginTop: 10, lineHeight: 1.6 }}>
            Local mode protects the screens, not the data: everything already lives in this browser. Configure Supabase for real, server-enforced roles.
          </div>
        )}
      </form>
    </div>
  );
}

export {
  AdminLogin,
};
