import { useState } from "react";

// ── Admin design tokens ──────────────────────────────────────────────────────
// The panel is its own surface: denser than the learner app, always the same
// blue accent, and readable in both themes.
function adminTheme(dark) {
  return {
    dark,
    G: "#2563EB", G_LT: "#60A5FA", GOLD: "#C9A84C", RED: "#ef4444", GREEN: "#22c55e", AMBER: "#f59e0b", PURPLE: "#8b5cf6",
    bg: dark ? "#070a12" : "#f4f6fb",
    panel: dark ? "#0c111d" : "#ffffff",
    card: dark ? "rgba(17,24,39,0.7)" : "#ffffff",
    raised: dark ? "#111827" : "#f8fafc",
    border: dark ? "rgba(148,163,255,0.12)" : "rgba(15,23,42,0.10)",
    fg: dark ? "#f1f5f9" : "#0f172a",
    muted: dark ? "#8891a8" : "#64748b",
    faint: dark ? "#4b5473" : "#94a3b8",
    input: dark ? "#0b1020" : "#ffffff",
  };
}

function statusColor(t, status) {
  return { published: t.GREEN, active: t.GREEN, live: t.GREEN, pending: t.AMBER, draft: t.muted, archived: t.faint, rejected: t.RED, hidden: t.faint, upcoming: t.G_LT, featured: t.GOLD }[status] || t.muted;
}

const inputStyle = (t, extra = {}) => ({
  width: "100%", boxSizing: "border-box", background: t.input, border: `1px solid ${t.border}`, borderRadius: 10,
  padding: "10px 12px", color: t.fg, fontSize: "0.84rem", fontFamily: "inherit", outline: "none", ...extra,
});

// ── Toasts (with optional Undo) ───────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const dismiss = (id) => setToasts(ts => ts.filter(x => x.id !== id));
  const push = ({ title, kind = "info", undo = null, ttl = 5000 }) => {
    const id = Date.now() + Math.random();
    setToasts(ts => [...ts, { id, title, kind, undo }]);
    setTimeout(() => dismiss(id), ttl);
    return id;
  };
  return { toasts, push, dismiss };
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export {
  adminTheme,
  statusColor,
  inputStyle,
  useToasts,
  fmtDate,
};
