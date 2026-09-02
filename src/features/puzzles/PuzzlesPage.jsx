import { useState } from "react";
import { PuzzleSolver } from "./PuzzleSolver.jsx";
import { PuzzleBoard } from "../../components/chess/PuzzleBoard.jsx";
import { RewardToast } from "../../components/ui/RewardToast.jsx";
import { PUZZLE_DB } from "../../data/puzzles.js";
import { loadAdminData } from "../../services/adminData.js";
import { grantRewardWithAchievements, rewardCfg } from "../../services/economy.js";
import { loadPzState, savePzState } from "../../services/puzzleProgress.js";

// ── MAIN PUZZLES PAGE ─────────────────────────────────────────────────────────
function PuzzlesPage({ dark }) {
  const G="#2563EB";
  const fg=dark?"#f0f0f0":"#111";
  const muted=dark?"#666":"#888";
  const card=dark?"#0f0f0f":"#fff";
  const border=dark?"#1e1e1e":"#e8e8e8";

  const [pzState, setPzState] = useState(loadPzState);
  const [activePuzzle, setActivePuzzle] = useState(null); // null = list view
  const [reward, setReward] = useState(null);

  const savePz = (newState) => { savePzState(newState); setPzState(newState); };

  const potd = PUZZLE_DB.find(p=>p.id==="potd");
  const freePuzzles = PUZZLE_DB.filter(p=>p.id.startsWith("f")).slice(0,3);
  const adminPuzzles = loadAdminData().puzzlesAdmin || [];
  const practicePuzzles = [...PUZZLE_DB.filter(p=>p.id.startsWith("p")), ...adminPuzzles];

  const freeRemaining = Math.max(0, 3-pzState.freeUsed);
  const streakDays = pzState.streak;

  // Determine if streak continues
  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now()-86400000).toDateString();

  const handleComplete = ({ puzzleId, success, delta }) => {
    const alreadySolved = pzState.solved.includes(puzzleId);
    const newState = { ...pzState };

    if (!alreadySolved) {
      // Apply rating change
      newState.puzzleRating = Math.max(400, Math.min(3000, pzState.puzzleRating + delta));
      newState.solved = [...pzState.solved, puzzleId];
      newState.solvedToday = [...pzState.solvedToday, puzzleId];

      // Track free puzzle usage
      if (puzzleId.startsWith("f") && !pzState.solvedToday.includes(puzzleId)) {
        newState.freeUsed = Math.min(3, pzState.freeUsed+1);
      }
      // POTD
      if (puzzleId==="potd") newState.potdSolved = true;

      // Streak logic
      let streakJustHitMilestone = null;
      if (success) {
        if (pzState.lastSolvedDate===yesterdayStr || pzState.lastSolvedDate===todayStr) {
          if (pzState.lastSolvedDate!==todayStr) newState.streak = pzState.streak+1;
        } else {
          newState.streak = 1;
        }
        newState.lastSolvedDate = todayStr;
        if ([3,7,14,30,60,100].includes(newState.streak) && newState.streak !== pzState.streak) {
          streakJustHitMilestone = newState.streak;
        }
      }

      // ProphyCoins — small reward per genuinely solved puzzle (not for opening/refreshing).
      // Keyed by puzzleId so the same puzzle can never pay out twice.
      if (success) {
        const solveCfg = rewardCfg("puzzle_solved", 5, 15);
        const r = solveCfg.enabled ? grantRewardWithAchievements("puzzle_solved", puzzleId, { coins: solveCfg.coins, xp: solveCfg.xp, reason: "Puzzle solved" }) : null;
        let toastReward = r ? { title: "🧩 Puzzle Solved!", coins: r.coins, xp: r.xp, leveledUp: r.leveledUp, newLevel: r.newLevel, newAchievements: r.newAchievements } : null;

        // Puzzle pack milestone — every 10 solved puzzles.
        const totalSolved = newState.solved.length;
        if (totalSolved > 0 && totalSolved % 10 === 0) {
          const packIdx = totalSolved / 10;
          const packCfg = rewardCfg("puzzle_pack", 60, 120);
          const pr = packCfg.enabled ? grantRewardWithAchievements("puzzle_pack", `pack:${packIdx}`, { coins: packCfg.coins, xp: packCfg.xp, reason: `Puzzle pack #${packIdx} complete (${totalSolved} solved)` }) : null;
          if (pr) toastReward = { title: "🧩 Puzzle Pack Complete!", coins: (toastReward?.coins||0)+pr.coins, xp: (toastReward?.xp||0)+pr.xp, leveledUp: toastReward?.leveledUp||pr.leveledUp, newLevel: pr.newLevel||toastReward?.newLevel, newAchievements: [...(toastReward?.newAchievements||[]), ...pr.newAchievements] };
        }

        // Streak milestone reward.
        if (streakJustHitMilestone) {
          const sr = grantRewardWithAchievements("streak_milestone", `streak:${streakJustHitMilestone}`, { coins: streakJustHitMilestone * 5, xp: streakJustHitMilestone * 10, reason: `${streakJustHitMilestone}-day learning streak` });
          if (sr) toastReward = { title: `🔥 ${streakJustHitMilestone}-Day Streak!`, coins: (toastReward?.coins||0)+sr.coins, xp: (toastReward?.xp||0)+sr.xp, leveledUp: toastReward?.leveledUp||sr.leveledUp, newLevel: sr.newLevel||toastReward?.newLevel, newAchievements: [...(toastReward?.newAchievements||[]), ...sr.newAchievements] };
        }

        if (toastReward) setReward(toastReward);
      }
    }

    savePz(newState);
    setActivePuzzle(null);
  };

  const canPlayFree = (pz) => {
    if (pzState.solvedToday.includes(pz.id)) return "solved";
    if (pzState.freeUsed >= 3) return "locked";
    return "available";
  };

  const ratingColor = pzState.puzzleRating >= 1600 ? G : pzState.puzzleRating >= 1200 ? "#60a5fa" : "#f59e0b";

  if (activePuzzle) {
    return (
      <div>
        <style>{`@keyframes pzFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <PuzzleSolver
          // Remount per puzzle: the solver seeds board/move/status state from
          // its props, so reusing one instance across puzzles would carry the
          // previous position over.
          key={activePuzzle.id}
          puzzle={activePuzzle}
          pzState={pzState}
          onComplete={handleComplete}
          onBack={()=>setActivePuzzle(null)}
          dark={dark}
          puzzleList={practicePuzzles}
        />
        <RewardToast reward={reward} dark={dark} onClose={() => setReward(null)} />
      </div>
    );
  }

  return (
    <div style={{maxWidth:900,animation:"pzFade 0.3s ease"}}>
      <style>{`
        @keyframes pzFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .pz-card:hover{border-color:#2563EB55!important;transform:translateY(-2px)}
        .pz-btn:hover{opacity:0.88}
      `}</style>

      {/* Header + Stats bar */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16,marginBottom:28}}>
        <div>
          <div style={{fontSize:"0.7rem",color:G,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Chess Training</div>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(1.6rem,3vw,2.2rem)",fontWeight:700,color:fg,letterSpacing:"-0.03em",marginBottom:4}}>Puzzles</h2>
          <p style={{fontSize:"0.85rem",color:muted}}>Sharpen your tactics. Solve daily puzzles and track your rating.</p>
        </div>
        {/* Stats */}
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:"12px 18px",textAlign:"center",minWidth:90}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:700,color:ratingColor,letterSpacing:"-0.02em"}}>{pzState.puzzleRating}</div>
            <div style={{fontSize:"0.68rem",color:muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>Puzzle Rating</div>
          </div>
          <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:"12px 18px",textAlign:"center",minWidth:80}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:700,color:"#f59e0b"}}>
              {streakDays>0?`🔥${streakDays}`:"—"}
            </div>
            <div style={{fontSize:"0.68rem",color:muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>Day Streak</div>
          </div>
          <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:"12px 18px",textAlign:"center",minWidth:80}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:700,color:G}}>{freeRemaining}/3</div>
            <div style={{fontSize:"0.68rem",color:muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>Free Left</div>
          </div>
        </div>
      </div>

      {/* ── PUZZLE OF THE DAY ── */}
      <div style={{background:card,border:`1px solid ${pzState.potdSolved?"#2563EB44":border}`,borderRadius:18,padding:"24px 24px",marginBottom:24,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:160,height:160,background:`radial-gradient(circle,${G}0d 0%,transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <div style={{flex:"1 1 240px",minWidth:220}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              <span style={{fontSize:"0.68rem",fontWeight:700,color:G,background:`${G}15`,border:`1px solid ${G}30`,borderRadius:6,padding:"3px 10px",letterSpacing:"0.06em",textTransform:"uppercase"}}>★ Puzzle of the Day</span>
              <span style={{fontSize:"0.68rem",color:muted,background:dark?"#1a1a1a":"#f5f5f5",borderRadius:6,padding:"3px 8px"}}>Rating: {potd.rating}</span>
            </div>
            <div style={{fontWeight:700,fontSize:"1.1rem",color:fg,marginBottom:4}}>{potd.title}</div>
            <div style={{fontSize:"0.82rem",color:muted,marginBottom:8}}>{potd.theme}</div>
            <p style={{fontSize:"0.8rem",color:muted,lineHeight:1.6,maxWidth:420,marginBottom:16}}>{potd.desc}</p>
            {pzState.potdSolved
              ? <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${G}15`,border:`1px solid ${G}33`,borderRadius:9,padding:"8px 16px",color:G,fontWeight:700,fontSize:"0.82rem"}}>✓ Solved Today</div>
              : <button className="pz-btn" onClick={()=>setActivePuzzle(potd)} style={{background:`linear-gradient(135deg,${G},#16a34a)`,border:"none",borderRadius:10,padding:"11px 24px",color:"#fff",fontWeight:700,fontSize:"0.85rem",cursor:"pointer",boxShadow:`0 4px 14px ${G}33`,transition:"opacity 0.15s"}}>Solve Puzzle →</button>
            }
          </div>
          {/* Mini board preview */}
          <div style={{flexShrink:0,opacity:0.85}}>
            <PuzzleBoard fen={potd.fen} size={36} selectedSq={null} legalSqs={[]} lastFrom={null} lastTo={null}/>
          </div>
        </div>
      </div>

      {/* ── FREE DAILY PUZZLES ── */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{height:1,flex:1,background:border}}/>
          <span style={{fontSize:"0.7rem",color:muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"}}>
            Free Daily Puzzles · {freeRemaining} remaining
          </span>
          <div style={{height:1,flex:1,background:border}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
          {freePuzzles.map((pz)=>{
            const st=canPlayFree(pz);
            const isSolved=st==="solved";
            const isLocked=st==="locked";
            return (
              <div key={pz.id} className="pz-card" style={{
                background:card,
                border:`1px solid ${isSolved?"#2563EB44":border}`,
                borderRadius:14,padding:"18px 18px",
                transition:"all 0.18s",
                opacity:isLocked?0.6:1,
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.9rem",color:fg,marginBottom:2}}>{pz.title}</div>
                    <div style={{fontSize:"0.72rem",color:muted}}>{pz.theme}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                    <span style={{fontSize:"0.68rem",background:dark?"#1a1a1a":"#f0f0f0",color:muted,borderRadius:6,padding:"2px 8px"}}>{pz.rating}</span>
                    {isSolved&&<span style={{fontSize:"0.65rem",color:G,fontWeight:700}}>✓ Done</span>}
                    {isLocked&&<span style={{fontSize:"0.65rem",color:"#f59e0b",fontWeight:700}}>🔒 Locked</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
                  {pz.tags.map(t=><span key={t} style={{fontSize:"0.65rem",background:dark?"#1a1a1a":"#f0f0f0",color:muted,borderRadius:5,padding:"2px 7px"}}>{t}</span>)}
                </div>
                <button
                  disabled={isLocked}
                  onClick={()=>!isLocked&&!isSolved&&setActivePuzzle(pz)}
                  style={{
                    width:"100%",padding:"9px 0",
                    background:isSolved?`${G}18`:isLocked?"#1a1a1a":`${G}18`,
                    border:`1px solid ${isSolved?G+"33":isLocked?"#2a2a2a":G+"33"}`,
                    borderRadius:9,color:isSolved?G:isLocked?"#333":G,
                    fontWeight:700,fontSize:"0.78rem",
                    cursor:isLocked||isSolved?"default":"pointer",
                    transition:"all 0.15s",
                  }}>
                  {isSolved?"✓ Solved":isLocked?"🔒 Daily Limit Reached":"Solve →"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PRACTICE PUZZLES ── */}
      <div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{height:1,flex:1,background:border}}/>
          <span style={{fontSize:"0.7rem",color:muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"}}>Practice Puzzles · Unlimited</span>
          <div style={{height:1,flex:1,background:border}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
          {practicePuzzles.map(pz=>{
            const isSolved=pzState.solved.includes(pz.id);
            return (
              <div key={pz.id} className="pz-card" style={{
                background:card,
                border:`1px solid ${isSolved?"#2563EB33":border}`,
                borderRadius:13,padding:"16px 16px",
                transition:"all 0.18s",cursor:"pointer",
              }} onClick={()=>setActivePuzzle(pz)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontWeight:700,fontSize:"0.85rem",color:fg}}>{pz.title}</div>
                  <span style={{fontSize:"0.68rem",background:dark?"#1a1a1a":"#f0f0f0",color:muted,borderRadius:6,padding:"2px 8px",flexShrink:0}}>{pz.rating}</span>
                </div>
                <div style={{fontSize:"0.72rem",color:muted,marginBottom:8}}>{pz.theme}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",gap:4}}>
                    {pz.tags.slice(0,2).map(t=><span key={t} style={{fontSize:"0.62rem",background:dark?"#1a1a1a":"#f0f0f0",color:muted,borderRadius:5,padding:"2px 6px"}}>{t}</span>)}
                  </div>
                  {isSolved
                    ?<span style={{fontSize:"0.68rem",color:G,fontWeight:700}}>✓ Solved</span>
                    :<span style={{fontSize:"0.72rem",color:G,fontWeight:600}}>Solve →</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <RewardToast reward={reward} dark={dark} onClose={() => setReward(null)} />
    </div>
  );
}

export {
  PuzzlesPage,
};
