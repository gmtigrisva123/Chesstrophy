import { useState, useRef, useMemo } from "react";
import { NodeDetailPanel } from "./NodeDetailPanel.jsx";
import { ALL_NODES, buildEdges, flatCoords, getNodeStatus, nodeCoords } from "./treeLayout.js";
import { MetricGauge } from "../../components/ui/MetricGauge.jsx";
import { ProgressBar } from "../../components/ui/ProgressBar.jsx";
import { RadarChart } from "../../components/ui/RadarChart.jsx";
import { ADAPTIVE_LESSONS, COGNITIVE_METRICS, PLACEMENT_QUESTIONS, PLAYER_STYLES } from "../../data/coachInsights.js";
import { TREE_DATA } from "../../data/learningTree.js";
import { loadAdminData } from "../../services/adminData.js";
import { buildCognitiveProfile, computeAIInsights, computeResearchFindings, computeResearchSeries, computeSkillRadar, computeWeeklyGoals, isEmptyProfile, recommendBranch } from "../../services/coachAnalytics.js";
import { loadCMState, saveCMState } from "../../services/coachState.js";
import { loadLTState, saveLTState, treeXP } from "../../services/learningTreeState.js";
import { DailyQuestionsSection } from "../dailyQuestions/DailyQuestionsSection.jsx";

// ── MAIN LEARNING TREE PAGE ───────────────────────────────────────────────────
// Module scope: nested inside LearningTreePage these are a new component type
// per render, so every card, tab and badge in the tree would be torn down and
// rebuilt whenever any tree state changed.
function TabBtn({ id, icon, label, tab, setTab, accent, border, muted }) {
  const isActive = tab === id;
  return (
    <button onClick={() => setTab(id)} aria-pressed={isActive} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
      background: isActive ? `${accent}18` : "transparent",
      border: `1px solid ${isActive ? accent + "55" : border}`,
      borderRadius: 10, color: isActive ? accent : muted,
      fontWeight: isActive ? 700 : 500, fontSize: "0.78rem",
      cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
    }}
    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = accent + "44"; e.currentTarget.style.color = accent; } }}
    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; } }}>
      <span>{icon}</span><span>{label}</span>
    </button>
  );
}

function SCard({ children, style = {}, card, border }) {
  return <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, ...style }}>{children}</div>;
}

function DiffBadge({ level, beginnerColor, intermediateColor }) {
  const c = level === "Beginner" ? beginnerColor : level === "Intermediate" ? intermediateColor : "#ef4444";
  return <span style={{ fontSize: "0.65rem", fontWeight: 700, color: c, background: c + "18", border: `1px solid ${c}33`, borderRadius: 5, padding: "2px 7px" }}>{level}</span>;
}

