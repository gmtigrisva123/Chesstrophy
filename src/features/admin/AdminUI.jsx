import { useEffect, useState } from "react";
import { inputStyle } from "./adminUtils.js";

function Card({ t, children, style = {}, pad = 20 }) {
  return <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: pad, ...style }}>{children}</div>;
}

function SectionTitle({ t, title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
      <div>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: "1.45rem", fontWeight: 700, color: t.fg, letterSpacing: "-0.02em", margin: 0 }}>{title}</h2>
        {sub && <div style={{ fontSize: "0.8rem", color: t.muted, marginTop: 4, maxWidth: 640, lineHeight: 1.5 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function Btn({ t, children, onClick, kind = "default", size = "md", disabled = false, type = "button", title, style = {} }) {
  const pal = {
    primary: { bg: `linear-gradient(135deg,${t.G},${t.G}cc)`, color: "#fff", border: "transparent" },
    danger:  { bg: `${t.RED}18`, color: t.RED, border: `${t.RED}44` },
    success: { bg: `${t.GREEN}18`, color: t.GREEN, border: `${t.GREEN}44` },
    ghost:   { bg: "transparent", color: t.muted, border: "transparent" },
    default: { bg: t.dark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.03)", color: t.fg, border: t.border },
  }[kind];
  const padding = size === "sm" ? "6px 11px" : size === "lg" ? "12px 22px" : "9px 16px";
  const fontSize = size === "sm" ? "0.72rem" : size === "lg" ? "0.88rem" : "0.78rem";
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} style={{
      padding, fontSize, fontWeight: 700, borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
      background: pal.bg, color: pal.color, border: `1px solid ${pal.border}`, opacity: disabled ? 0.5 : 1,
      display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", transition: "transform 0.12s, opacity 0.12s", ...style,
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>{children}</button>
  );
}

function Badge({ t, children, color }) {
  const c = color || t.muted;
  return <span style={{ fontSize: "0.62rem", fontWeight: 700, color: c, background: `${c}18`, border: `1px solid ${c}33`, borderRadius: 999, padding: "2px 9px", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{children}</span>;
}

function Field({ t, label, hint, error, children, inline = false }) {
  return (
    <label style={{ display: "flex", flexDirection: inline ? "row" : "column", alignItems: inline ? "center" : "stretch", justifyContent: inline ? "space-between" : undefined, gap: inline ? 14 : 6, marginBottom: 14 }}>
      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: t.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}{hint && <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, color: t.faint, marginLeft: 8 }}>{hint}</span>}
      </span>
      {children}
      {error && <span style={{ fontSize: "0.72rem", color: t.RED }}>{error}</span>}
    </label>
  );
}

function TextInput({ t, value, onChange, placeholder, type = "text", mono = false, disabled = false }) {
  return <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={inputStyle(t, { fontFamily: mono ? "monospace" : "inherit" })} />;
}

function TextArea({ t, value, onChange, placeholder, rows = 4, mono = false }) {
  return <textarea value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={inputStyle(t, { resize: "vertical", lineHeight: 1.55, fontFamily: mono ? "monospace" : "inherit" })} />;
}

function Select({ t, value, onChange, options }) {
  return (
    <select value={value ?? ""} onChange={e => onChange(e.target.value)} style={inputStyle(t)}>
      {options.map(o => { const v = typeof o === "string" ? o : o.value; const l = typeof o === "string" ? o : o.label; return <option key={v} value={v}>{l}</option>; })}
    </select>
  );
}

function Toggle({ t, checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} onClick={() => onChange(!checked)} style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", padding: 0, color: t.fg, fontSize: "0.82rem", fontFamily: "inherit" }}>
      <span style={{ width: 40, height: 22, borderRadius: 999, background: checked ? t.G : (t.dark ? "#1f2937" : "#cbd5e1"), position: "relative", transition: "background 0.15s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}

// Comma/Enter-separated chips.
function TagInput({ t, value = [], onChange, placeholder = "Add and press Enter" }) {
  const [draft, setDraft] = useState("");
  const add = () => { const v = draft.trim(); if (!v) return; if (!value.includes(v)) onChange([...value, v]); setDraft(""); };
  return (
    <div style={{ ...inputStyle(t), display: "flex", flexWrap: "wrap", gap: 6, padding: "6px 8px" }}>
      {value.map(tag => (
        <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${t.G}18`, color: t.G_LT, border: `1px solid ${t.G}33`, borderRadius: 7, padding: "3px 8px", fontSize: "0.74rem", fontWeight: 600 }}>
          {tag}<button type="button" onClick={() => onChange(value.filter(x => x !== tag))} aria-label={`Remove ${tag}`} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: 0, fontSize: "0.8rem" }}>×</button>
        </span>
      ))}
      <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1)); }} onBlur={add} placeholder={value.length ? "" : placeholder} style={{ flex: 1, minWidth: 120, background: "transparent", border: "none", outline: "none", color: t.fg, fontSize: "0.82rem", fontFamily: "inherit", padding: "4px 2px" }} />
    </div>
  );
}

function Stat({ t, label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: "16px 18px", cursor: onClick ? "pointer" : "default", transition: "border-color 0.15s" }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = `${color || t.G}66`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}>
      <div style={{ fontSize: "0.66rem", fontWeight: 700, color: t.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontFamily: "Georgia,serif", fontSize: "1.7rem", fontWeight: 700, color: color || t.fg, marginTop: 6, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: t.faint, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function EmptyState({ t, icon = "📭", title, sub, action }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: t.muted }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, color: t.fg, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: "0.8rem", maxWidth: 420, margin: "0 auto", lineHeight: 1.55 }}>{sub}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

function ToastHost({ t, toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9500, display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
      {toasts.map(x => {
        const c = { success: t.GREEN, error: t.RED, warn: t.AMBER, info: t.G_LT }[x.kind] || t.G_LT;
        return (
          <div key={x.id} style={{ background: t.dark ? "#0d1424" : "#fff", border: `1px solid ${c}55`, borderLeft: `3px solid ${c}`, borderRadius: 12, padding: "12px 14px", boxShadow: "0 12px 30px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", gap: 12, animation: "adminFade 0.2s ease" }}>
            <span style={{ flex: 1, fontSize: "0.8rem", color: t.fg, fontWeight: 600 }}>{x.title}</span>
            {x.undo && <Btn t={t} size="sm" onClick={() => { x.undo(); dismiss(x.id); }}>Undo</Btn>}
            <button onClick={() => dismiss(x.id)} aria-label="Dismiss" style={{ background: "transparent", border: "none", color: t.muted, cursor: "pointer", fontSize: "1rem" }}>×</button>
          </div>
        );
      })}
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ t, open, title, body, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(2,6,16,0.7)", backdropFilter: "blur(4px)" }} />
      <div role="dialog" aria-modal="true" aria-label={title} style={{ position: "relative", background: t.dark ? "#0d1424" : "#fff", border: `1px solid ${t.border}`, borderRadius: 18, padding: 24, maxWidth: 440, width: "100%", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", animation: "adminFade 0.18s ease" }}>
        <div style={{ fontWeight: 800, fontSize: "1rem", color: t.fg, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: "0.82rem", color: t.muted, lineHeight: 1.6, marginBottom: 20 }}>{body}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn t={t} onClick={onCancel}>Cancel</Btn>
          <Btn t={t} kind={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

export {
  Card,
  SectionTitle,
  Btn,
  Badge,
  Field,
  TextInput,
  TextArea,
  Select,
  Toggle,
  TagInput,
  Stat,
  EmptyState,
  ToastHost,
  ConfirmDialog,
};
