import { useMemo } from "react";
import { computeDNAScores, dnaLevel } from "../../services/dnaScores.js";

// ── CHESS DNA WIDGET (Dashboard) ─────────────────────────────────────────────
function ChessDNAWidget({ dark, fg, muted, onExpand }) {
  const PURPLE = "#8b5cf6";
  const dna = useMemo(() => computeDNAScores(), []);
  const overall = dnaLevel(dna.overall);

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        onClick={onExpand}
        style={{
          background: dark
            ? "linear-gradient(135deg,#08060f,#060810,#07100a)"
            : "linear-gradient(135deg,#f5f0ff,#f0f4ff,#f0fdf4)",
          border: `1px solid ${PURPLE}30`,
          borderRadius: 18, padding: "22px 24px",
          cursor: "pointer", transition: "all 0.2s",
          position: "relative", overflow: "hidden",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = `${PURPLE}66`; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${PURPLE}18`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = `${PURPLE}30`; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
      >
        {/* BG glow */}
        <div style={{ position:"absolute",top:-40,right:-40,width:200,height:200,background:`radial-gradient(circle,${PURPLE}18 0%,transparent 70%)`,pointerEvents:"none" }}/>
        <div style={{ position:"absolute",bottom:-40,left:60,width:160,height:160,background:"radial-gradient(circle,#2563EB0a 0%,transparent 70%)",pointerEvents:"none" }}/>

        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${PURPLE},#a78bfa)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:`0 0 14px ${PURPLE}44`,flexShrink:0 }}>🧬</div>
            <div>
              <div style={{ fontWeight:700,fontSize:"0.9rem",color:fg,letterSpacing:"-0.01em" }}>Chess DNA</div>
              <div style={{ fontSize:"0.68rem",color:PURPLE }}>Live cognitive profile · from your activity</div>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"Georgia,serif",fontSize:"1.5rem",fontWeight:800,color:PURPLE,letterSpacing:"-0.03em",lineHeight:1 }}>{dna.overall}</div>
              <div style={{ fontSize:"0.62rem",color:overall.color,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em" }}>{overall.label}</div>
            </div>
            <span style={{ fontSize:"0.74rem",color:PURPLE,fontWeight:700,opacity:0.7 }}>View Full →</span>
          </div>
        </div>

        {/* 6 attribute bars */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 24px" }}>
          {dna.attrs.map(attr => (
            <div key={attr.key}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                  <span style={{ fontSize:12 }}>{attr.icon}</span>
                  <span style={{ fontSize:"0.72rem",color:muted,fontWeight:600 }}>{attr.label}</span>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                  <span style={{ fontSize:"0.7rem",fontWeight:800,color:attr.color }}>{attr.score}</span>
                  <span style={{ fontSize:"0.65rem",color:attr.trend==="↑"?"#2563EB":attr.trend==="↓"?"#ef4444":"#888",fontWeight:700 }}>{attr.trend}</span>
                </div>
              </div>
              <div style={{ height:5,background:dark?"#1a1a1a":"#e8e8e8",borderRadius:3,overflow:"hidden" }}>
                <div style={{
                  height:"100%",borderRadius:3,
                  width:`${attr.score}%`,
                  background:`linear-gradient(90deg,${attr.color},${attr.color}bb)`,
                  boxShadow:`0 0 6px ${attr.color}66`,
                  transition:"width 1s ease",
                }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Footer row */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:12,borderTop:`1px solid ${PURPLE}18` }}>
          <div style={{ display:"flex",gap:14 }}>
            {[
              { label:"Puzzles Solved", val: dna.meta.puzzleSolved },
              { label:"DQ Streak",      val: `${dna.meta.dqStreak}d` },
              { label:"Tree Unlocked",  val: dna.meta.ltUnlocked },
            ].map(m => (
              <div key={m.label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"0.75rem",fontWeight:700,color:fg }}>{m.val}</div>
                <div style={{ fontSize:"0.6rem",color:muted }}>{m.label}</div>
              </div>
            ))}
          </div>
          <span style={{ fontSize:"0.68rem",color:PURPLE,fontWeight:600 }}>
            Click to open full DNA report →
          </span>
        </div>
      </div>
    </div>
  );
}

export {
  ChessDNAWidget,
};
