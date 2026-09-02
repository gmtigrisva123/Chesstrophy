import { useState, useRef, useEffect, useMemo } from "react";
import { InteractiveBoard } from "../../components/chess/InteractiveBoard.jsx";
import { PromotionDialog } from "../../components/chess/PromotionDialog.jsx";
import { useBoardSize } from "../../hooks/useBoardSize.js";
import { createChess } from "../../lib/chess/engine.js";
import { parsePGN, sanToMove } from "../../lib/chess/pgn.js";

// Module scope: nested inside GameViewer these would remount the whole tab bar
// and control rail on every ply the user steps through.
function TabBtn({ id, label, tab, setTab, accent, muted }) {
  const isActive = tab === id;
  return <button onClick={() => setTab(id)} aria-pressed={isActive} style={{flex:1,padding:"9px 0",background:"transparent",border:"none",borderBottom:`2px solid ${isActive?accent:"transparent"}`,color:isActive?accent:muted,fontWeight:isActive?700:500,fontSize:"0.78rem",cursor:"pointer",transition:"all 0.15s"}}>{label}</button>;
}

function Btn({ icon, title, onClick, active = false, sm = false, accent, border, fg }) {
  return <button onClick={onClick} title={title} aria-label={title} style={{flex:1,padding:sm?"7px 4px":"9px 0",background:active?`${accent}18`:"transparent",border:`1px solid ${active?accent+"44":border}`,borderRadius:10,color:active?accent:fg,fontWeight:600,fontSize:sm?"0.75rem":"1rem",cursor:"pointer",transition:"all 0.14s",minWidth:36,whiteSpace:"nowrap"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=accent;e.currentTarget.style.color=accent;}} onMouseLeave={e=>{if(!active){e.currentTarget.style.borderColor=border;e.currentTarget.style.color=fg;}}}>{icon}</button>;
}

