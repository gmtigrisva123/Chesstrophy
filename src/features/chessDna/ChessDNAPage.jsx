import { useState, useMemo } from "react";
import { DNARadar } from "./DNARadar.jsx";
import { computeDNAScores, dnaLevel } from "./dnaScores.js";

// ── CHESS DNA FULL PAGE ────────────────────────────────────────────────────────
// Presentational primitives kept at module scope. Declared inside the page they
// would be a fresh component type per render, so every card and bar would be
// destroyed and rebuilt whenever any piece of DNA state changed.
function Card({ children, style = {}, card, border }) {
  return <div style={{ background:card,border:`1px solid ${border}`,borderRadius:14,...style }}>{children}</div>;
}

function Pb({ value, color, h = 6, dark }) {
  return (
    <div style={{ height:h,background:dark?"#1e1e1e":"#ebebeb",borderRadius:h,overflow:"hidden" }}>
      <div style={{ height:"100%",width:`${Math.min(100,value)}%`,background:`linear-gradient(90deg,${color},${color}bb)`,borderRadius:h,boxShadow:`0 0 6px ${color}55`,transition:"width 0.8s ease" }}/>
    </div>
  );
}

function ChessDNAPage({ dark }) {
  const PURPLE = "#8b5cf6";
  const G      = "#2563EB";
  const GOLD   = "#C9A84C";
  const AMBER  = "#f59e0b";
  const BLUE   = "#60a5fa";
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#666"    : "#888";
  const card   = dark ? "#0f0f0f" : "#fff";
  const border = dark ? "#1a1a1a" : "#e8e8e8";

  const dna = useMemo(() => computeDNAScores(), []);
  const overall = dnaLevel(dna.overall);
  const [selectedAttr, setSelectedAttr] = useState(null);

  // Derived strengths/weaknesses
  const sorted   = [...dna.attrs].sort((a,b) => b.score - a.score);
  const strengths = sorted.slice(0, 2);
  const weaknesses = sorted.slice(-2).reverse();

  // Simulated weekly history (would come from real session logs)
  const weekHistory = [
    { day:"Mon", overall: Math.max(20, dna.overall - 8) },
    { day:"Tue", overall: Math.max(20, dna.overall - 5) },
    { day:"Wed", overall: Math.max(20, dna.overall - 6) },
    { day:"Thu", overall: Math.max(20, dna.overall - 3) },
    { day:"Fri", overall: Math.max(20, dna.overall - 2) },
    { day:"Sat", overall: Math.max(20, dna.overall - 1) },
    { day:"Today", overall: dna.overall },
  ];

  const graphH = 80, graphW = 340;
  const scores  = weekHistory.map(d => d.overall);
  const gMin = Math.min(...scores) - 5, gMax = Math.max(...scores) + 5;
  const sparkPts = scores.map((v,i) => {
    const x = (i/(scores.length-1)) * graphW;
    const y = graphH - ((v-gMin)/(gMax-gMin+1)) * graphH * 0.85 - 4;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{ maxWidth:960,margin:"0 auto",animation:"ltFade 0.35s ease" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:"0.7rem",color:PURPLE,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8 }}>Cognitive Profile</div>
        <h2 style={{ fontFamily:"Georgia,serif",fontSize:"clamp(1.5rem,3vw,2rem)",fontWeight:700,color:fg,letterSpacing:"-0.03em",marginBottom:4 }}>
          🧬 Chess DNA
        </h2>
        <p style={{ fontSize:"0.85rem",color:muted }}>Your AI-generated cognitive profile — built from your puzzles, openings, questions, and learning tree activity.</p>
      </div>

      {/* ── Overall score hero ── */}
      <div style={{
        background:dark?"linear-gradient(135deg,#08060f,#060810,#07100a)":"linear-gradient(135deg,#f5f0ff,#f0f4ff,#f0fdf4)",
        border:`1px solid ${PURPLE}30`,borderRadius:20,padding:"28px 28px",marginBottom:20,
        position:"relative",overflow:"hidden",
      }}>
        <div style={{ position:"absolute",top:-50,right:-50,width:250,height:250,background:`radial-gradient(circle,${PURPLE}18 0%,transparent 70%)`,pointerEvents:"none" }}/>
        <div style={{ display:"flex",gap:28,alignItems:"center",flexWrap:"wrap" }}>
          {/* Radar */}
          <div style={{ flexShrink:0 }}>
            <DNARadar attrs={dna.attrs} size={200}/>
          </div>
          {/* Summary */}
          <div style={{ flex:1,minWidth:220 }}>
            <div style={{ display:"flex",alignItems:"baseline",gap:12,marginBottom:6 }}>
              <div style={{ fontFamily:"Georgia,serif",fontSize:"3rem",fontWeight:800,color:PURPLE,letterSpacing:"-0.04em",lineHeight:1 }}>{dna.overall}</div>
              <div>
                <div style={{ fontWeight:700,fontSize:"1rem",color:overall.color }}>{overall.label}</div>
                <div style={{ fontSize:"0.72rem",color:muted }}>Overall DNA Score</div>
              </div>
            </div>
            <p style={{ fontSize:"0.82rem",color:muted,lineHeight:1.7,marginBottom:16,maxWidth:360 }}>
              Your Chess DNA is computed from {dna.meta.puzzleSolved} puzzles solved, {dna.meta.ltUnlocked} learning tree nodes unlocked, and your daily question performance.
            </p>
            {/* Strength + Weakness chips */}
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {strengths.map(a=>(
                <span key={a.key} style={{ fontSize:"0.72rem",fontWeight:700,color:G,background:`${G}15`,border:`1px solid ${G}30`,borderRadius:999,padding:"3px 12px" }}>💪 {a.label}</span>
              ))}
              {weaknesses.map(a=>(
                <span key={a.key} style={{ fontSize:"0.72rem",fontWeight:700,color:AMBER,background:`${AMBER}15`,border:`1px solid ${AMBER}30`,borderRadius:999,padding:"3px 12px" }}>🎯 {a.label}</span>
              ))}
            </div>
          </div>
          {/* Weekly sparkline */}
          <div style={{ flexShrink:0,minWidth:180 }}>
            <div style={{ fontSize:"0.72rem",color:muted,fontWeight:700,marginBottom:8 }}>Weekly Progress</div>
            <div style={{ background:dark?"#0a0a0a":"#f8f8f8",borderRadius:10,padding:"12px 10px" }}>
              <svg width={graphW} height={graphH} viewBox={`0 0 ${graphW} ${graphH}`}>
                <defs>
                  <linearGradient id="dnafill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PURPLE} stopOpacity="0.35"/>
                    <stop offset="100%" stopColor={PURPLE} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <polygon points={`0,${graphH} ${sparkPts} ${graphW},${graphH}`} fill="url(#dnafill)"/>
                <polyline points={sparkPts} fill="none" stroke={PURPLE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                {scores.map((v,i)=>{
                  const x=(i/(scores.length-1))*graphW;
                  const y=graphH-((v-gMin)/(gMax-gMin+1))*graphH*0.85-4;
                  return <circle key={i} cx={x} cy={y} r={i===scores.length-1?4:2.5} fill={PURPLE} opacity={i===scores.length-1?1:0.6}/>;
                })}
              </svg>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.6rem",color:muted,marginTop:4 }}>
                {weekHistory.map(d=><span key={d.day}>{d.day}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6 attribute cards ── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,marginBottom:20 }}>
        {dna.attrs.map(attr => {
          const lv = dnaLevel(attr.score);
          const isSelected = selectedAttr?.key === attr.key;
          return (
            <Card card={card} border={border} key={attr.key} style={{ padding:"18px 18px",border:`1px solid ${isSelected?attr.color+"55":border}`,cursor:"pointer",transition:"all 0.18s" }}
              onClick={() => setSelectedAttr(isSelected ? null : attr)}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  <div style={{ width:36,height:36,borderRadius:10,background:`${attr.color}18`,border:`1px solid ${attr.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{attr.icon}</div>
                  <div>
                    <div style={{ fontWeight:700,fontSize:"0.85rem",color:fg }}>{attr.label}</div>
                    <div style={{ fontSize:"0.66rem",color:lv.color,fontWeight:700 }}>{lv.label}</div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:800,color:attr.color,lineHeight:1 }}>{attr.score}</div>
                  <div style={{ fontSize:"0.75rem",fontWeight:700,color:attr.trend==="↑"?"#2563EB":attr.trend==="↓"?"#ef4444":"#888" }}>{attr.trend}</div>
                </div>
              </div>
              <Pb dark={dark} value={attr.score} color={attr.color} h={6}/>
              {isSelected && (
                <div style={{ marginTop:12,padding:"10px 12px",background:dark?"#141414":"#f8f8f8",borderRadius:9,fontSize:"0.78rem",color:muted,lineHeight:1.6,animation:"ltFade 0.2s ease" }}>
                  💡 {attr.explain}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── AI Summary + Recommendations ── */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20 }}>
        {/* Strengths */}
        <Card card={card} border={border} style={{ padding:"20px 20px" }}>
          <div style={{ fontWeight:700,fontSize:"0.88rem",color:fg,marginBottom:14 }}>💪 Strengths</div>
          {strengths.map(a=>(
            <div key={a.key} style={{ display:"flex",gap:10,alignItems:"center",marginBottom:10,padding:"10px 12px",background:`${a.color}0a`,border:`1px solid ${a.color}22`,borderRadius:10 }}>
              <span style={{ fontSize:18 }}>{a.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:"0.82rem",color:fg,marginBottom:2 }}>{a.label}</div>
                <Pb dark={dark} value={a.score} color={a.color} h={4}/>
              </div>
              <span style={{ fontFamily:"Georgia,serif",fontSize:"1rem",fontWeight:700,color:a.color }}>{a.score}</span>
            </div>
          ))}
        </Card>

        {/* Weaknesses + recommended training */}
        <Card card={card} border={border} style={{ padding:"20px 20px" }}>
          <div style={{ fontWeight:700,fontSize:"0.88rem",color:fg,marginBottom:14 }}>🎯 Focus Areas</div>
          {weaknesses.map(a=>(
            <div key={a.key} style={{ display:"flex",gap:10,alignItems:"center",marginBottom:10,padding:"10px 12px",background:`${AMBER}0a`,border:`1px solid ${AMBER}22`,borderRadius:10 }}>
              <span style={{ fontSize:18 }}>{a.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:"0.82rem",color:fg,marginBottom:2 }}>{a.label}</div>
                <Pb dark={dark} value={a.score} color={AMBER} h={4}/>
              </div>
              <span style={{ fontFamily:"Georgia,serif",fontSize:"1rem",fontWeight:700,color:AMBER }}>{a.score}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* ── AI Summary Card ── */}
      <Card card={card} border={border} style={{ padding:"22px 24px",marginBottom:20,border:`1px solid ${PURPLE}22`,background:dark?"linear-gradient(135deg,#09070f,#070a0e)":"linear-gradient(135deg,#f8f5ff,#f5f8ff)" }}>
        <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
          <div style={{ width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${PURPLE},#a78bfa)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,boxShadow:`0 0 12px ${PURPLE}44` }}>🧠</div>
          <div>
            <div style={{ fontWeight:700,fontSize:"0.88rem",color:fg,marginBottom:8 }}>AI Summary</div>
            <p style={{ fontSize:"0.83rem",color:muted,lineHeight:1.7,marginBottom:12 }}>
              Based on your activity, your strongest attribute is <strong style={{color:strengths[0].color}}>{strengths[0].label}</strong> ({strengths[0].score}/100), 
              powered by your puzzle training. Your biggest growth opportunity is <strong style={{color:AMBER}}>{weaknesses[0].label}</strong> ({weaknesses[0].score}/100) — 
              unlocking more nodes in the <strong style={{color:G}}>Endgame branch</strong> of the Learning Tree would have the highest impact this week.
            </p>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[
                { icon:"🧩", label:"Practice puzzles daily",    color:G      },
                { icon:"🌳", label:"Unlock Endgame branch",     color:PURPLE },
                { icon:"📊", label:"Complete Daily Questions",  color:BLUE   },
                { icon:"♔",  label:"Study King & Pawn endings", color:GOLD   },
              ].map(r=>(
                <div key={r.label} style={{ display:"flex",gap:7,alignItems:"center",padding:"8px 10px",background:dark?"#141414":"#f5f5f5",borderRadius:9 }}>
                  <span style={{fontSize:14}}>{r.icon}</span>
                  <span style={{fontSize:"0.75rem",color:fg,fontWeight:500}}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Activity context ── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12 }}>
        {[
          { label:"Puzzles Solved",    val:dna.meta.puzzleSolved, icon:"🧩", color:G      },
          { label:"DQ Streak",         val:`${dna.meta.dqStreak}d`,icon:"🔥",color:AMBER  },
          { label:"Openings Streak",   val:`${dna.meta.opStreak}d`,icon:"📖",color:GOLD   },
          { label:"Tree Nodes",        val:dna.meta.ltUnlocked,   icon:"🌳", color:PURPLE },
          { label:"DNA Score",         val:dna.overall,           icon:"🧬", color:PURPLE },
          { label:"DNA Level",         val:overall.label,         icon:"⭐", color:overall.color },
        ].map(s=>(
          <Card card={card} border={border} key={s.label} style={{ padding:"14px 14px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6 }}><span>{s.icon}</span><span style={{fontSize:"0.62rem",color:muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.label}</span></div>
            <div style={{ fontFamily:"Georgia,serif",fontSize:"1.2rem",fontWeight:700,color:s.color }}>{s.val}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export {
  ChessDNAPage,
};