function LearningTreePage({ dark, setActive }) {
  const [tab, setTab] = useState("tree");
  const G      = "#2563EB";
  const PURPLE = "#8b5cf6";
  const GOLD   = "#C9A84C";
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#666"    : "#888";
  const card   = dark ? "#0f0f0f" : "#fff";
  const border = dark ? "#1a1a1a" : "#e8e8e8";

  const [ltState, setLtState]   = useState(loadLTState);
  const [selected, setSelected] = useState(null);
  const [viewBox, setViewBox]   = useState({ x: -400, y: -60, w: 1000, h: 900 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const svgRef = useRef(null);

  const save = (upd) => { const ns = {...ltState,...upd}; setLtState(ns); saveLTState(ns); };

  const masteredCount = Object.values(ltState.nodeProgress).filter(v => v >= 100).length;
  const totalXP = treeXP(ltState.nodeProgress);

  const handlePractice = (nodeId) => {
    const prog = { ...ltState.nodeProgress, [nodeId]: Math.min(100, (ltState.nodeProgress[nodeId] || 0) + 25) };
    // Auto-unlock children when node reaches 50%
    const unlocked = [...ltState.unlockedNodes];
    if (prog[nodeId] >= 50) {
      (ALL_NODES.filter(n => n.requires?.includes(nodeId))).forEach(child => {
        if (!unlocked.includes(child.id)) unlocked.push(child.id);
      });
    }
    save({ nodeProgress: prog, unlockedNodes: unlocked });
    setSelected(null);
  };

  // Branch mastery from the tree's own records, reused by the overview cards
  // and the recommendation banner so both always agree.
  const branchStats = TREE_DATA.children.map(branch => {
    const branchNodes = flatCoords(branch);
    const unlocked = branchNodes.filter(n => ltState.unlockedNodes.includes(n.id)).length;
    const mastered = branchNodes.filter(n => (ltState.nodeProgress[n.id] || 0) >= 100).length;
    // The next thing to do in this branch: an unlocked node that is not yet
    // mastered — or, when the branch is still locked, the node that unlocks it.
    const next = branchNodes.find(n => ltState.unlockedNodes.includes(n.id) && (ltState.nodeProgress[n.id] || 0) < 100) || null;
    const gate = next ? null : ALL_NODES.find(n => (branch.requires || []).includes(n.id)) || null;
    return { ...branch, unlocked, mastered, total: branchNodes.length, next, gate };
  });
  const recommendation = recommendBranch(branchStats);

  // Pan with mouse drag
  const onMouseDown = (e) => { if (e.button !== 0) return; setDragging(true); setDragStart({ x: e.clientX, y: e.clientY, vb: { ...viewBox } }); };
  const onMouseMove = (e) => {
    if (!dragging || !dragStart) return;
    const scale = viewBox.w / (svgRef.current?.clientWidth || 800);
    setViewBox(v => ({ ...v, x: dragStart.vb.x - (e.clientX - dragStart.x) * scale, y: dragStart.vb.y - (e.clientY - dragStart.y) * scale }));
  };
  const onMouseUp = () => { setDragging(false); setDragStart(null); };
  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(v => ({ x: v.x + v.w*(1-factor)/2, y: v.y + v.h*(1-factor)/2, w: v.w*factor, h: v.h*factor }));
  };

  const rootCoord = useMemo(() => nodeCoords(TREE_DATA), []);
  const allCoords = useMemo(() => flatCoords(rootCoord), [rootCoord]);

  // SVG viewBox bounds
  const xs = allCoords.map(n => n.sx);
  const ys = allCoords.map(n => n.sy);
  const minX = Math.min(...xs) - 80, maxX = Math.max(...xs) + 80;
  const minY = Math.min(...ys) - 60, maxY = Math.max(...ys) + 80;
  const svgW = maxX - minX, svgH = maxY - minY;

  const allEdges = useMemo(() => buildEdges(rootCoord), [rootCoord]);

  const NODE_R = 34;

  const renderTree = () => (
    <div style={{ animation: "ltFade 0.35s ease" }}>
      <style>{`
        @keyframes ltFade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ltSlide { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ltGlow  { 0%,100%{filter:drop-shadow(0 0 4px currentColor)} 50%{filter:drop-shadow(0 0 12px currentColor)} }
        @keyframes ltPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize:"0.7rem",color:G,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8 }}>
          AI-Powered Learning
        </div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:12 }}>
          <div>
            <h2 style={{ fontFamily:"Georgia,serif",fontSize:"clamp(1.5rem,3vw,2rem)",fontWeight:700,color:fg,letterSpacing:"-0.03em" }}>
              🌳 AI Learning Tree
            </h2>
            <p style={{ fontSize:"0.85rem",color:muted,marginTop:4 }}>
              Your complete skill development map. Click any node to explore and train.
            </p>
          </div>
          <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
            <div style={{ background:card,border:`1px solid ${border}`,borderRadius:11,padding:"10px 16px",textAlign:"center" }}>
              <div style={{ fontFamily:"Georgia,serif",fontSize:"1.2rem",fontWeight:700,color:PURPLE }}>{totalXP.toLocaleString()}</div>
              <div style={{ fontSize:"0.62rem",color:muted,textTransform:"uppercase",letterSpacing:"0.06em" }}>Total XP</div>
            </div>
            <div style={{ background:card,border:`1px solid ${border}`,borderRadius:11,padding:"10px 16px",textAlign:"center" }}>
              <div style={{ fontFamily:"Georgia,serif",fontSize:"1.2rem",fontWeight:700,color:G }}>{ltState.unlockedNodes.length}</div>
              <div style={{ fontSize:"0.62rem",color:muted,textTransform:"uppercase",letterSpacing:"0.06em" }}>Nodes Unlocked</div>
            </div>
            <div style={{ background:card,border:`1px solid ${border}`,borderRadius:11,padding:"10px 16px",textAlign:"center" }}>
              <div style={{ fontFamily:"Georgia,serif",fontSize:"1.2rem",fontWeight:700,color:GOLD }}>{masteredCount}</div>
              <div style={{ fontSize:"0.62rem",color:muted,textTransform:"uppercase",letterSpacing:"0.06em" }}>Mastered</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insight banner */}
      <div style={{ background:dark?"linear-gradient(135deg,#0a0d1a,#0d0a1a)":"linear-gradient(135deg,#f0f4ff,#f5f0ff)",border:`1px solid ${PURPLE}33`,borderRadius:14,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12 }}>
        <div style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${PURPLE},#a78bfa)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,boxShadow:`0 0 10px ${PURPLE}44` }}>🧠</div>
        <div>
          <div style={{ fontSize:"0.74rem",fontWeight:700,color:PURPLE,marginBottom:2 }}>AI Recommendation</div>
          <div style={{ fontSize:"0.82rem",color:fg }}>
            {recommendation ? (
              <>
                Your <strong style={{color:"#2563EB"}}>{recommendation.strongest.label}</strong> branch is furthest along
                ({recommendation.strongest.unlocked}/{recommendation.strongest.total} unlocked) while <strong style={{color:"#f59e0b"}}>{recommendation.weakest.label}</strong> is
                behind ({recommendation.weakest.unlocked}/{recommendation.weakest.total}).
                {recommendation.weakest.next
                  ? <> Train <strong style={{color:fg}}>{recommendation.weakest.next.label}</strong> next to open up that branch.</>
                  : recommendation.weakest.gate
                    ? <> Train <strong style={{color:fg}}>{recommendation.weakest.gate.label}</strong> to 50% to unlock it.</>
                    : <> Unlock its first node to start building it up.</>}
              </>
            ) : (
              <>Pick any unlocked node and train it — once a few nodes have progress, this recommendation will point at whichever branch is falling behind.</>
            )}
          </div>
        </div>
      </div>

      {/* Interactive SVG Tree */}
      <div style={{ background:card,border:`1px solid ${border}`,borderRadius:18,overflow:"hidden",marginBottom:20,position:"relative" }}>
        {/* Controls hint */}
        <div style={{ position:"absolute",top:12,right:12,zIndex:10,display:"flex",gap:6 }}>
          <span style={{ fontSize:"0.66rem",color:muted,background:dark?"#141414":"#f0f0f0",borderRadius:6,padding:"3px 8px" }}>Drag to pan · Scroll to zoom</span>
          <button onClick={() => setViewBox({ x: minX - 20, y: minY - 20, w: svgW + 40, h: svgH + 40 })} style={{ fontSize:"0.66rem",color:muted,background:dark?"#141414":"#f0f0f0",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer" }}>Reset View</button>
        </div>

        <svg
          ref={svgRef}
          width="100%" height={560}
          viewBox={`${minX - 20} ${minY - 20} ${svgW + 40} ${svgH + 40}`}
          style={{ cursor: dragging ? "grabbing" : "grab", display: "block" }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <defs>
            {allCoords.map(n => (
              <radialGradient key={n.id} id={`grad_${n.id}`} cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor={n.color || "#888"} stopOpacity="0.35"/>
                <stop offset="100%" stopColor={n.color || "#888"} stopOpacity="0.08"/>
              </radialGradient>
            ))}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>

          {/* Edges */}
          {allEdges.map((e, i) => {
            const status = getNodeStatus(e.id, ltState.unlockedNodes, ltState.nodeProgress);
            const isUnlocked = status !== "locked";
            const progress = ltState.nodeProgress[e.id] || 0;
            return (
              <g key={i}>
                {/* Background track */}
                <line x1={e.x1} y1={e.y1 + NODE_R} x2={e.x2} y2={e.y2 - NODE_R}
                  stroke={dark ? "#1e1e1e" : "#e0e0e0"} strokeWidth={4} strokeLinecap="round"/>
                {/* Progress fill */}
                {isUnlocked && (
                  <line x1={e.x1} y1={e.y1 + NODE_R} x2={e.x2} y2={e.y2 - NODE_R}
                    stroke={e.color} strokeWidth={3} strokeLinecap="round"
                    strokeDasharray="1000" strokeDashoffset={1000 - (progress / 100) * 1000}
                    opacity={0.7} style={{ transition: "stroke-dashoffset 1s ease" }}/>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {allCoords.map(n => {
            const status = getNodeStatus(n.id, ltState.unlockedNodes, ltState.nodeProgress);
            const isLocked = status === "locked";
            const isMastered = status === "mastered";
            const isSelected = selected?.id === n.id;
            const progress = ltState.nodeProgress[n.id] || 0;
            const c = n.color || "#888";
            const isRoot = n.id === "root";

            return (
              <g key={n.id} onClick={() => !isLocked && setSelected(n)}
                style={{ cursor: isLocked ? "not-allowed" : "pointer" }}>
                {/* Glow ring for mastered/selected */}
                {(isMastered || isSelected) && (
                  <circle cx={n.sx} cy={n.sy} r={NODE_R + 8}
                    fill="none" stroke={isSelected ? "#fff" : c}
                    strokeWidth={isSelected ? 2 : 1.5} opacity={0.4}
                    style={{ animation: "ltPulse 2s ease-in-out infinite" }}/>
                )}
                {/* Node circle */}
                <circle cx={n.sx} cy={n.sy} r={isRoot ? NODE_R + 8 : NODE_R}
                  fill={isLocked ? (dark ? "#111" : "#f0f0f0") : `url(#grad_${n.id})`}
                  stroke={isLocked ? (dark ? "#2a2a2a" : "#ddd") : isSelected ? "#fff" : c}
                  strokeWidth={isSelected ? 2.5 : isMastered ? 2 : 1.5}
                  opacity={isLocked ? 0.4 : 1}
                />
                {/* Progress arc */}
                {!isLocked && !isRoot && progress > 0 && (() => {
                  const r2 = NODE_R + 4;
                  const circ = 2 * Math.PI * r2;
                  const dash = (progress / 100) * circ;
                  return (
                    <circle cx={n.sx} cy={n.sy} r={r2}
                      fill="none" stroke={c} strokeWidth={3}
                      strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                      transform={`rotate(-90 ${n.sx} ${n.sy})`}
                      opacity={0.8} style={{ transition: "stroke-dasharray 0.8s ease" }}/>
                  );
                })()}
                {/* Icon */}
                <text x={n.sx} y={n.sy - 6} textAnchor="middle" dominantBaseline="middle"
                  fontSize={isRoot ? 22 : 18} opacity={isLocked ? 0.3 : 1}>
                  {n.icon}
                </text>
                {/* Label */}
                <text x={n.sx} y={n.sy + NODE_R + 14} textAnchor="middle"
                  fontSize={11} fontWeight={600} fill={isLocked ? "#444" : c}
                  opacity={isLocked ? 0.4 : 1} fontFamily="sans-serif">
                  {n.label.length > 14 ? n.label.slice(0,13)+"…" : n.label}
                </text>
                {/* Lock icon */}
                {isLocked && (
                  <text x={n.sx} y={n.sy + 8} textAnchor="middle" fontSize={12} fill="#444">🔒</text>
                )}
                {/* Mastered star */}
                {isMastered && (
                  <text x={n.sx + NODE_R - 4} y={n.sy - NODE_R + 4} textAnchor="middle" fontSize={12}>⭐</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display:"flex",gap:16,flexWrap:"wrap",marginBottom:20 }}>
        {[
          { label:"Locked",     color:"#333",  fill:"#111" },
          { label:"Unlocked",   color:"#888",  fill:"#1a1a2e" },
          { label:"In Progress",color:"#C9A84C",fill:"#1a1500" },
          { label:"Mastered",   color:"#2563EB",fill:"#0a1a0a" },
        ].map(l => (
          <div key={l.label} style={{ display:"flex",alignItems:"center",gap:6 }}>
            <svg width={16} height={16}><circle cx={8} cy={8} r={7} fill={l.fill} stroke={l.color} strokeWidth={1.5}/></svg>
            <span style={{ fontSize:"0.72rem",color:muted }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Branch overview cards */}
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
        <div style={{ height:1,flex:1,background:border }}/>
        <span style={{ fontSize:"0.7rem",color:muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap" }}>Branch Overview</span>
        <div style={{ height:1,flex:1,background:border }}/>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12 }}>
        {branchStats.map(branch => {
          const { unlocked, total, mastered } = branch;
          const pct = Math.round((unlocked/total)*100);
          const c = branch.color || G;
          return (
            <div key={branch.id} onClick={() => setSelected(branch)} style={{ background:card,border:`1px solid ${border}`,borderRadius:13,padding:"16px 16px",cursor:"pointer",transition:"all 0.18s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=c+"55";e.currentTarget.style.transform="translateY(-1px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=border;e.currentTarget.style.transform="none";}}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:20 }}>{branch.icon}</span>
                  <span style={{ fontWeight:700,fontSize:"0.85rem",color:fg }}>{branch.label}</span>
                </div>
                <span style={{ fontSize:"0.72rem",color:c,fontWeight:700 }}>{pct}%</span>
              </div>
              <div style={{ height:5,background:dark?"#1a1a1a":"#e8e8e8",borderRadius:3,overflow:"hidden",marginBottom:8 }}>
                <div style={{ height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${c},${c}bb)`,borderRadius:3,boxShadow:`0 0 6px ${c}66` }}/>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.68rem",color:muted }}>
                <span>{unlocked}/{total} nodes unlocked</span>
                <span style={{ color:c }}>★ {mastered} mastered</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Node detail panel */}
      {selected && (
        <NodeDetailPanel
          node={selected} ltState={ltState}
          onClose={() => setSelected(null)}
          onPractice={handlePractice}
          dark={dark} G={G} border={border} fg={fg} muted={muted}
        />
      )}
    </div>
  );


  // ── ChessProphy AI (merged from the standalone AI page) ─────────────────────
  const AMBER  = "#f59e0b";
  const BLUE   = "#60a5fa";

  const [cmState, setCmState] = useState(loadCMState);
  const [placementStep, setPlacementStep] = useState(0);
  const [placementAnswers, setPlacementAnswers] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonStep, setLessonStep] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(cmState.completedGoals || []);
  const [dismissedInsights, setDismissedInsights] = useState(cmState.insightsDismissed || []);

  const saveCM = (upd) => { const ns = { ...cmState, ...upd }; setCmState(ns); saveCMState(ns); };

  // Placement quiz questions — admin-editable via Admin Portal → AI Question Cards, falls back to the built-in set
  const questionCards = (loadAdminData().questionCards?.length ? loadAdminData().questionCards : PLACEMENT_QUESTIONS);

  // ── Placement ──────────────────────────────────────────────────────────────
  const handlePlacementAnswer = (qIdx, aIdx) => {
    const newAnswers = [...placementAnswers, { q: qIdx, a: aIdx }];
    setPlacementAnswers(newAnswers);
    if (qIdx < questionCards.length - 1) {
      setTimeout(() => setPlacementStep(qIdx + 1), 400);
    } else {
      // Calculate results
      const correct = newAnswers.filter((ans, i) => ans.a === questionCards[i].correct).length;
      const pct = correct / questionCards.length;
      const rating = Math.round(800 + pct * 1000);
      const topTypes = newAnswers.filter((a, i) => a.a === questionCards[i].correct).map((_, i) => questionCards[i].type);
      const style = topTypes.length >= 2 ? topTypes[0] : "universal";

      // The cognitive profile is not stored: it is rebuilt from the placement
      // answers plus live activity every time the page renders (see
      // buildCognitiveProfile), so it keeps moving as the user trains.
      const profile = buildCognitiveProfile(newAnswers, questionCards);
      const ranked = COGNITIVE_METRICS.filter(m => profile[m.key] > 0).sort((a, b) => profile[b.key] - profile[a.key]);

      setTimeout(() => {
        saveCM({
          placementDone: true,
          placementAnswers: newAnswers,
          estimatedRating: rating,
          playerStyle: style,
          cognitiveProfile: null,
          learningPath: ADAPTIVE_LESSONS.slice(0, 4).map(l => l.id),
          coachConversation: [{
            role: "assistant",
            text: `Welcome to ChessProphy AI! Based on your placement, I've estimated your playing strength at **${rating}** and identified you as a **${PLAYER_STYLES[style]?.label || "Universal Player"}**.\n\n${ranked.length ? `Your key strength so far is ${ranked[0].label}. Your biggest opportunity for growth is ${ranked[ranked.length - 1].label}.` : "Your cognitive profile will fill in as you solve puzzles and answer daily questions."}\n\nI've built a personalised learning path for you. Ready to start?`,
            ts: Date.now(),
          }],
        });
        setTab("home");
      }, 600);
    }
  };

  // ── Tab nav ───────────────────────────────────────────────────────────────
  const TABS = [
    { id: "tree",     icon: "🌳", label: "Skill Tree" },
    { id: "home",     icon: "🏠", label: "Overview" },
    { id: "profile",  icon: "🧠", label: "Cognitive Profile" },
    { id: "learning", icon: "📚", label: "Learning Path" },
    { id: "daily",    icon: "📊", label: "Daily Questions" },
    { id: "insights", icon: "💡", label: "AI Insights" },
    { id: "research", icon: "🔬", label: "Research Lab" },
  ];

  // ── PLACEMENT FLOW (shown in place of any gated tab until placement is done) ──
  const renderPlacement = () => {
    const q = questionCards[placementStep];
    const totalQ = questionCards.length;
    return (
      <div style={{ maxWidth: 580, margin: "0 auto", animation: "cmFade 0.4s ease" }}>
        <style>{`@keyframes cmFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {/* Header */}
        <div style={{ textAlign: "center", padding: "24px 0 32px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${PURPLE},#a78bfa)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 26, boxShadow: `0 0 24px ${PURPLE}44` }}>🧠</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: "1.6rem", fontWeight: 700, color: fg, letterSpacing: "-0.02em", marginBottom: 6 }}>
            ChessProphy AI <span style={{ background: `linear-gradient(90deg,${PURPLE},#a78bfa)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
          </h2>
          <p style={{ fontSize: "0.85rem", color: muted, marginBottom: 20 }}>AI Placement — Question {placementStep + 1} of {totalQ}</p>
          {/* Progress bar */}
          <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden", maxWidth: 320, margin: "0 auto" }}>
            <div style={{ height: "100%", width: `${((placementStep) / totalQ) * 100}%`, background: `linear-gradient(90deg,${PURPLE},#a78bfa)`, transition: "width 0.4s" }} />
          </div>
        </div>
        {/* Question card */}
        <SCard card={card} border={border} style={{ padding: "28px 28px" }}>
          <div style={{ fontSize: "0.7rem", color: PURPLE, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>{q.label}</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: fg, lineHeight: 1.55, marginBottom: 24 }}>{q.question}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.options.map((opt, i) => {
              const answered = placementAnswers.length > placementStep;
              const chosen = answered && placementAnswers[placementStep]?.a === i;
              const correct = i === q.correct;
              let bg = "transparent", bc = border, col = fg;
              if (answered) {
                if (correct) { bg = `${G}18`; bc = G; col = G; }
                else if (chosen) { bg = "#ef444418"; bc = "#ef4444"; col = "#ef4444"; }
              }
              return (
                <button key={i} onClick={() => !answered && handlePlacementAnswer(placementStep, i)} style={{
                  padding: "12px 16px", textAlign: "left", background: bg, border: `1px solid ${bc}`,
                  borderRadius: 10, color: col, fontWeight: chosen || correct ? 600 : 400,
                  fontSize: "0.85rem", cursor: answered ? "default" : "pointer", transition: "all 0.15s", lineHeight: 1.4,
                }}
                onMouseEnter={e => { if (!answered) { e.currentTarget.style.borderColor = PURPLE + "66"; e.currentTarget.style.color = PURPLE; } }}
                onMouseLeave={e => { if (!answered) { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = fg; } }}>
                  <span style={{ color: PURPLE, fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              );
            })}
          </div>
          {placementAnswers.length > placementStep && (
            <div style={{ marginTop: 16, padding: "12px 14px", background: `${G}0e`, border: `1px solid ${G}22`, borderRadius: 10, fontSize: "0.8rem", color: muted, lineHeight: 1.6 }}>
              💡 {q.explanation}
            </div>
          )}
        </SCard>
      </div>
    );
  };

  // ── MAIN PAGE ─────────────────────────────────────────────────────────────
  // Every number below is recomputed from the user's real records on render.
  // Older installs stored a `cognitiveProfile` that was partly random; it is
  // deliberately ignored in favour of the live one.
  const profile = useMemo(() => buildCognitiveProfile(cmState.placementAnswers || [], questionCards), [cmState.placementAnswers, questionCards]);
  const profileEmpty = isEmptyProfile(profile);
  const radarData = useMemo(() => computeSkillRadar(), []);
  const weeklyGoals = useMemo(() => computeWeeklyGoals(), []);
  const insights = useMemo(() => computeAIInsights(), []);
  const researchSeries = useMemo(() => computeResearchSeries(), []);
  const researchFindings = useMemo(() => computeResearchFindings(), []);
  const visibleInsights = insights.filter(i => !dismissedInsights.includes(i.id));
  const style = cmState.playerStyle || "universal";
  const styleData = PLAYER_STYLES[style] || PLAYER_STYLES.universal;
  const rating = cmState.estimatedRating || 1200;
  const topMetric = COGNITIVE_METRICS.reduce((a, b) => (profile[a.key] || 0) > (profile[b.key] || 0) ? a : b, COGNITIVE_METRICS[0]);
  const weakMetric = COGNITIVE_METRICS.reduce((a, b) => (profile[a.key] || 0) < (profile[b.key] || 0) ? a : b, COGNITIVE_METRICS[0]);
  // An insight's action either switches a tab on this page or navigates the app.
  const followInsight = (ins) => {
    if (ins.go?.tab) setTab(ins.go.tab);
    else if (ins.go?.page && setActive) setActive(ins.go.page);
  };

  // ── Section renderers ──────────────────────────────────────────────────────
  const renderHome = () => (
    <div>
      {/* Hero banner */}
      <div style={{ background: `linear-gradient(135deg,${dark ? "#0d0a1a" : "#f5f0ff"},${dark ? "#0a0f0d" : "#f0fdf4"})`, border: `1px solid ${PURPLE}22`, borderRadius: 18, padding: "24px 24px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: `radial-gradient(circle,${PURPLE}18 0%,transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${PURPLE},#a78bfa)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: `0 4px 16px ${PURPLE}44`, flexShrink: 0 }}>🧠</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.68rem", color: PURPLE, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Cognitive Intelligence Platform</div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.2rem,2.5vw,1.6rem)", fontWeight: 700, color: fg, letterSpacing: "-0.02em", marginBottom: 6 }}>
              Welcome back, <span style={{ color: PURPLE }}>{styleData.label}</span>
            </h2>
            <p style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.65, maxWidth: 480 }}>
              Your cognitive model is continuously learning from every game. Here&apos;s your personalised overview.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center", background: dark ? "#111" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 12, padding: "12px 18px" }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: "1.5rem", fontWeight: 700, color: PURPLE }}>{rating}</div>
              <div style={{ fontSize: "0.65rem", color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Est. Rating</div>
            </div>
            <div style={{ textAlign: "center", background: dark ? "#111" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 12, padding: "12px 18px" }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: "1.5rem", fontWeight: 700, color: styleData.color }}>{styleData.icon}</div>
              <div style={{ fontSize: "0.65rem", color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Style</div>
            </div>
            <div style={{ textAlign: "center", background: dark ? "#111" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 12, padding: "12px 18px" }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: "1.5rem", fontWeight: 700, color: G }}>{completedLessons.length}</div>
              <div style={{ fontSize: "0.65rem", color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Lessons Done</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
        {/* Skill radar */}
        <SCard card={card} border={border} style={{ padding: "20px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 4 }}>Skill Radar</div>
          <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 14 }}>Your cognitive strengths at a glance</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <RadarChart data={radarData} color={PURPLE} />
          </div>
        </SCard>

        {/* Weekly goals */}
        <SCard card={card} border={border} style={{ padding: "20px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 4 }}>Weekly Goals</div>
          <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 16 }}>Progress counted from this week&apos;s activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {weeklyGoals.map(g => (
              <div key={g.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: fg, marginBottom: 5 }}>
                  <span>{g.icon} {g.label}</span>
                  <span style={{ color: g.progress >= g.max ? G : PURPLE, fontWeight: 700 }}>{g.progress}/{g.max}</span>
                </div>
                <ProgressBar value={g.progress} max={g.max} color={g.progress >= g.max ? G : PURPLE} />
              </div>
            ))}
          </div>
        </SCard>

        {/* Top insight */}
        <SCard card={card} border={border} style={{ padding: "20px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 16 }}>🔍 Key Findings</div>
          {profileEmpty ? (
            <div style={{ fontSize: "0.8rem", color: muted, lineHeight: 1.6 }}>No training data yet. Solve a few puzzles or finish a Daily Questions session and your strengths and focus areas will appear here.</div>
          ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: dark ? "#141414" : "#f8f8f8", border: `1px solid ${G}22`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: "0.7rem", color: G, fontWeight: 700, marginBottom: 4 }}>💪 Strength</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: fg, marginBottom: 2 }}>{topMetric.icon} {topMetric.label}</div>
              <div style={{ fontSize: "0.75rem", color: muted }}>{topMetric.desc}</div>
              <div style={{ marginTop: 8 }}><ProgressBar value={profile[topMetric.key] || 0} color={G} /></div>
            </div>
            <div style={{ background: dark ? "#141414" : "#f8f8f8", border: `1px solid ${AMBER}22`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: "0.7rem", color: AMBER, fontWeight: 700, marginBottom: 4 }}>🎯 Focus Area</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: fg, marginBottom: 2 }}>{weakMetric.icon} {weakMetric.label}</div>
              <div style={{ fontSize: "0.75rem", color: muted }}>{weakMetric.desc}</div>
              <div style={{ marginTop: 8 }}><ProgressBar value={profile[weakMetric.key] || 0} color={AMBER} /></div>
            </div>
          </div>
          )}
        </SCard>

        {/* Quick actions */}
        <SCard card={card} border={border} style={{ padding: "20px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: "🤖", label: "Ask Your AI Coach", sub: "Get instant personalised advice", color: PURPLE, tab: "coach" },
              { icon: "📚", label: "Continue Learning Path", sub: "Pick up where you left off", color: BLUE, tab: "learning" },
              { icon: "💡", label: "View AI Insights", sub: `${visibleInsights.length} insight${visibleInsights.length === 1 ? "" : "s"} from your activity`, color: AMBER, tab: "insights" },
              { icon: "🔬", label: "Research Lab", sub: "Explore your behavioral data", color: G, tab: "research" },
            ].map(a => (
              <button key={a.label} onClick={() => setTab(a.tab)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                background: dark ? "#141414" : "#f8f8f8", border: `1px solid ${border}`,
                borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color + "55"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = border; }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.82rem", color: fg }}>{a.label}</div>
                  <div style={{ fontSize: "0.7rem", color: muted }}>{a.sub}</div>
                </div>
                <span style={{ color: a.color, fontSize: "0.8rem", flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        </SCard>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.2rem,2.5vw,1.5rem)", fontWeight: 700, color: fg, marginBottom: 4 }}>🧠 Cognitive Profile</div>
        <div style={{ fontSize: "0.8rem", color: muted }}>Your personal cognitive model — updated after every game and training session.</div>
      </div>

      {/* Player style card */}
      <SCard card={card} border={border} style={{ padding: "20px 24px", marginBottom: 20, border: `1px solid ${styleData.color}33` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: styleData.color + "18", border: `1px solid ${styleData.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{styleData.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.68rem", color: styleData.color, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Your Playing Style</div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: "1.2rem", fontWeight: 700, color: fg, marginBottom: 4 }}>{styleData.label}</div>
            <div style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.55 }}>{styleData.desc}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia,serif", fontSize: "1.8rem", fontWeight: 700, color: PURPLE }}>{rating}</div>
            <div style={{ fontSize: "0.65rem", color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Estimated Rating</div>
          </div>
        </div>
      </SCard>

      {/* Metric gauges */}
      <SCard card={card} border={border} style={{ padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 4 }}>Cognitive Metrics</div>
        <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 20 }}>10 dimensions measured from your puzzles, Daily Questions, openings and placement quiz{profileEmpty ? " — nothing recorded yet, so every gauge starts at 0" : ""}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
          {COGNITIVE_METRICS.map(m => (
            <MetricGauge key={m.key} value={profile[m.key] || 0} label={m.label} icon={m.icon}
              color={profile[m.key] >= 70 ? G : profile[m.key] >= 50 ? BLUE : AMBER} />
          ))}
        </div>
      </SCard>

      {/* Detailed bars */}
      <SCard card={card} border={border} style={{ padding: "20px 24px" }}>
        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: fg, marginBottom: 16 }}>Detailed Breakdown</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {COGNITIVE_METRICS.map(m => {
            const val = profile[m.key] || 0;
            const col = val >= 70 ? G : val >= 50 ? BLUE : AMBER;
            return (
              <div key={m.key}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 14 }}>{m.icon}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: fg }}>{m.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.72rem", color: muted }}>{m.desc}</span>
                    <span style={{ fontFamily: "Georgia,serif", fontSize: "0.9rem", fontWeight: 700, color: col }}>{val}</span>
                  </div>
                </div>
                <ProgressBar value={val} color={col} height={6} />
              </div>
            );
          })}
        </div>
      </SCard>
    </div>
  );

  const renderLearning = () => {
    if (activeLesson) {
      const lesson = ADAPTIVE_LESSONS.find(l => l.id === activeLesson);
      const isDone = lessonStep >= lesson.steps.length;
      return (
        <div style={{ animation: "cmFade 0.3s ease" }}>
          <button onClick={() => { setActiveLesson(null); setLessonStep(0); }} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 10, padding: "7px 14px", color: muted, fontSize: "0.8rem", cursor: "pointer", marginBottom: 20 }}>← Back to Learning Path</button>
          <SCard card={card} border={border} style={{ padding: "24px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: "0.68rem", color: PURPLE, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{lesson.category}</div>
              <DiffBadge beginnerColor={G} intermediateColor={BLUE} level={lesson.difficulty} />
              <div style={{ marginLeft: "auto", fontSize: "0.72rem", color: muted }}>{lesson.duration}</div>
            </div>
            <h3 style={{ fontFamily: "Georgia,serif", fontSize: "1.2rem", fontWeight: 700, color: fg, marginBottom: 8 }}>{lesson.title}</h3>
            <p style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.6, marginBottom: 16 }}>{lesson.desc}</p>
            <ProgressBar value={lessonStep} max={lesson.steps.length} color={PURPLE} height={6} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: muted, marginTop: 6 }}>
              <span>Step {Math.min(lessonStep + 1, lesson.steps.length)} of {lesson.steps.length}</span>
              <span style={{ color: PURPLE, fontWeight: 700 }}>+{lesson.xp} XP on completion</span>
            </div>
          </SCard>
          {!isDone ? (
            <SCard card={card} border={border} style={{ padding: "28px 24px" }}>
              <div style={{ fontSize: "0.68rem", color: PURPLE, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Step {lessonStep + 1}</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: "1.1rem", fontWeight: 700, color: fg, marginBottom: 16 }}>{lesson.steps[lessonStep]}</div>
              <div style={{ background: dark ? "#141414" : "#f5f0ff", border: `1px solid ${PURPLE}22`, borderRadius: 10, padding: "16px 16px", marginBottom: 20, fontSize: "0.85rem", color: muted, lineHeight: 1.7 }}>
                🧠 This step covers the essential theory and practice patterns for <strong style={{ color: fg }}>{lesson.steps[lessonStep].toLowerCase()}</strong>. Study the concepts, then test your understanding in the exercises.
              </div>
              <button onClick={() => setLessonStep(s => s + 1)} style={{ background: `linear-gradient(135deg,${PURPLE},#a78bfa)`, border: "none", borderRadius: 10, padding: "11px 24px", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", boxShadow: `0 4px 12px ${PURPLE}33` }}>
                {lessonStep < lesson.steps.length - 1 ? "Next Step →" : "Complete Lesson →"}
              </button>
            </SCard>
          ) : (
            <SCard card={card} border={border} style={{ padding: "36px 24px", textAlign: "center", border: `1px solid ${G}33` }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🎉</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: "1.3rem", fontWeight: 700, color: G, marginBottom: 8 }}>Lesson Complete!</div>
              <div style={{ fontSize: "0.85rem", color: muted, marginBottom: 20 }}>+{lesson.xp} XP earned · {lesson.title}</div>
              <button onClick={() => {
                const newCompleted = [...completedLessons, lesson.id];
                setCompletedLessons(newCompleted);
                saveCM({ completedGoals: newCompleted, sessionsCompleted: (cmState.sessionsCompleted || 0) + 1 });
                setActiveLesson(null); setLessonStep(0);
              }} style={{ background: `linear-gradient(135deg,${G},#16a34a)`, border: "none", borderRadius: 10, padding: "11px 24px", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                Back to Learning Path
              </button>
            </SCard>
          )}
        </div>
      );
    }

    const pathLessons = ADAPTIVE_LESSONS.filter(l => (cmState.learningPath || []).includes(l.id));
    const extraLessons = ADAPTIVE_LESSONS.filter(l => !(cmState.learningPath || []).includes(l.id));
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.2rem,2.5vw,1.5rem)", fontWeight: 700, color: fg, marginBottom: 4 }}>📚 Adaptive Learning Path</div>
          <div style={{ fontSize: "0.8rem", color: muted }}>Your personalised roadmap — lessons chosen based on your cognitive profile and weaknesses.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, background: dark ? "#0d1a0d" : "#f0fdf4", border: `1px solid ${G}22`, borderRadius: 10, padding: "10px 14px" }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          <span style={{ fontSize: "0.8rem", color: G, fontWeight: 600 }}>Focus area: <strong>{weakMetric.label}</strong> · {completedLessons.length}/{ADAPTIVE_LESSONS.length} lessons complete</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {pathLessons.map((l, i) => {
            const done = completedLessons.includes(l.id);
            const locked = i > 0 && !completedLessons.includes(pathLessons[i - 1]?.id);
            return (
              <div key={l.id} style={{
                background: card, border: `1px solid ${done ? G + "44" : locked ? border : PURPLE + "33"}`,
                borderRadius: 13, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                opacity: locked ? 0.5 : 1, transition: "all 0.18s", cursor: locked ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => { if (!locked) e.currentTarget.style.borderColor = done ? G + "66" : PURPLE + "55"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = done ? G + "44" : locked ? border : PURPLE + "33"; }}
              onClick={() => !locked && !done && (setActiveLesson(l.id), setLessonStep(0))}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: done ? G + "18" : locked ? dark ? "#1a1a1a" : "#f0f0f0" : PURPLE + "18", border: `1px solid ${done ? G + "44" : locked ? border : PURPLE + "44"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {done ? "✓" : locked ? "🔒" : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: fg }}>{l.title}</span>
                    <DiffBadge beginnerColor={G} intermediateColor={BLUE} level={l.difficulty} />
                    <span style={{ fontSize: "0.65rem", background: dark ? "#1a1a1a" : "#f0f0f0", color: muted, borderRadius: 5, padding: "2px 7px" }}>{l.category}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: muted }}>{l.desc}</div>
                </div>
                <div style={{ display: "flex", flex: "column", alignItems: "flex-end", gap: 4, flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: PURPLE, fontWeight: 700 }}>+{l.xp} XP</div>
                  <div style={{ fontSize: "0.7rem", color: muted }}>{l.duration}</div>
                  {!done && !locked && <div style={{ fontSize: "0.72rem", color: PURPLE, fontWeight: 600 }}>Start →</div>}
                  {done && <div style={{ fontSize: "0.72rem", color: G, fontWeight: 700 }}>✓ Done</div>}
                </div>
              </div>
            );
          })}
        </div>
        {extraLessons.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ height: 1, flex: 1, background: border }} />
              <span style={{ fontSize: "0.68rem", color: muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Extra Lessons</span>
              <div style={{ height: 1, flex: 1, background: border }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
              {extraLessons.map(l => (
                <div key={l.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 13, padding: "16px 16px", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = PURPLE + "44"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = "none"; }}
                  onClick={() => { setActiveLesson(l.id); setLessonStep(0); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: fg }}>{l.title}</span>
                    <DiffBadge beginnerColor={G} intermediateColor={BLUE} level={l.difficulty} />
                  </div>
                  <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 8 }}>{l.desc}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem" }}>
                    <span style={{ color: PURPLE }}>{l.category}</span>
                    <span style={{ color: muted }}>{l.duration} · +{l.xp} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderInsights = () => (
    <div>
      <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.2rem,2.5vw,1.5rem)", fontWeight: 700, color: fg, marginBottom: 4 }}>💡 AI Insights</div>
      <div style={{ fontSize: "0.8rem", color: muted, marginBottom: 20 }}>Observations drawn from your own puzzle, Daily Questions and opening records — each one cites the numbers behind it.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {visibleInsights.map(ins => {
          const c = ins.priority === "high" ? "#ef4444" : AMBER;
          return (
            <SCard card={card} border={border} key={ins.id} style={{ padding: "18px 20px", border: `1px solid ${c}22`, transition: "all 0.15s" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c + "15", border: `1px solid ${c}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{ins.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.88rem", color: fg }}>{ins.title}</span>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, color: c, background: c + "18", border: `1px solid ${c}33`, borderRadius: 5, padding: "2px 7px", textTransform: "uppercase" }}>{ins.priority}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: muted, lineHeight: 1.6, marginBottom: 12 }}>{ins.body}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => followInsight(ins)} style={{ background: c + "15", border: `1px solid ${c}33`, borderRadius: 8, padding: "6px 14px", color: c, fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}>{ins.action} →</button>
                    <button onClick={() => { const nd = [...dismissedInsights, ins.id]; setDismissedInsights(nd); saveCM({ insightsDismissed: nd }); }} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 8, padding: "6px 12px", color: muted, fontSize: "0.75rem", cursor: "pointer" }}>Dismiss</button>
                  </div>
                </div>
              </div>
            </SCard>
          );
        })}
        {visibleInsights.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: muted }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{insights.length === 0 ? "🧪" : "✅"}</div>
            <div style={{ fontWeight: 700, color: fg, marginBottom: 6 }}>{insights.length === 0 ? "Nothing to report yet" : "All caught up!"}</div>
            <div style={{ fontSize: "0.8rem" }}>
              {insights.length === 0
                ? "Insights are generated only from real activity. Answer a few Daily Questions (3+ on a topic), solve some puzzles, or practise an opening and they will start appearing here."
                : "New insights will appear as your training data grows."}
            </div>
            {insights.length > 0 && (
              <button onClick={() => { setDismissedInsights([]); saveCM({ insightsDismissed: [] }); }} style={{ marginTop: 16, background: "transparent", border: `1px solid ${border}`, borderRadius: 9, padding: "8px 16px", color: muted, fontSize: "0.78rem", cursor: "pointer" }}>Restore Dismissed</button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderResearch = () => (
    <div>
      <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.2rem,2.5vw,1.5rem)", fontWeight: 700, color: fg, marginBottom: 4 }}>🔬 Research Lab</div>
      <div style={{ fontSize: "0.8rem", color: muted, marginBottom: 20 }}>Every chart is generated from your real training sessions — a series stays empty until you have produced the data for it.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
        {researchSeries.map(chart => {
          const mn = chart.hasData ? Math.min(...chart.data) : 0, mx = chart.hasData ? Math.max(...chart.data) : 0;
          const px = (i) => i * 28 + 4;
          const py = (v) => 55 - ((v - mn) / (mx - mn + 1)) * 48;
          return (
          <SCard card={card} border={border} key={chart.key} style={{ padding: "18px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>{chart.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: fg }}>{chart.title}</div>
                <div style={{ fontSize: "0.7rem", color: muted }}>{chart.desc}</div>
              </div>
            </div>
            {!chart.hasData ? (
              <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.74rem", color: muted, border: `1px dashed ${border}`, borderRadius: 8 }}>No data recorded yet</div>
            ) : (
              <>
                {/* Mini sparkline */}
                <svg width="100%" height={60} viewBox={`0 0 ${chart.data.length * 28} 60`} preserveAspectRatio="none">
                  <polyline
                    points={chart.data.map((v, i) => `${px(i)},${py(v)}`).join(" ")}
                    fill="none" stroke={chart.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                  {chart.data.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r="3" fill={chart.color} />)}
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: muted, marginTop: 6 }}>
                  <span>{chart.labels ? chart.labels[0] : `${chart.data.length} weeks ago`}</span>
                  <span style={{ color: chart.color, fontWeight: 700 }}>{chart.labels ? "Latest" : "This week"}: {chart.data[chart.data.length - 1]}{chart.unit}</span>
                </div>
              </>
            )}
          </SCard>
          );
        })}
      </div>

      {/* Research discoveries */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: fg, marginBottom: 14 }}>🔍 Discovered Patterns</div>
        {researchFindings.length === 0 ? (
          <SCard card={card} border={border} style={{ padding: "18px 16px", fontSize: "0.8rem", color: muted, lineHeight: 1.6 }}>
            Not enough data yet. Patterns need a minimum sample — at least 3 answers per Daily Questions topic, 10 puzzles, or 10 rewarded activities — before anything is reported here.
          </SCard>
        ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {researchFindings.map((d, i) => (
            <SCard card={card} border={border} key={i} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.strong ? G : AMBER, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: "0.82rem", color: fg }}>{d.finding}</div>
              <div style={{ display: "flex", gap: 12, fontSize: "0.7rem", color: muted, flexShrink: 0 }}>
                <span>n={d.n}</span>
              </div>
            </SCard>
          ))}
        </div>
        )}
      </div>
    </div>
  );

  const renderDaily = () => (
    <DailyQuestionsSection dark={dark} fg={fg} muted={muted} card={card} border={border} G={G} PURPLE={PURPLE} AMBER={AMBER} BLUE={BLUE} />
  );

  const gated = (fn) => cmState.placementDone ? fn : renderPlacement;
  const sectionMap = {
    tree: renderTree,
    home: gated(renderHome),
    profile: gated(renderProfile),
    learning: gated(renderLearning),
    daily: renderDaily,
    insights: gated(renderInsights),
    research: gated(renderResearch),
  };

  // ── Unified page shell: title + tab nav + active tab content ────────────────
  return (
    <div style={{ animation: "cmFade 0.35s ease" }}>
      <style>{`
        @keyframes cmFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cmDot{0%,100%{transform:translateY(0);opacity:.3}50%{transform:translateY(-5px);opacity:1}}
      `}</style>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: PURPLE, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Cognitive Intelligence Platform</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 700, color: fg, letterSpacing: "-0.03em" }}>
            🌳 Learning Tree <span style={{ background: `linear-gradient(90deg,${PURPLE},#a78bfa)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>& ChessProphy AI</span>
          </h2>
        </div>
        {cmState.placementDone && tab !== "tree" && (
          <button onClick={() => { saveCM({ placementDone: false, placementAnswers: [], estimatedRating: null, playerStyle: null, cognitiveProfile: null }); setPlacementAnswers([]); setPlacementStep(0); }} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 9, padding: "7px 14px", color: muted, fontSize: "0.75rem", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = PURPLE + "44"; e.currentTarget.style.color = PURPLE; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; }}>
            ↺ Retake Placement
          </button>
        )}
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24, overflowX: "auto", paddingBottom: 2 }}>
        {TABS.map(t => <TabBtn tab={tab} setTab={setTab} accent={PURPLE} border={border} muted={muted} key={t.id} {...t} />)}
      </div>

      {/* Section */}
      <div key={tab} style={{ animation: "cmFade 0.25s ease" }}>
        {(sectionMap[tab] || renderTree)()}
      </div>
    </div>
  );
}

export {
  LearningTreePage,
};
