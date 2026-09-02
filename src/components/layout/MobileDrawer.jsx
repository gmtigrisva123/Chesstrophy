import { loadEconomy } from "../../services/economy.js";
import { loadProfile } from "../../services/profile.js";

// Mobile drawer overlay
// Mobile drawer overlay
function MobileDrawer({ dark, active, setActive, setSidebarOpen }) {
  const G = "#2563EB", G_LT = "#60A5FA";
  const bg     = dark ? "#0a0a0a" : "#ffffff";
  const border = dark ? "rgba(148,163,255,0.08)" : "rgba(37,99,235,0.08)";
  const heading = dark ? "#4b5473" : "#9aa3c2";
  const mutedText = dark ? "#8891a8" : "#555";

  // Same groups/routes as the desktop sidebar — restyled only.
  const GROUPS = [
    { label:"Main", items:[
      { id:"Home", icon:"⊞", label:"Dashboard" },
    ]},
    { label:"AI Tools", items:[
      { id:"Puzzles", icon:"🧩", label:"Puzzles" },
      { id:"LearningTree", icon:"🌳", label:"Learning Tree & AI" },
    ]},
    { label:"Learning", items:[
      { id:"Studies", icon:"🎓", label:"Studies" },
      { id:"Openings", icon:"♔", label:"Openings" },
      { id:"Classics", icon:"🏛", label:"Classic Games" },
      { id:"ChessWiki", icon:"📚", label:"ChessWiki" },
    ]},
    { label:"Economy", items:[
      { id:"ProphyStore", icon:"🪙", label:"Prophy Store" },
      { id:"ProphyStudio", icon:"🎬", label:"Prophy Studio" },
    ]},
    { label:"Profile", items:[
      { id:"Profile", icon:"👤", label:"Profile" },
    ]},
  ];

  return (
    <>
      <div onClick={() => setSidebarOpen(false)} style={{
        position: "fixed", inset: 0, zIndex: 299, background: "rgba(2,6,16,0.65)", backdropFilter: "blur(2px)",
      }} />
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 300,
        width: 280, background: bg, borderRight: `1px solid ${border}`,
        display: "flex", flexDirection: "column",
        boxShadow: "8px 0 32px rgba(0,0,0,0.35)",
      }}>
        {/* ── Logo ── */}
        <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 22px", borderBottom: `1px solid ${border}`, gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, background: "linear-gradient(135deg,#2563EB,#60A5FA)",
            borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, color: "#fff", fontWeight: 900, boxShadow: "0 3px 10px #2563EB55",
          }}>♞</div>
          <span style={{ fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: "0.95rem", color: dark ? "#f1f5f9" : "#111" }}>
            Chess<span style={{ color: "#60A5FA" }}>Prophy</span>
          </span>
          {loadProfile().isGuest && (
            <span style={{
              marginLeft: "auto", fontSize: "0.6rem", fontWeight: 700, color: "#a78bfa",
              background: "#7c3aed22", border: "1px solid #7c3aed44", borderRadius: 999,
              padding: "3px 8px", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
            }}>Guest</span>
          )}
        </div>

        {/* ── Prophy Coins — prominent, pinned at the very top above navigation ── */}
        <div style={{ padding: "16px 18px 6px", flexShrink: 0 }}>
          <button
            onClick={() => { setActive("Profile"); setSidebarOpen(false); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 15px", borderRadius: 16,
              background: dark ? `linear-gradient(135deg, ${G}22, ${G}08)` : `linear-gradient(135deg, ${G}14, ${G}05)`,
              border: `1px solid ${G}3d`, cursor: "pointer", textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg,${G},${G_LT})`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>🪙</div>
              <div>
                <div style={{ fontSize: "0.64rem", fontWeight: 700, color: G_LT, textTransform: "uppercase", letterSpacing: "0.07em" }}>Prophy Coins</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: dark ? "#f1f5f9" : "#111" }}>{(loadEconomy().coins || 0).toLocaleString()}</div>
              </div>
            </div>
            <span style={{ color: G_LT, fontSize: 14, opacity: 0.7 }}>›</span>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0 8px" }}>
          {GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: "0.64rem", fontWeight: 700, color: heading, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 22px" }}>{group.label}</div>
              {group.items.map(item => {
                const isActive = active === item.id;
                const soon = item.id === "ProphyStudio"; // channel gated — see ProphyStudioComingSoon
                return (
                  <button
                    key={item.id}
                    disabled={soon}
                    title={soon ? "Prophy Studio — coming soon" : undefined}
                    onClick={() => { if (soon) return; setActive(item.id); setSidebarOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
                      padding: "12px 22px 12px 25px",
                      background: isActive ? (dark ? `${G}18` : `${G}0d`) : "transparent",
                      border: "none", borderLeft: `3px solid ${isActive ? G_LT : "transparent"}`,
                      color: soon ? mutedText : (isActive ? G_LT : mutedText),
                      cursor: soon ? "not-allowed" : "pointer", fontWeight: isActive ? 700 : 500, fontSize: "0.9rem",
                      opacity: soon ? 0.5 : 1,
                      transition: "all 0.15s",
                    }}>
                    <span style={{ fontSize: 16, width: 20, flexShrink: 0, textAlign: "center", opacity: isActive ? 1 : 0.75 }}>{item.icon}</span>
                    <span>{item.label}</span>
                    {soon && (
                      <span style={{
                        marginLeft: "auto", fontSize: "0.58rem", fontWeight: 700, color: "#C9A84C",
                        background: "#C9A84C18", border: "1px solid #C9A84C33", borderRadius: 999,
                        padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
                      }}>Soon</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

export {
  MobileDrawer,
};
