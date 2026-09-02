import { NAV_ITEMS } from "../../data/navigation.js";
import { loadEconomy } from "../../services/economy.js";

// ── TOPBAR (thin, just for mobile + page title) ───────────────────────────────
function Topbar({ dark, active, sidebarOpen, setSidebarOpen }) {
  const bg     = dark ? "rgba(9,15,30,0.85)" : "rgba(255,255,255,0.85)";
  const border = dark ? "rgba(148,163,255,0.12)" : "rgba(37,99,235,0.10)";
  const fg     = dark ? "#f1f5f9" : "#111";
  const label  = NAV_ITEMS.find(n => n.id === active)?.label || active;
  const G = "#2563EB", G_LT = "#60A5FA";
  const coins = (loadEconomy().coins || 0);

  return (
    <header style={{
      position: "fixed", top: 0, right: 0, left: 0, zIndex: 150,
      height: 58, background: bg, backdropFilter: "blur(16px) saturate(160%)",
      WebkitBackdropFilter: "blur(16px) saturate(160%)",
      borderBottom: `1px solid ${border}`,
      display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
    }} className="mobile-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 28, height: 28, flexShrink: 0, background: "linear-gradient(135deg,#2563EB,#60A5FA)",
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "#fff", fontWeight: 900, boxShadow: "0 2px 8px #2563EB55",
        }}>♞</div>
        <span style={{ fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: "0.85rem", color: fg, whiteSpace: "nowrap" }}>
          Chess<span style={{ color: "#60A5FA" }}>Prophy</span>
        </span>
        <span style={{ fontSize: "0.78rem", color: "#60A5FA", fontWeight: 700, marginLeft: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      </div>

      {/* Prophy Coins */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
        background: dark ? `${G}18` : `${G}0f`, border: `1px solid ${G}40`,
        borderRadius: 999, padding: "5px 11px 5px 7px",
      }}>
        <span style={{
          width: 20, height: 20, borderRadius: "50%", background: `linear-gradient(135deg,${G},${G_LT})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0,
        }}>🪙</span>
        <span style={{ fontSize: "0.76rem", fontWeight: 800, color: fg }}>{coins.toLocaleString()}</span>
      </div>

      <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
        background: "transparent", border: "none", cursor: "pointer",
        fontSize: 20, color: fg, padding: 4, flexShrink: 0,
      }}>☰</button>
    </header>
  );
}

export {
  Topbar,
};
