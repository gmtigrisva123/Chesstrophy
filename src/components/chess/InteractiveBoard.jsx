import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChessArrow } from "./ChessArrow.jsx";
import { PieceSVG } from "./PieceSVG.jsx";
import { fenBoard } from "../../lib/chess/fen.js";
import { CHESS_ARROW_BEST, CHESS_CHECK, CHESS_CORRECT, CHESS_DARK_SQ, CHESS_INCORRECT, CHESS_LASTMOVE_D, CHESS_LASTMOVE_L, CHESS_LIGHT_SQ, CHESS_SELECT } from "../../theme/boardTheme.js";

function InteractiveBoard({ fen, onMove, getLegal, lastMove, flipped, sqSize=72, checkSq=-1, feedback=null, hintArrow=null, allowAnnotations=false }) {
  const [selSq, setSelSq] = useState(null);
  const [legSqs, setLegSqs] = useState([]);
  const [drag, setDrag] = useState(null);
  const boardRef = useRef(null);

  // ── Manual annotations (right-click drag = arrow, right-click = square highlight) ──
  // Self-contained/uncontrolled — purely a study aid, cleared on the next real move
  // or selection. Opt-in via allowAnnotations so every other existing caller of
  // InteractiveBoard (puzzles, admin builder, etc.) is completely unaffected.
  // Multiple colors, chosen by modifier key at the moment the drag starts —
  // matches the convention most chess GUIs use (plain / shift / ctrl / alt).
  const ANNOTATION_COLORS = { plain: "#f59e0b", shift: "#ef4444", ctrl: "#22c55e", alt: "#3b82f6" };
  const [manualArrows, setManualArrows] = useState([]); // { from, to, color }
  const [manualHighlights, setManualHighlights] = useState([]); // { sq, color }
  const [rightDrag, setRightDrag] = useState(null); // { from: realSq, color }
  const clearAnnotations = () => { setManualArrows([]); setManualHighlights([]); };

  const board = useMemo(() => fenBoard(fen), [fen]);

  const toReal = useCallback((dSq) => { if (!flipped) return dSq; const [r,c]=[Math.floor(dSq/8),dSq%8]; return (7-r)*8+(7-c); }, [flipped]);
  const files = flipped?["h","g","f","e","d","c","b","a"]:["a","b","c","d","e","f","g","h"];
  const ranks = flipped?["1","2","3","4","5","6","7","8"]:["8","7","6","5","4","3","2","1"];
  const LIGHT=CHESS_LIGHT_SQ, DARK_C=CHESS_DARK_SQ, SEL_L=CHESS_SELECT, SEL_D=CHESS_SELECT, LAST_L=CHESS_LASTMOVE_L, LAST_D=CHESS_LASTMOVE_D;
  // squareOf() gives pixel centers for the shared ChessArrow overlay (hint/best-move arrows)
  const squareOf = (rSq) => { if (rSq==null||rSq<0) return null; const dSq=toReal(rSq); const dr=Math.floor(dSq/8),dc=dSq%8; return { x: dc*sqSize+sqSize/2, y: dr*sqSize+sqSize/2 }; };

  const handleClick = (dSq) => {
    if (drag) return;
    if (allowAnnotations && (manualArrows.length || manualHighlights.length)) clearAnnotations();
    const rSq = toReal(dSq);
    if (selSq===null) { doSel(rSq); }
    else if (legSqs.includes(rSq)) { onMove&&onMove(selSq,rSq); setSelSq(null); setLegSqs([]); }
    else { doSel(rSq); }
  };
  const doSel = (rSq) => {
    const legal = getLegal?getLegal(rSq):[];
    setSelSq(rSq); setLegSqs(legal.map(m=>m.to));
  };
  // Stable identity: the drag listeners below depend on it, and recreating it
  // every render would re-register them on every pointer move.
  const getBSq = useCallback((cx,cy) => {
    if (!boardRef.current) return -1;
    const rect=boardRef.current.getBoundingClientRect();
    const x=cx-rect.left,y=cy-rect.top;
    if (x<0||y<0||x>rect.width||y>rect.height) return -1;
    const dc=Math.floor(x/sqSize),dr=Math.floor(y/sqSize);
    if (dc<0||dc>7||dr<0||dr>7) return -1;
    return toReal(dr*8+dc);
  }, [sqSize, toReal]);
  const startDrag = (e,dSq) => {
    if (e.button !== undefined && e.button !== 0) return; // ignore right/middle click
    const rSq=toReal(dSq),piece=board[rSq];
    if (!piece) return;
    const legal=getLegal?getLegal(rSq):[];
    if (!legal.length) return;
    e.preventDefault();
    if (allowAnnotations && (manualArrows.length || manualHighlights.length)) clearAnnotations();
    const cx=e.touches?e.touches[0].clientX:e.clientX,cy=e.touches?e.touches[0].clientY:e.clientY;
    setSelSq(rSq); setLegSqs(legal.map(m=>m.to)); setDrag({sq:rSq,piece,x:cx,y:cy});
  };
  const startRightDrag = (e, dSq) => {
    if (!allowAnnotations) return;
    e.preventDefault();
    const color = e.shiftKey ? ANNOTATION_COLORS.shift : (e.ctrlKey || e.metaKey) ? ANNOTATION_COLORS.ctrl : e.altKey ? ANNOTATION_COLORS.alt : ANNOTATION_COLORS.plain;
    setRightDrag({ from: toReal(dSq), color });
  };
  useEffect(() => {
    if (!rightDrag) return;
    const up = (e) => {
      const t = getBSq(e.clientX, e.clientY);
      if (t >= 0) {
        if (t === rightDrag.from) {
          setManualHighlights(hs => {
            const exists = hs.some(h => h.sq === t && h.color === rightDrag.color);
            const withoutThisSq = hs.filter(h => h.sq !== t);
            return exists ? withoutThisSq : [...withoutThisSq, { sq: t, color: rightDrag.color }];
          });
        } else {
          setManualArrows(as => {
            const exists = as.some(a => a.from === rightDrag.from && a.to === t && a.color === rightDrag.color);
            const withoutThisPair = as.filter(a => !(a.from === rightDrag.from && a.to === t));
            return exists ? withoutThisPair : [...withoutThisPair, { from: rightDrag.from, to: t, color: rightDrag.color }];
          });
        }
      }
      setRightDrag(null);
    };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, [rightDrag,getBSq]);
  useEffect(() => {
    if (!drag) return;
    const mv=(e)=>{const cx=e.touches?e.touches[0].clientX:e.clientX,cy=e.touches?e.touches[0].clientY:e.clientY;setDrag(d=>d?{...d,x:cx,y:cy}:null);};
    const up=(e)=>{const cx=e.changedTouches?e.changedTouches[0].clientX:e.clientX,cy=e.changedTouches?e.changedTouches[0].clientY:e.clientY;const t=getBSq(cx,cy);if(t>=0&&legSqs.includes(t)&&onMove)onMove(drag.sq,t);setDrag(null);setSelSq(null);setLegSqs([]);};
    window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
    window.addEventListener("touchmove",mv,{passive:false});window.addEventListener("touchend",up);
    return()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);window.removeEventListener("touchmove",mv);window.removeEventListener("touchend",up);};
  },[drag,legSqs,onMove,getBSq]);

  return (
    <div style={{position:"relative",userSelect:"none"}}>
      <div style={{position:"absolute",left:-22,top:0,display:"flex",flexDirection:"column",height:sqSize*8}}>
        {ranks.map(r=><div key={r} style={{height:sqSize,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.62rem",fontWeight:700,color:"#777",fontFamily:"monospace",width:18}}>{r}</div>)}
      </div>
      <div ref={boardRef} onContextMenu={e => { if (allowAnnotations) e.preventDefault(); }} style={{display:"grid",gridTemplateColumns:`repeat(8,${sqSize}px)`,gridTemplateRows:`repeat(8,${sqSize}px)`,border:"2px solid #8B5E20",borderRadius:4,overflow:"hidden",boxShadow:"0 12px 40px rgba(0,0,0,0.55),0 2px 8px rgba(0,0,0,0.35)"}}>
        {Array.from({length:64},(_,dSq)=>{
          const rSq=toReal(dSq),[dr,dc]=[Math.floor(dSq/8),dSq%8],isLight=(dr+dc)%2===0;
          const isSel=rSq===selSq,isLegal=legSqs.includes(rSq),isLF=lastMove&&rSq===lastMove.from,isLT=lastMove&&rSq===lastMove.to,isChk=rSq===checkSq,isDrag=drag&&rSq===drag.sq;
          const isFeedbackSq = feedback && (rSq===feedback.from || rSq===feedback.to);
          const manualHi = allowAnnotations ? manualHighlights.find(h => h.sq === rSq) : null;
          let bg=isLight?LIGHT:DARK_C;
          if(isChk)bg=CHESS_CHECK+"cc";
          else if(isFeedbackSq)bg=(feedback.type==="correct"?CHESS_CORRECT:CHESS_INCORRECT)+"99";
          else if(isSel)bg=isLight?SEL_L+"cc":SEL_D+"cc";
          else if(isLF||isLT)bg=isLight?LAST_L:LAST_D;
          else if(manualHi)bg=manualHi.color+"77";
          const piece=board[rSq];
          return (
            <div key={dSq} style={{width:sqSize,height:sqSize,background:bg,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",cursor:piece&&!isDrag?"grab":"default",transition:"background 0.08s"}}
              onClick={()=>handleClick(dSq)} onMouseDown={e=>{ if(e.button===2){startRightDrag(e,dSq);} else {startDrag(e,dSq);} }} onTouchStart={e=>{e.preventDefault();startDrag(e,dSq);}}>
              {isLegal&&(piece?<div style={{position:"absolute",inset:0,border:"4px solid rgba(0,0,0,0.26)",pointerEvents:"none",zIndex:2}}/>:<div style={{width:sqSize*0.3,height:sqSize*0.3,borderRadius:"50%",background:"rgba(0,0,0,0.19)",pointerEvents:"none",zIndex:2}}/>)}
              {piece&&!isDrag&&<div style={{zIndex:1}}><PieceSVG piece={piece} size={sqSize-4}/></div>}
              {dc===0&&<span style={{position:"absolute",top:2,left:3,fontSize:"0.6rem",fontWeight:700,color:isLight?"#B07540":"#EAC989",lineHeight:1,pointerEvents:"none",zIndex:5}}>{ranks[dr]}</span>}
              {dr===7&&<span style={{position:"absolute",bottom:1,right:3,fontSize:"0.6rem",fontWeight:700,color:isLight?"#B07540":"#EAC989",lineHeight:1,pointerEvents:"none",zIndex:5}}>{files[dc]}</span>}
            </div>
          );
        })}
        {hintArrow && (
          <div style={{ position:"absolute", left:0, top:0, width:sqSize*8, height:sqSize*8, pointerEvents:"none", zIndex:0 }}>
            <ChessArrow from={hintArrow.from} to={hintArrow.to} squareOf={squareOf} sqSize={sqSize} color={hintArrow.color || CHESS_ARROW_BEST} />
          </div>
        )}
        {allowAnnotations && manualArrows.length > 0 && (
          <div style={{ position:"absolute", left:0, top:0, width:sqSize*8, height:sqSize*8, pointerEvents:"none", zIndex:0 }}>
            {manualArrows.map((a, i) => <ChessArrow key={i} from={a.from} to={a.to} squareOf={squareOf} sqSize={sqSize} color={a.color} opacity={0.85} />)}
          </div>
        )}
      </div>
      {allowAnnotations && (manualArrows.length > 0 || manualHighlights.length > 0) && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
          <button onClick={clearAnnotations} style={{ background: "transparent", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b", borderRadius: 7, padding: "3px 10px", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer" }}>Clear annotations</button>
        </div>
      )}
      {allowAnnotations && manualArrows.length === 0 && manualHighlights.length === 0 && (
        <div style={{ fontSize: "0.62rem", color: "#888", marginTop: 5, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span><i style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: ANNOTATION_COLORS.plain, marginRight: 3 }} />right-click drag</span>
          <span><i style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: ANNOTATION_COLORS.shift, marginRight: 3 }} />+shift = red</span>
          <span><i style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: ANNOTATION_COLORS.ctrl, marginRight: 3 }} />+ctrl = green</span>
          <span><i style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: ANNOTATION_COLORS.alt, marginRight: 3 }} />+alt = blue</span>
        </div>
      )}
      <div style={{display:"flex",marginTop:4}}>
        {files.map(f=><div key={f} style={{width:sqSize,textAlign:"center",fontSize:"0.62rem",fontWeight:700,color:"#777",fontFamily:"monospace"}}>{f}</div>)}
      </div>
      {drag&&<div style={{position:"fixed",pointerEvents:"none",zIndex:9998,left:drag.x-sqSize/2,top:drag.y-sqSize/2,width:sqSize,height:sqSize,filter:"drop-shadow(0 6px 16px rgba(0,0,0,0.6))",transform:"scale(1.1)",transformOrigin:"center"}}><PieceSVG piece={drag.piece} size={sqSize}/></div>}
    </div>
  );
}

export {
  InteractiveBoard,
};
