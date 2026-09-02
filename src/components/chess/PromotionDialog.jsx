import { PieceSVG } from "./PieceSVG.jsx";
import { CHESS_LIGHT_SQ } from "../../theme/boardTheme.js";

function PromotionDialog({ color, onSelect }) {
  const pieces = color==="w" ? ["Q","R","B","N"] : ["q","r","b","n"];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <div style={{background:"#141414",border:"1px solid #2a2a2a",borderRadius:18,
        padding:"22px 24px",boxShadow:"0 24px 60px #000a",animation:"opFade 0.15s ease"}}>
        <div style={{color:"#8891a8",fontSize:"0.72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14,textAlign:"center"}}>Promote pawn to</div>
        <div style={{display:"flex",gap:10}}>
          {pieces.map(p => (
            <button key={p} onClick={()=>onSelect(p)} style={{width:72,height:72,
              background:CHESS_LIGHT_SQ,border:"2px solid transparent",borderRadius:14,
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#2563EB";e.currentTarget.style.transform="translateY(-3px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="transparent";e.currentTarget.style.transform="translateY(0)";}}>
              <PieceSVG piece={p} size={56}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export {
  PromotionDialog,
};
