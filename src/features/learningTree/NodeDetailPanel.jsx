import { getNodeStatus } from "./treeLayout.js";

// ── Individual skill node card (detail panel) ─────────────────────────────────
function NodeDetailPanel({ node, ltState, onClose, onPractice, dark, G, border, fg, muted }) {
  const PURPLE = "#8b5cf6";
  const status = getNodeStatus(node.id, ltState.unlockedNodes, ltState.nodeProgress);
  const progress = ltState.nodeProgress[node.id] || 0;
  const color = node.color || G;
  const isLocked = status === "locked";

  const lessons = [
    { title: `Introduction to ${node.label}`,  done: progress >= 30  },
    { title: `${node.label} Patterns`,          done: progress >= 60  },
    { title: `${node.label} Practice`,          done: progress >= 80  },
    { title: `${node.label} Mastery Test`,      done: progress >= 100 },
  ];

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)",animation:"ltFade 0.2s ease" }}>
      <div style={{ background:dark?"#0d0d0d":"#fff",border:`1px solid ${color}33`,borderRadius:20,padding:"28px 28px",width:"100%",maxWidth:480,boxShadow:`0 24px 60px rgba(0,0,0,0.7),0 0 40px ${color}11`,animation:"ltSlide 0.25s ease",maxHeight:"85vh",overflowY:"auto" }}>
        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
          <div style={{ display:"flex",gap:12,alignItems:"center" }}>
            <div style={{ width:44,height:44,borderRadius:12,background:`${color}22`,border:`1px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:`0 0 16px ${color}33` }}>{node.icon}</div>
            <div>
              <div style={{ fontFamily:"Georgia,serif",fontSize:"1.1rem",fontWeight:700,color:fg }}>{node.label}</div>
              <div style={{ fontSize:"0.7rem",color,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em" }}>{status.toUpperCase()}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"transparent",border:`1px solid ${border}`,borderRadius:8,padding:"5px 10px",color:muted,cursor:"pointer",fontSize:14 }}>✕</button>
        </div>

        {/* Progress */}
        <div style={{ marginBottom:18 }}>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.74rem",color:muted,marginBottom:5 }}>
            <span>Mastery</span><span style={{ color,fontWeight:700 }}>{progress}%</span>
          </div>
          <div style={{ height:8,background:dark?"#1a1a1a":"#f0f0f0",borderRadius:4,overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${color},${color}bb)`,borderRadius:4,transition:"width 0.6s ease",boxShadow:`0 0 8px ${color}66` }}/>
          </div>
        </div>

        {/* Description */}
        <div style={{ background:dark?"#141414":"#f8f8f8",border:`1px solid ${border}`,borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:"0.82rem",color:muted,lineHeight:1.65 }}>
          {node.desc}
        </div>

        {/* AI Insight */}
        <div style={{ background:`${PURPLE}0e`,border:`1px solid ${PURPLE}22`,borderRadius:10,padding:"12px 14px",marginBottom:16 }}>
          <div style={{ fontSize:"0.7rem",color:PURPLE,fontWeight:700,marginBottom:4 }}>🧠 AI Recommendation</div>
          <div style={{ fontSize:"0.8rem",color:fg,lineHeight:1.6 }}>
            {isLocked
              ? `Complete the required prerequisites to unlock ${node.label}.`
              : progress < 30
                ? `Start with the introduction lesson to build your foundation in ${node.label}.`
                : progress < 70
                  ? `You're making good progress! Focus on pattern recognition exercises next.`
                  : progress < 100
                    ? `Almost there! Take the mastery test to complete this skill node.`
                    : `You've mastered ${node.label}! This node now boosts your connected skills.`}
          </div>
        </div>

        {/* Lessons */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:"0.74rem",fontWeight:700,color:fg,marginBottom:8 }}>Lessons</div>
          {lessons.map((l,i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",marginBottom:6,background:dark?"#141414":"#f5f5f5",borderRadius:9,border:`1px solid ${l.done?color+"33":border}` }}>
              <div style={{ width:20,height:20,borderRadius:"50%",background:l.done?`${color}22`:"transparent",border:`2px solid ${l.done?color:muted}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:l.done?color:muted,flexShrink:0 }}>{l.done?"✓":i+1}</div>
              <span style={{ fontSize:"0.8rem",color:l.done?muted:fg,textDecoration:l.done?"line-through":"none" }}>{l.title}</span>
              {!l.done && <span style={{ marginLeft:"auto",fontSize:"0.68rem",color,fontWeight:700 }}>+{node.xpReward/4|0} XP</span>}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:18 }}>
          {[{l:"XP Reward",v:`+${node.xpReward}`,c:color},{l:"Level",v:progress>=100?"Master":progress>=60?"Advanced":progress>=30?"Intermediate":"Beginner",c:fg},{l:"Status",v:status,c:isLocked?"#555":color}].map(s=>(
            <div key={s.l} style={{ background:dark?"#141414":"#f5f5f5",borderRadius:9,padding:"10px 10px",textAlign:"center" }}>
              <div style={{ fontFamily:"Georgia,serif",fontSize:"0.85rem",fontWeight:700,color:s.c,marginBottom:2 }}>{s.v}</div>
              <div style={{ fontSize:"0.62rem",color:muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {!isLocked && (
          <button onClick={() => onPractice(node.id)} style={{ width:"100%",padding:"12px 0",background:`linear-gradient(135deg,${color},${color}cc)`,border:"none",borderRadius:11,color:"#fff",fontWeight:700,fontSize:"0.88rem",cursor:"pointer",boxShadow:`0 4px 14px ${color}33` }}>
            {progress >= 100 ? "✓ Review Node" : progress > 0 ? "Continue Training →" : "Start Training →"}
          </button>
        )}
        {isLocked && (
          <div style={{ textAlign:"center",padding:"10px",background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:10,fontSize:"0.8rem",color:"#555" }}>
            🔒 Complete prerequisites to unlock
          </div>
        )}
      </div>
    </div>
  );
}

export {
  NodeDetailPanel,
};
