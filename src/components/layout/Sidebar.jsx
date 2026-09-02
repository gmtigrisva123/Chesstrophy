import { loadEconomy } from "../../services/economy.js";
import { loadProfile } from "../../services/profile.js";

// Grouped nav for visual hierarchy — same routes/items as the original NAV_ITEMS list, restyled only.
const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { id:"Home",         icon:"⊞",  label:"Dashboard"       },
    ]
  },
  {
    label: "AI Tools",
    items: [
      { id:"Puzzles",      icon:"🧩", label:"Puzzles"          },
      { id:"LearningTree", icon:"🌳", label:"Learning Tree & AI" },
    ]
  },
  {
    label: "Learning",
    items: [
      { id:"Studies",   icon:"🎓", label:"Studies"       },
      { id:"Openings",  icon:"♔",  label:"Openings"     },
      { id:"Classics",  icon:"🏛", label:"Classic Games" },
      { id:"ChessWiki", icon:"📚", label:"ChessWiki"     },
    ]
  },
  {
    label: "Economy",
    items: [
      { id:"ProphyStore",  icon:"🪙", label:"Prophy Store"      },
      { id:"ProphyStudio", icon:"🎬", label:"Prophy Studio"     },
    ]
  },
  {
    label: "Profile",
    items: [
      { id:"Profile", icon:"👤", label:"Profile" },
    ]
  },
];

