import { useState, useEffect } from "react";
import { MASCOT_IMG } from "../../assets/mascot.js";
import { PuzzleBoard } from "../../components/chess/PuzzleBoard.jsx";
import { useBoardSize } from "../../hooks/useBoardSize.js";
import { applySimpleMove, fenBoard, movesMatch, nameToSq } from "../../lib/chess/fen.js";
import { calcRatingChange, ratingToDifficulty } from "../../services/puzzleProgress.js";

// ── Individual Puzzle Solver ──────────────────────────────────────────────────
function PuzzleSolver({ puzzle, pzState, onComplete, onBack, dark, puzzleList = [] }) {
  const G="#2563EB";
  const fg=dark?"#f0f0f0":"#111";
  const muted=dark?"#666":"#888";
  const card=dark?"#0f0f0f":"#fff";
  const border=dark?"#1e1e1e":"#e8e8e8";

  // The starting position never changes for a given puzzle; the live position
  // lives in `board` below and is what actually gets rendered.
  const fen = puzzle.fen;
  const [board, setBoard] = useState(()=>fenBoard(puzzle.fen));
  const [selSq, setSelSq] = useState(null);
  const [legalSqs, setLegalSqs] = useState([]);
  const [moveIdx, setMoveIdx] = useState(0);
  const [lastFrom, setLastFrom] = useState(null);
  const [lastTo, setLastTo]   = useState(null);
  const [status, setStatus]   = useState("idle"); // idle|correct|wrong|done
  const [hintUsed, setHintUsed] = useState(false);
  const [hintText, setHintText] = useState("");
  const [wrongCount, setWrongCount] = useState(0);
  const [ratingDelta, setRatingDelta] = useState(null);
  const [flash, setFlash]     = useState(null); // "green"|"red"

  const solution = puzzle.solution;
  // Side to move is fixed for the whole puzzle: the player always plays the
  // puzzle's colour and the opponent's replies are auto-played from `solution`.
  const turn = fen.split(" ")[1]; // "w" or "b"

  // Simple legal destination squares (just any non-own-piece square for UX)
  const getSimpleLegal = (sq) => {
    const piece = board[sq];
    if (!piece) return [];
    const isWhite = piece===piece.toUpperCase();
    if ((turn==="w"&&!isWhite)||(turn==="b"&&isWhite)) return [];
    // Return all squares not occupied by same colour (simplified for puzzle UX)
    const dests = [];
    for (let i=0;i<64;i++) {
      const target=board[i];
      if (i===sq) continue;
      const targetIsWhite = target&&target===target.toUpperCase();
      if (target && ((isWhite&&targetIsWhite)||(!isWhite&&!targetIsWhite))) continue;
      dests.push(i);
    }
    return dests;
  };

  const handleSquareClick = (sq) => {
    if (status==="done" || status==="correct") return;
    if (selSq===null) {
      const legal=getSimpleLegal(sq);
      if (legal.length) { setSelSq(sq); setLegalSqs(legal); }
    } else {
      if (sq===selSq) { setSelSq(null); setLegalSqs([]); return; }
      if (legalSqs.includes(sq)) {
        attemptMove(selSq, sq);
        setSelSq(null); setLegalSqs([]);
      } else {
        const legal=getSimpleLegal(sq);
        if (legal.length) { setSelSq(sq); setLegalSqs(legal); }
        else { setSelSq(null); setLegalSqs([]); }
      }
    }
  };

  const attemptMove = (from, to) => {
    const expected = solution[moveIdx];
    if (movesMatch(from, to, expected)) {
      // Correct move
      const newBoard = applySimpleMove(board, from, to);
      setBoard(newBoard); setLastFrom(from); setLastTo(to);
      setFlash("green");
      setTimeout(()=>setFlash(null),600);
      const nextIdx = moveIdx+1;
      setMoveIdx(nextIdx);

      if (nextIdx >= solution.length) {
        // Puzzle solved!
        const delta = calcRatingChange(pzState.puzzleRating, puzzle.rating, true, hintUsed);
        setRatingDelta(delta);
        setStatus("done");
      } else {
        // Auto-play opponent's next move if any
        setStatus("correct");
        setTimeout(()=>{
          const oppMove = solution[nextIdx];
          if (oppMove) {
            const oppFrom=nameToSq(oppMove.slice(0,2)), oppTo=nameToSq(oppMove.slice(2,4));
            const b2=applySimpleMove(newBoard,oppFrom,oppTo);
            setBoard(b2); setLastFrom(oppFrom); setLastTo(oppTo);
            const afterOpp = nextIdx+1;
            setMoveIdx(afterOpp);
            // BUG FIX: a puzzle whose solution ends on the opponent's move (an
            // even ply count — e.g. "potd": ["d1e2","e8g8"]) used to sit here
            // forever at status "idle" once the auto-played reply landed on the
            // final ply — the completion check only ever ran for the player's
            // OWN move, never after this auto-play. That puzzle, and every
            // other 2-move (or other even-length) puzzle, could never be
            // marked solved or award rating. Same completion check, applied here too.
            if (afterOpp >= solution.length) {
              const delta = calcRatingChange(pzState.puzzleRating, puzzle.rating, true, hintUsed);
              setRatingDelta(delta);
              setStatus("done");
            } else {
              setStatus("idle");
            }
          }
        },600);
      }
    } else {
      // Wrong move
      setWrongCount(c=>c+1);
      setFlash("red");
      setTimeout(()=>setFlash(null),600);
      setStatus("wrong");
    }
  };

  const showHint = () => {
    const expected = solution[moveIdx];
    const from = expected.slice(0,2);
    setHintText(`Move a piece from ${from.toUpperCase()}`);
    setHintUsed(true);
  };

  const handleComplete = (success) => {
    const delta = success
      ? calcRatingChange(pzState.puzzleRating, puzzle.rating, true, hintUsed)
      : calcRatingChange(pzState.puzzleRating, puzzle.rating, false, false);
    onComplete({ puzzleId:puzzle.id, success, delta, hintUsed });
  };

  const [SQ, boardSizeRef] = useBoardSize(48);

  // ── Session timer — how long the player has spent on this puzzle ──────────
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => { setElapsedSec(0); }, [puzzle.id]);
  useEffect(() => {
    if (status === "done") return;
    const t = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [status, puzzle.id]);
  const mmss = `${Math.floor(elapsedSec/60)}:${String(elapsedSec%60).padStart(2,"0")}`;
  const progressPct = Math.min(100, Math.round((moveIdx/Math.max(1,solution.length))*100));

  // ── Where this puzzle sits within the current practice set, if known ──────
  const puzzleIndex = puzzleList.findIndex(p=>p.id===puzzle.id);
  const puzzleTotal = puzzleList.length;

  // ── Friendly nudge shown above the board status — only while there's no
  // dedicated wrong/done status card already covering that ground ─────────
  const bubbleMsg = status==="idle"
    ? (moveIdx===0 ? "It's your turn! Make a move on the board." : "Nice — keep going, find the next move!")
    : status==="correct" ? "Nice move! Let's see the reply…"
    : null;

  return (
    <div style={{animation:"pzFade 0.3s ease"}}>
      {/* Top bar — back, move-progress, elapsed time */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
        <button onClick={onBack} style={{background:"transparent",border:`1px solid ${border}`,borderRadius:10,padding:"7px 14px",color:muted,fontWeight:600,fontSize:"0.8rem",cursor:"pointer",transition:"all 0.15s",flexShrink:0}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=G;e.currentTarget.style.color=G;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=border;e.currentTarget.style.color=muted;}}>← Back</button>
        <div style={{flex:1,height:4,borderRadius:2,background:border,overflow:"hidden",minWidth:60}}>
          <div style={{height:"100%",width:`${progressPct}%`,background:G,transition:"width 0.3s ease",borderRadius:2}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:"0.78rem",color:muted,fontWeight:600,flexShrink:0}}>
          <span style={{color:status==="done"?G:muted}}>⏱</span><span>{mmss}</span>
        </div>
      </div>

      <div style={{display:"flex",gap:24,flexWrap:"wrap",alignItems:"flex-start"}}>
        {/* Board */}
        <div style={{minWidth:0,maxWidth:480}}>
          <div style={{position:"relative",paddingLeft:24}} ref={boardSizeRef}>
            <div style={{
              position:"absolute",inset:0,borderRadius:6,
              background:flash==="green"?"rgba(34,197,94,0.15)":flash==="red"?"rgba(239,68,68,0.15)":"transparent",
              pointerEvents:"none",zIndex:10,transition:"background 0.15s",
            }}/>
            <PuzzleBoard
              fen={fen} board={board}
              selectedSq={selSq} legalSqs={legalSqs}
              lastFrom={lastFrom} lastTo={lastTo}
              onSquareClick={status!=="done"?handleSquareClick:null}
              onDrop={status!=="done"&&status!=="correct"?(from,to)=>{ if(getSimpleLegal(from).includes(to)){ attemptMove(from,to); setSelSq(null); setLegalSqs([]); } }:null}
              size={SQ}
            />
          </div>
          {/* Hint */}
          <div style={{display:"flex",gap:8,marginTop:14,paddingLeft:24}}>
            <button onClick={showHint} disabled={hintUsed||status==="done"} style={{
              flex:1,padding:"8px 0",background:"transparent",
              border:`1px solid ${hintUsed?"#2a2a2a":border}`,borderRadius:10,
              color:hintUsed?"#333":muted,fontWeight:600,fontSize:"0.78rem",
              cursor:hintUsed||status==="done"?"not-allowed":"pointer",transition:"all 0.15s",
            }}>💡 Hint {hintUsed?"(used)":"(-50% reward)"}</button>
            {status==="wrong"&&<button onClick={()=>setStatus("idle")} style={{
              flex:1,padding:"8px 0",background:"transparent",
              border:`1px solid ${border}`,borderRadius:10,
              color:fg,fontWeight:600,fontSize:"0.78rem",cursor:"pointer",
            }}>↺ Try Again</button>}
          </div>
          {hintText&&<div style={{marginTop:8,paddingLeft:24,fontSize:"0.8rem",color:"#f59e0b",fontWeight:600}}>💡 {hintText}</div>}
        </div>

        {/* Side panel */}
        <div style={{flex:1,minWidth:220}}>
          {/* Puzzle heading + at-a-glance meta */}
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:"1.05rem",color:G,marginBottom:10}}>
              {puzzleIndex>=0 ? `Puzzle #${puzzleIndex+1} of ${puzzleTotal}` : puzzle.title}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {[
                [G, ratingToDifficulty(puzzle.rating)],
                ["#60a5fa", turn==="w"?"White to move":"Black to move"],
                [wrongCount===0?"#22c55e":"#f59e0b", wrongCount===0?"No mistakes so far":`${wrongCount} wrong attempt${wrongCount!==1?"s":""}`],
              ].map(([dot,label])=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:8,fontSize:"0.8rem",color:muted,fontWeight:600}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:dot,flexShrink:0,display:"inline-block"}}/>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Friendly nudge — mascot + chat bubble */}
          {bubbleMsg&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:8,marginBottom:16}}>
              <div style={{background:dark?"#132a3d":"#eaf4ff",border:`1px solid ${dark?"#1e3a52":"#cfe6fb"}`,borderRadius:"14px 14px 14px 4px",padding:"11px 15px",fontSize:"0.82rem",fontWeight:600,color:dark?"#cfe9ff":"#0f4c75",maxWidth:"100%",animation:"pzFade 0.2s ease"}}>
                {bubbleMsg}
              </div>
              <img src={MASCOT_IMG} alt="" style={{width:38,height:38,borderRadius:"50%",display:"block",objectFit:"cover"}}/>
            </div>
          )}

          {/* Status cards */}
          {status==="wrong"&&(
            <div style={{background:"#ef444415",border:"1px solid #ef444433",borderRadius:14,padding:"16px 18px",marginBottom:14,animation:"pzFade 0.2s ease"}}>
              <div style={{fontWeight:700,fontSize:"0.9rem",color:"#ef4444",marginBottom:4}}>✕ Not quite right</div>
              <div style={{fontSize:"0.8rem",color:muted,marginBottom:12}}>That&apos;s not the solution. Try again or use a hint.</div>
              <button onClick={()=>handleComplete(false)} style={{background:"transparent",border:"1px solid #ef444433",borderRadius:9,padding:"7px 16px",color:"#ef4444",fontSize:"0.78rem",fontWeight:600,cursor:"pointer"}}>Give Up → Show Solution</button>
            </div>
          )}
          {status==="done"&&(
            <div style={{background:`${G}12`,border:`1px solid ${G}33`,borderRadius:14,padding:"20px 18px",marginBottom:14,animation:"pzFade 0.2s ease"}}>
              <div style={{fontWeight:700,fontSize:"1rem",color:G,marginBottom:4}}>✓ Puzzle Solved!</div>
              <div style={{fontSize:"0.8rem",color:muted,marginBottom:12}}>
                {hintUsed?"Great job! (hint used)":"Perfect solution!"}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                <span style={{fontSize:"1.4rem",fontWeight:800,color:ratingDelta>=0?G:"#ef4444"}}>
                  {ratingDelta>=0?"+":""}{ratingDelta}
                </span>
                <span style={{fontSize:"0.8rem",color:muted}}>rating points</span>
              </div>
              <button onClick={()=>handleComplete(true)} style={{
                background:`linear-gradient(135deg,${G},#16a34a)`,border:"none",
                borderRadius:10,padding:"10px 22px",color:"#fff",
                fontWeight:700,fontSize:"0.85rem",cursor:"pointer",
                boxShadow:`0 4px 14px ${G}33`,
              }}>Continue →</button>
            </div>
          )}

          {/* Puzzle info */}
          <div style={{background:card,border:`1px solid ${border}`,borderRadius:14,padding:"16px 18px"}}>
            <div style={{fontSize:"0.7rem",color:G,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Puzzle Info</div>
            {[
              ["Theme", puzzle.theme],
              ["Difficulty", puzzle.rating],
              ["Tags", puzzle.tags.join(", ")],
              ["Your move", moveIdx===0?"Find the best move":`Move ${moveIdx}/${solution.length} done`],
              ["Attempts", wrongCount===0?"No mistakes so far":`${wrongCount} wrong attempt${wrongCount!==1?"s":""}`],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${border}`,fontSize:"0.76rem"}}>
                <span style={{color:muted,fontWeight:600}}>{k}</span>
                <span style={{color:fg,fontWeight:500,textAlign:"right"}}>{v}</span>
              </div>
            ))}
            <p style={{fontSize:"0.78rem",color:muted,lineHeight:1.6,marginTop:12}}>{puzzle.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export {
  PuzzleSolver,
};
