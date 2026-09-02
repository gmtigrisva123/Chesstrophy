import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { PzPiece } from "./PieceSVG.jsx";
import { fenBoard } from "../../lib/chess/fen.js";
import { CHESS_CHECK, CHESS_CORRECT, CHESS_DARK_SQ, CHESS_INCORRECT, CHESS_LASTMOVE_D, CHESS_LASTMOVE_L, CHESS_LIGHT_SQ, CHESS_SELECT } from "../../theme/boardTheme.js";

/**
 * Renders a puzzle position.
 *
 * Callers that step through moves (PuzzleSolver) own the live position and pass
 * it as `board`; static previews pass only `fen` and let this component derive
 * it. Before `board` was honoured, the solver's moves updated its own state
 * while this component kept re-deriving the *starting* FEN — so pieces never
 * visibly moved even though the puzzle was scored as solved.
 *
 * @param {object} props
 * @param {string} props.fen - Starting position, also the fallback when `board` is absent.
 * @param {(string|null)[]} [props.board] - Live 64-square position, index 0 = a8.
 */
function PuzzleBoard({ fen, board: boardProp, selectedSq, legalSqs, lastFrom, lastTo, checkSq, onSquareClick, onDrop, size=52, feedback=null }) {
  const derivedBoard = useMemo(() => fenBoard(fen), [fen]);
  const board = boardProp ?? derivedBoard;

  const LIGHT=CHESS_LIGHT_SQ, DARK_SQ=CHESS_DARK_SQ, SEL_L=CHESS_SELECT, SEL_D=CHESS_SELECT, LL=CHESS_LASTMOVE_L, LD=CHESS_LASTMOVE_D;
  const files = ["a","b","c","d","e","f","g","h"];
  const ranks = ["8","7","6","5","4","3","2","1"];
  const boardRef = useRef(null);
  const [drag, setDrag] = useState(null); // {sq, piece, x, y}

  // Stable identity: the drag listeners below depend on it, and recreating it
  // every render would re-register them on every pointer move.
  const getSqFromPoint = useCallback((cx, cy) => {
    if (!boardRef.current) return -1;
    const rect = boardRef.current.getBoundingClientRect();
    const x = cx - rect.left, y = cy - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return -1;
    const dc = Math.floor(x / size), dr = Math.floor(y / size);
    if (dc < 0 || dc > 7 || dr < 0 || dr > 7) return -1;
    return dr * 8 + dc;
  }, [size]);
  const startDrag = (e, sq) => {
    if (!onDrop) return; // drag-and-drop is opt-in — click-to-move keeps working either way
    const piece = board[sq];
    if (!piece) return;
    e.preventDefault();
    const cx = e.touches ? e.touches[0].clientX : e.clientX, cy = e.touches ? e.touches[0].clientY : e.clientY;
    onSquareClick && onSquareClick(sq); // reuse existing selection logic to compute legal squares
    setDrag({ sq, piece, x: cx, y: cy });
  };
  useEffect(() => {
    if (!drag) return;
    const mv = (e) => { const cx = e.touches ? e.touches[0].clientX : e.clientX, cy = e.touches ? e.touches[0].clientY : e.clientY; setDrag(d => d ? { ...d, x: cx, y: cy } : null); };
    const up = (e) => {
      const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX, cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const target = getSqFromPoint(cx, cy);
      if (target >= 0 && target !== drag.sq) onDrop && onDrop(drag.sq, target);
      setDrag(null);
    };
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", mv, { passive: false }); window.addEventListener("touchend", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); window.removeEventListener("touchmove", mv); window.removeEventListener("touchend", up); };
  }, [drag, onDrop, getSqFromPoint]);

  return (
    <div style={{position:"relative",userSelect:"none"}}>
      <div style={{position:"absolute",left:-22,top:0,display:"flex",flexDirection:"column",height:size*8}}>
        {ranks.map(r=><div key={r} style={{height:size,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.62rem",fontWeight:700,color:"#888",fontFamily:"monospace",width:18}}>{r}</div>)}
      </div>
      <div ref={boardRef} style={{display:"grid",gridTemplateColumns:`repeat(8,${size}px)`,gridTemplateRows:`repeat(8,${size}px)`,border:"2px solid #8B5E20",borderRadius:4,overflow:"hidden",boxShadow:"0 8px 30px rgba(0,0,0,0.5)"}}>
        {Array.from({length:64},(_,sq)=>{
          const [dr,dc]=[Math.floor(sq/8),sq%8];
          const isLight=(dr+dc)%2===0;
          const isSel=sq===selectedSq, isLegal=legalSqs&&legalSqs.includes(sq);
          const isLF=sq===lastFrom, isLT=sq===lastTo, isChk=sq===checkSq;
          const isFeedbackSq = feedback && (sq===feedback.from || sq===feedback.to);
          const isDragSrc = drag && sq === drag.sq;
          let bg=isLight?LIGHT:DARK_SQ;
          if(isChk)bg=CHESS_CHECK+"cc";
          else if(isFeedbackSq)bg=(feedback.type==="correct"?CHESS_CORRECT:CHESS_INCORRECT)+"99";
          else if(isSel)bg=isLight?SEL_L+"cc":SEL_D+"cc";
          else if(isLF||isLT)bg=isLight?LL:LD;
          const piece=board[sq];
          return (
            <div key={sq} data-square={sq} style={{width:size,height:size,background:bg,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",cursor:piece&&onDrop?"grab":onSquareClick?"pointer":"default",transition:"background 0.08s"}}
              onClick={()=>onSquareClick&&onSquareClick(sq)}
              onMouseDown={e=>startDrag(e,sq)} onTouchStart={e=>startDrag(e,sq)}>
              {isLegal&&(piece
                ?<div style={{position:"absolute",inset:0,border:"3px solid rgba(0,0,0,0.28)",pointerEvents:"none",zIndex:2}}/>
                :<div style={{width:size*0.3,height:size*0.3,borderRadius:"50%",background:"rgba(0,0,0,0.19)",pointerEvents:"none",zIndex:2}}/>
              )}
              {piece&&!isDragSrc&&<div style={{zIndex:1}}><PzPiece piece={piece} size={size-4}/></div>}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",marginTop:6}}>
        {files.map(f=><div key={f} style={{width:size,textAlign:"center",fontSize:"0.62rem",fontWeight:700,color:"#888",fontFamily:"monospace"}}>{f}</div>)}
      </div>
      {drag && <div style={{position:"fixed",pointerEvents:"none",zIndex:9998,left:drag.x-size/2,top:drag.y-size/2,width:size,height:size,filter:"drop-shadow(0 6px 16px rgba(0,0,0,0.6))",transform:"scale(1.1)",transformOrigin:"center"}}><PzPiece piece={drag.piece} size={size}/></div>}
    </div>
  );
}

export {
  PuzzleBoard,
};