// Module scope: defining this inside Sidebar would make it a new component type
// on every render, remounting all nine nav buttons (and losing their hover state)
// whenever the coin balance or active route changes.
function NavBtn({ item, active, setActive, theme }) {
  const { G, G_LT, dark, mutedText } = theme;
  const isActive = active === item.id;
  const soon = item.id === "ProphyStudio"; // channel gated — see ProphyStudioComingSoon
  return (
    <button
      disabled={soon}
      onClick={() => { if (!soon) setActive(item.id); }}
      title={soon ? "Prophy Studio — coming soon" : undefined}
      aria-current={isActive ? "page" : undefined}
      style={{
        display:"flex", alignItems:"center", gap:14,
        width:"100%", textAlign:"left",
        padding:"12px 20px 12px 23px",
        background: isActive ? (dark ? `${G}18` : `${G}0d`) : "transparent",
        border:"none", borderLeft:`3px solid ${isActive ? G_LT : "transparent"}`,
        color: soon ? mutedText : (isActive ? G_LT : mutedText),
        fontWeight: isActive ? 700 : 500,
        fontSize:"0.86rem",
        cursor: soon ? "not-allowed" : "pointer",
        opacity: soon ? 0.5 : 1,
        transition:"background 0.15s ease, color 0.15s ease",
        whiteSpace:"nowrap",
      }}
      onMouseEnter={e => {
        if (!isActive && !soon) {
          e.currentTarget.style.background = dark ? "rgba(148,163,255,0.05)" : "rgba(37,99,235,0.04)";
          e.currentTarget.style.color = dark ? "#dbe1f0" : "#222";
        }
      }}
      onMouseLeave={e => {
        if (!isActive && !soon) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = mutedText;
        }
      }}
    >
      <span style={{ fontSize:16, width:20, flexShrink:0, textAlign:"center", opacity: isActive ? 1 : 0.75 }}>{item.icon}</span>
      <span style={{ letterSpacing:"-0.01em" }}>{item.label}</span>
      {soon && (
        <span style={{
          marginLeft:"auto", fontSize:"0.58rem", fontWeight:700, color:"#C9A84C",
          background:"#C9A84C18", border:"1px solid #C9A84C33", borderRadius:999,
          padding:"2px 7px", textTransform:"uppercase", letterSpacing:"0.06em", flexShrink:0,
        }}>Soon</span>
      )}
    </button>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ dark, active, setActive }) {
  const G      = "#2563EB";
  const G_LT   = "#60A5FA";
  const bg     = dark ? "#0a0a0a" : "#ffffff";
  const border = dark ? "rgba(148,163,255,0.08)" : "rgba(37,99,235,0.08)";
  const fg     = dark ? "#f1f5f9" : "#111";
  const heading = dark ? "#4b5473" : "#9aa3c2";
  const mutedText = dark ? "#8891a8" : "#666";
  const navTheme = { G, G_LT, dark, mutedText };

  return (
    <aside style={{
      position:"fixed", top:0, left:0, bottom:0, zIndex:200,
      width:280,
      background:bg,
      borderRight:`1px solid ${border}`,
      display:"flex", flexDirection:"column",
      overflow:"hidden",
    }}>

      {/* ── Logo ── */}
      <div style={{
        height:64, display:"flex", alignItems:"center",
        padding:"0 24px",
        borderBottom:`1px solid ${border}`,
        gap:10, flexShrink:0,
      }}>
        <div style={{
          width:32, height:32, flexShrink:0,
          background:`linear-gradient(135deg,${G},${G_LT})`,
          borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:17, color:"#fff", fontWeight:900,
          boxShadow:`0 3px 10px ${G}55`,
        }}>♞</div>
        <span style={{ fontFamily:"'Georgia',serif", fontWeight:700, fontSize:"1rem", color:fg, whiteSpace:"nowrap", letterSpacing:"-0.02em" }}>
          Chess<span style={{ color:G_LT }}>Prophy</span>
        </span>
        {loadProfile().isGuest && (
          <span style={{
            marginLeft:"auto", fontSize:"0.6rem", fontWeight:700, color:"#a78bfa",
            background:"#7c3aed22", border:"1px solid #7c3aed44", borderRadius:999,
            padding:"3px 8px", textTransform:"uppercase", letterSpacing:"0.06em", flexShrink:0,
          }}>Guest</span>
        )}
      </div>

      {/* ── Prophy Coins — prominent, pinned at the very top above navigation ── */}
      <div style={{ padding:"18px 20px 6px", flexShrink:0 }}>
        <button
          onClick={() => setActive("Profile")}
          title="Prophy Coins"
          style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"14px 16px", borderRadius:16,
            background: dark ? `linear-gradient(135deg, ${G}22, ${G}08)` : `linear-gradient(135deg, ${G}14, ${G}05)`,
            border:`1px solid ${G}3d`,
            cursor:"pointer", textAlign:"left", transition:"all 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${G}70`; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = `${G}3d`; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
            <div style={{
              width:36, height:36, borderRadius:11, flexShrink:0,
              background:`linear-gradient(135deg,${G},${G_LT})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17, boxShadow:`0 3px 10px ${G}44`,
            }}>🪙</div>
            <div>
              <div style={{ fontSize:"0.66rem", fontWeight:700, color:G_LT, textTransform:"uppercase", letterSpacing:"0.07em" }}>Prophy Coins</div>
              <div style={{ fontSize:"1.05rem", fontWeight:800, color:fg, marginTop:1 }}>{(loadEconomy().coins || 0).toLocaleString()}</div>
            </div>
          </div>
          <span style={{ color:G_LT, fontSize:15, opacity:0.7 }}>›</span>
        </button>
      </div>

      {/* ── Nav groups ── */}
      <nav style={{ flex:1, padding:"8px 0 12px", display:"flex", flexDirection:"column", gap:0, overflowY:"auto", overflowX:"hidden" }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom:12 }}>
            <div style={{
              fontSize:"0.66rem", fontWeight:700, color:heading,
              letterSpacing:"0.1em", textTransform:"uppercase",
              padding:"8px 23px 8px",
            }}>{group.label}</div>
            <div style={{ display:"flex", flexDirection:"column" }}>
              {group.items.map(item => <NavBtn key={item.id} item={item} active={active} setActive={setActive} theme={navTheme} />)}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export {
  Sidebar,
};