function GameViewer({ game, onBack, dark }) {
  const G="#2563EB",fg=dark?"#f0f0f0":"#111",muted=dark?"#666":"#888",card=dark?"#0f0f0f":"#fff",border=dark?"#1e1e1e":"#e8e8e8";
  const [SQ, boardSizeRef] = useBoardSize(52);
  const { fens, movesData, sanList } = useMemo(()=>{
    const chess=createChess(),fens=[chess.getFen()],movesData=[],sanList=parsePGN(game.pgn||"");
    for(const san of sanList){const mv=sanToMove(chess,san);if(!mv)break;chess.move(mv.from,mv.to,mv.promo);fens.push(chess.getFen());movesData.push(mv);}
    return{fens,movesData,sanList};
  },[game.pgn]);
  const [curIdx,setCurIdx]=useState(0),[flipped,setFlipped]=useState(false);
  const [ana,setAna]=useState(false),[anaFen,setAnaFen]=useState(null);
  const [anaChess]=useState(()=>createChess()),[anaMoves,setAnaMoves]=useState([]);
  const [promotion,setPromotion]=useState(null),[tab,setTab]=useState("moves");
  const moveListRef=useRef(null),totalMoves=sanList.length;
  const isAna=ana&&anaFen!==null;
  const curFen=isAna?anaFen:(fens[curIdx]||fens[0]);
  const lastMove=isAna?null:(movesData[curIdx-1]||null);
  const tmpChess=createChess(curFen);
  const chkNow=tmpChess.isInCheck();
  const chkSq=chkNow?(()=>{const b=tmpChess.getBoard(),k=tmpChess.getTurn()==="w"?"K":"k";return b.findIndex(p=>p===k);})():-1;
  // Keep the active move visible inside the move-list panel only. Deliberately
  // NOT using scrollIntoView here — its "nearest ancestor" resolution isn't
  // reliable across engines and was escaping this panel to scroll the whole
  // page down on every move (the bug this replaced). Manually clamping
  // container.scrollTop can only ever move this panel, never the page.
  useEffect(()=>{
    if(moveListRef.current&&!isAna){
      const container=moveListRef.current;
      const el=container.querySelector(".mv-active");
      if(el){
        const elTop=el.offsetTop, elBottom=elTop+el.offsetHeight;
        const viewTop=container.scrollTop, viewBottom=viewTop+container.clientHeight;
        if(elTop<viewTop) container.scrollTop=elTop;
        else if(elBottom>viewBottom) container.scrollTop=elBottom-container.clientHeight;
      }
    }
  },[curIdx,isAna]);
  const enterAna=()=>{anaChess.loadFen(curFen);setAnaMoves([]);setAnaFen(curFen);setAna(true);};
  const exitAna=()=>{setAna(false);setAnaFen(null);};
  const handleMove=(from,to)=>{
    if(!isAna){enterAna();return;}
    const b=anaChess.getBoard(),piece=b[from],toRow=Math.floor(to/8);
    if((piece==="P"&&toRow===0)||(piece==="p"&&toRow===7)){setPromotion({from,to});return;}
    execMv(from,to,null);
  };
  const execMv=(from,to,promo)=>{const mv=anaChess.move(from,to,promo);if(mv){setAnaFen(anaChess.getFen());setAnaMoves(p=>[...p,mv]);}setPromotion(null);};
  const getLegal=(sq)=>isAna?anaChess.legalMoves(sq):[];
  const nav=(dir)=>{exitAna();if(dir==="first")setCurIdx(0);else if(dir==="last")setCurIdx(totalMoves);else if(dir==="prev")setCurIdx(i=>Math.max(0,i-1));else setCurIdx(i=>Math.min(totalMoves,i+1));};
  const resColor=game.result==="1-0"?G:game.result==="0-1"?"#ef4444":"#888";
  return (
    <div style={{animation:"dashFade 0.3s ease"}}>
      <style>{`@keyframes dashFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {promotion&&<PromotionDialog color={anaChess.getTurn()==="w"?"b":"w"} onSelect={p=>execMv(promotion.from,promotion.to,p)}/>}
      <button onClick={onBack} style={{background:"transparent",border:`1px solid ${border}`,borderRadius:10,padding:"8px 16px",color:muted,fontWeight:600,fontSize:"0.82rem",cursor:"pointer",marginBottom:20,display:"flex",alignItems:"center",gap:6,transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=G;e.currentTarget.style.color=G;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=border;e.currentTarget.style.color=muted;}}>← Back to Archive</button>
      <div style={{background:card,border:`1px solid ${border}`,borderRadius:16,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:"0.68rem",color:G,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{game.eco} · {game.year}</div>
          <div style={{fontFamily:"Georgia,serif",fontSize:"clamp(1rem,2.5vw,1.35rem)",fontWeight:700,color:fg,letterSpacing:"-0.02em"}}>
            {game.white}{game.wr&&<span style={{fontSize:"0.72rem",color:muted,marginLeft:6,fontFamily:"sans-serif",fontWeight:400}}>({game.wr})</span>}
            <span style={{color:muted,fontWeight:400,margin:"0 8px",fontFamily:"sans-serif",fontSize:"0.9rem"}}>vs</span>
            {game.black}{game.br&&<span style={{fontSize:"0.72rem",color:muted,marginLeft:6,fontFamily:"sans-serif",fontWeight:400}}>({game.br})</span>}
          </div>
          <div style={{fontSize:"0.75rem",color:muted,marginTop:4}}>🏆 {game.event} · ♟ {game.opening}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:800,color:resColor}}>{game.result}</div>
          {isAna&&<button onClick={exitAna} style={{background:`${G}15`,border:`1px solid ${G}44`,borderRadius:9,padding:"6px 14px",color:G,fontWeight:700,fontSize:"0.75rem",cursor:"pointer"}}>✕ Exit Analysis</button>}
        </div>
      </div>
      {isAna&&<div style={{background:`${G}0d`,border:`1px solid ${G}30`,borderRadius:12,padding:"10px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:"50%",background:G,display:"inline-block",boxShadow:`0 0 6px ${G}`}}/><span style={{color:G,fontWeight:600,fontSize:"0.8rem"}}>Analysis Mode · {anaMoves.length} move{anaMoves.length!==1?"s":""} explored · Click pieces to move freely</span></div>}
      <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
        <div style={{flex:"1 1 auto",minWidth:0,width:"100%",maxWidth:660}}>
          <div style={{paddingLeft:24}} ref={boardSizeRef}>
            <InteractiveBoard fen={curFen} onMove={handleMove} getLegal={getLegal} lastMove={lastMove} flipped={flipped} sqSize={SQ} checkSq={chkSq}/>
          </div>
          <div style={{display:"flex",gap:7,marginTop:14,paddingLeft:24}}>
            <Btn accent={G} border={border} fg={fg} icon="⏮" title="First" onClick={()=>nav("first")}/>
            <Btn accent={G} border={border} fg={fg} icon="◀" title="Previous" onClick={()=>nav("prev")}/>
            <Btn accent={G} border={border} fg={fg} icon="▶" title="Next" onClick={()=>nav("next")}/>
            <Btn accent={G} border={border} fg={fg} icon="⏭" title="Last" onClick={()=>nav("last")}/>
          </div>
          <div style={{display:"flex",gap:7,marginTop:7,paddingLeft:24}}>
            <Btn accent={G} border={border} fg={fg} icon="⇅ Flip" title="Flip board" onClick={()=>setFlipped(f=>!f)} sm/>
            <Btn accent={G} border={border} fg={fg} icon={isAna?"✦ Analysing":"✦ Analyse"} title="Analysis mode" onClick={isAna?exitAna:enterAna} active={isAna} sm/>
            {isAna&&<Btn accent={G} border={border} fg={fg} icon="↺ Undo" title="Undo" sm onClick={()=>{if(anaChess.undo()){setAnaFen(anaChess.getFen());setAnaMoves(p=>p.slice(0,-1));}}}/>}
          </div>
          <div style={{textAlign:"center",marginTop:9,fontSize:"0.7rem",color:muted,paddingLeft:24}}>
            {isAna?`Analysing · ${anaMoves.length} move${anaMoves.length!==1?"s":""} in`:curIdx===0?"Start position":`Move ${curIdx} of ${totalMoves} — ${sanList[curIdx-1]||""}`}
          </div>
        </div>
        <div style={{flex:1,minWidth:220,maxWidth:340}}>
          <div style={{background:card,border:`1px solid ${border}`,borderRadius:14,padding:"12px 14px",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"8px 10px",borderRadius:10,background:dark?"#141414":"#f5f5f5"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"#1a1a1a",border:"2px solid #2e2e2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>♛</div>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:"0.82rem",color:fg}}>{game.black}</div>{game.br&&<div style={{fontSize:"0.68rem",color:muted}}>{game.br} ELO</div>}</div>
              {game.result==="0-1"&&<span style={{fontSize:"0.72rem",fontWeight:700,color:"#ef4444",background:"#ef444415",padding:"2px 8px",borderRadius:6}}>WINS</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:10,background:dark?"#141414":"#f5f5f5"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"#e8e8e8",border:"2px solid #ccc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>♕</div>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:"0.82rem",color:fg}}>{game.white}</div>{game.wr&&<div style={{fontSize:"0.68rem",color:muted}}>{game.wr} ELO</div>}</div>
              {game.result==="1-0"&&<span style={{fontSize:"0.72rem",fontWeight:700,color:G,background:`${G}15`,padding:"2px 8px",borderRadius:6}}>WINS</span>}
            </div>
          </div>
          <div style={{background:card,border:`1px solid ${border}`,borderRadius:14,overflow:"hidden"}}>
            <div style={{display:"flex",borderBottom:`1px solid ${border}`}}>
              <TabBtn tab={tab} setTab={setTab} accent={G} muted={muted} id="moves" label="Moves"/><TabBtn tab={tab} setTab={setTab} accent={G} muted={muted} id="info" label="Game Info"/><TabBtn tab={tab} setTab={setTab} accent={G} muted={muted} id="pgn" label="PGN"/>
            </div>
            {tab==="moves"&&(
              <div ref={moveListRef} style={{padding:"10px 12px",maxHeight:340,overflowY:"auto"}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:2}}>
                  {sanList.map((mv,i)=>{
                    const isW=i%2===0,mvN=Math.floor(i/2)+1,isAct=!isAna&&(i+1===curIdx);
                    return(<span key={i} style={{display:"inline-flex",alignItems:"center"}}>
                      {isW&&<span style={{fontSize:"0.66rem",color:"#444",marginRight:2,marginLeft:i>0?4:0,fontFamily:"monospace"}}>{mvN}.</span>}
                      <span className={isAct?"mv-active":""} onClick={()=>{setCurIdx(i+1);exitAna();}}
                        style={{display:"inline-block",padding:"3px 8px",borderRadius:7,cursor:"pointer",background:isAct?G:"transparent",color:isAct?"#fff":(isW?fg:muted),fontWeight:isAct?700:500,fontSize:"0.8rem",fontFamily:"monospace",transition:"all 0.1s"}}
                        onMouseEnter={e=>{if(!isAct){e.currentTarget.style.background=`${G}22`;e.currentTarget.style.color=G;}}}
                        onMouseLeave={e=>{if(!isAct){e.currentTarget.style.background="transparent";e.currentTarget.style.color=isW?fg:muted;}}}>
                        {mv}
                      </span>
                    </span>);
                  })}
                  {!sanList.length&&<span style={{fontSize:"0.75rem",color:muted}}>No moves available.</span>}
                </div>
              </div>
            )}
            {tab==="info"&&(
              <div style={{padding:"14px 16px"}}>
                <p style={{fontSize:"0.8rem",color:muted,lineHeight:1.7,marginBottom:14,borderBottom:`1px solid ${border}`,paddingBottom:12}}>{game.desc}</p>
                {[["White",game.white+(game.wr?` (${game.wr})`:"")] ,["Black",game.black+(game.br?` (${game.br})`:"")],["Event",game.event],["Year",game.year],["Opening",game.opening],["ECO",game.eco],["Result",game.result]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${border}`,fontSize:"0.76rem"}}>
                    <span style={{color:muted,fontWeight:600}}>{k}</span>
                    <span style={{color:fg,fontWeight:500,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            {tab==="pgn"&&(
              <div style={{padding:"12px 14px"}}>
                <button onClick={()=>navigator.clipboard?.writeText(game.pgn||"")} style={{width:"100%",padding:"8px 0",background:`${G}12`,border:`1px solid ${G}30`,borderRadius:9,color:G,fontWeight:700,fontSize:"0.76rem",cursor:"pointer",marginBottom:10}}>📋 Copy PGN</button>
                <pre style={{fontSize:"0.68rem",color:muted,lineHeight:1.65,overflowX:"auto",fontFamily:"monospace",whiteSpace:"pre-wrap",wordBreak:"break-all",maxHeight:280,overflowY:"auto",background:dark?"#0a0a0a":"#f5f5f5",borderRadius:8,padding:"10px 12px",border:`1px solid ${border}`,margin:0}}>{game.pgn||"No PGN available."}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export {
  GameViewer,
};
