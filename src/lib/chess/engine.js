// PGN parser

// ─────────────────────────────────────────────────────────────
// CHESS ENGINE — full legal move validation (no external deps)
// ─────────────────────────────────────────────────────────────

function createChess(fenStr) {
  const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const fen = fenStr || START;

  // ── FEN parse ──
  function parseFen(f) {
    const p = f.split(" ");
    const board = Array(64).fill(null);
    let sq = 0;
    for (const ch of p[0]) {
      if (ch === "/") continue;
      if (/\d/.test(ch)) sq += Number(ch);
      else board[sq++] = ch;
    }
    return { board, turn: p[1] || "w", castling: p[2] || "-", ep: p[3] || "-", half: Number(p[4]) || 0, full: Number(p[5]) || 1 };
  }

  function toFen(state) {
    const rows = [];
    for (let r = 0; r < 8; r++) {
      let row = ""; let empty = 0;
      for (let c = 0; c < 8; c++) {
        const pc = state.board[r * 8 + c];
        if (pc) { if (empty) { row += empty; empty = 0; } row += pc; } else empty++;
      }
      if (empty) row += empty;
      rows.push(row);
    }
    return `${rows.join("/")} ${state.turn} ${state.castling} ${state.ep} ${state.half} ${state.full}`;
  }

  let state = parseFen(fen);
  const history = [];
  const fenHistory = [fen];

  function idx(r, c) { return r * 8 + c; }
  function rc(i) { return [Math.floor(i / 8), i % 8]; }
  function isWhite(p) { return p && p === p.toUpperCase(); }
  function isBlack(p) { return p && p === p.toLowerCase(); }
  function enemy(turn, p) { return p && (turn === "w" ? isBlack(p) : isWhite(p)); }
  function friendly(turn, p) { return p && (turn === "w" ? isWhite(p) : isBlack(p)); }

  function attacked(board, sq, byColor) {
    const [tr, tc] = rc(sq);
    // Pawns
    const dir = byColor === "w" ? 1 : -1;
    for (const dc of [-1, 1]) {
      const pr = tr + dir, pc2 = tc + dc;
      if (pr >= 0 && pr < 8 && pc2 >= 0 && pc2 < 8) {
        const p = board[idx(pr, pc2)];
        if (p && (byColor === "w" ? p === "P" : p === "p")) return true;
      }
    }
    // Knights
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const nr = tr+dr, nc = tc+dc;
      if (nr>=0&&nr<8&&nc>=0&&nc<8) {
        const p = board[idx(nr,nc)];
        if (p && (byColor==="w"?p==="N":p==="n")) return true;
      }
    }
    // Bishops/Queens (diagonal)
    for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      let r2=tr+dr, c2=tc+dc;
      while (r2>=0&&r2<8&&c2>=0&&c2<8) {
        const p = board[idx(r2,c2)];
        if (p) {
          if (byColor==="w"?(p==="B"||p==="Q"):(p==="b"||p==="q")) return true;
          break;
        }
        r2+=dr; c2+=dc;
      }
    }
    // Rooks/Queens (orthogonal)
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      let r2=tr+dr, c2=tc+dc;
      while (r2>=0&&r2<8&&c2>=0&&c2<8) {
        const p = board[idx(r2,c2)];
        if (p) {
          if (byColor==="w"?(p==="R"||p==="Q"):(p==="r"||p==="q")) return true;
          break;
        }
        r2+=dr; c2+=dc;
      }
    }
    // Kings
    for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const nr=tr+dr, nc=tc+dc;
      if (nr>=0&&nr<8&&nc>=0&&nc<8) {
        const p = board[idx(nr,nc)];
        if (p && (byColor==="w"?p==="K":p==="k")) return true;
      }
    }
    return false;
  }

  function kingSquare(board, color) {
    const k = color==="w" ? "K" : "k";
    return board.findIndex(p => p === k);
  }

  function inCheck(board, turn) {
    const ks = kingSquare(board, turn);
    if (ks < 0) return false;
    return attacked(board, ks, turn==="w"?"b":"w");
  }

  function pseudoMoves(st, fromSq) {
    const board = st.board;
    const piece = board[fromSq];
    if (!piece) return [];
    const turn = st.turn;
    if (turn==="w" && !isWhite(piece)) return [];
    if (turn==="b" && !isBlack(piece)) return [];
    const [fr, fc] = rc(fromSq);
    const moves = [];
    const type = piece.toLowerCase();

    const add = (toSq, flags={}) => {
      if (toSq < 0 || toSq > 63) return;
      if (friendly(turn, board[toSq])) return;
      moves.push({ from: fromSq, to: toSq, piece, captured: board[toSq], ...flags });
    };

    if (type === "p") {
      const dir = turn==="w" ? -1 : 1;
      const startRow = turn==="w" ? 6 : 1;
      const promRow = turn==="w" ? 0 : 7;
      // Forward
      const fwd = idx(fr+dir, fc);
      if (fr+dir>=0&&fr+dir<8 && !board[fwd]) {
        const promo = (fr+dir===promRow);
        if (promo) { for (const p of ["q","r","b","n"]) moves.push({from:fromSq,to:fwd,piece,captured:null,promo:turn==="w"?p.toUpperCase():p}); }
        else { moves.push({from:fromSq,to:fwd,piece,captured:null}); }
        // Double push
        if (fr===startRow) {
          const fwd2 = idx(fr+2*dir, fc);
          if (!board[fwd2]) moves.push({from:fromSq,to:fwd2,piece,captured:null,doublePush:true});
        }
      }
      // Captures
      for (const dc of [-1,1]) {
        const tc2 = fc+dc;
        if (tc2<0||tc2>7) continue;
        const toSq2 = idx(fr+dir, tc2);
        const ep = st.ep !== "-" && toSq2 === (()=>{const f=st.ep.charCodeAt(0)-97,r2=8-parseInt(st.ep[1]);return idx(r2,f);})();
        if (enemy(turn, board[toSq2])) {
          const promo = (fr+dir===promRow);
          if (promo) for (const p of ["q","r","b","n"]) moves.push({from:fromSq,to:toSq2,piece,captured:board[toSq2],promo:turn==="w"?p.toUpperCase():p});
          else moves.push({from:fromSq,to:toSq2,piece,captured:board[toSq2]});
        } else if (ep) {
          moves.push({from:fromSq,to:toSq2,piece,captured:turn==="w"?"p":"P",epCapture:true});
        }
      }
    } else if (type === "n") {
      for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr=fr+dr, nc=fc+dc;
        if (nr>=0&&nr<8&&nc>=0&&nc<8) add(idx(nr,nc));
      }
    } else if (type === "b") {
      for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        let r2=fr+dr, c2=fc+dc;
        while (r2>=0&&r2<8&&c2>=0&&c2<8) {
          const to=idx(r2,c2);
          if (board[to]) { if (enemy(turn,board[to])) add(to); break; }
          add(to); r2+=dr; c2+=dc;
        }
      }
    } else if (type === "r") {
      for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        let r2=fr+dr, c2=fc+dc;
        while (r2>=0&&r2<8&&c2>=0&&c2<8) {
          const to=idx(r2,c2);
          if (board[to]) { if (enemy(turn,board[to])) add(to); break; }
          add(to); r2+=dr; c2+=dc;
        }
      }
    } else if (type === "q") {
      for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) {
        let r2=fr+dr, c2=fc+dc;
        while (r2>=0&&r2<8&&c2>=0&&c2<8) {
          const to=idx(r2,c2);
          if (board[to]) { if (enemy(turn,board[to])) add(to); break; }
          add(to); r2+=dr; c2+=dc;
        }
      }
    } else if (type === "k") {
      for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const nr=fr+dr, nc=fc+dc;
        if (nr>=0&&nr<8&&nc>=0&&nc<8) add(idx(nr,nc));
      }
      // Castling
      const enemy2 = turn==="w"?"b":"w";
      if (!inCheck(board, turn)) {
        if (turn==="w") {
          if (st.castling.includes("K") && !board[61] && !board[62] && !attacked(board,61,enemy2) && !attacked(board,62,enemy2))
            moves.push({from:fromSq,to:62,piece,captured:null,castle:"K"});
          if (st.castling.includes("Q") && !board[59] && !board[58] && !board[57] && !attacked(board,59,enemy2) && !attacked(board,58,enemy2))
            moves.push({from:fromSq,to:58,piece,captured:null,castle:"Q"});
        } else {
          if (st.castling.includes("k") && !board[5] && !board[6] && !attacked(board,5,enemy2) && !attacked(board,6,enemy2))
            moves.push({from:fromSq,to:6,piece,captured:null,castle:"k"});
          if (st.castling.includes("q") && !board[3] && !board[2] && !board[1] && !attacked(board,3,enemy2) && !attacked(board,2,enemy2))
            moves.push({from:fromSq,to:2,piece,captured:null,castle:"q"});
        }
      }
    }
    return moves;
  }

  function applyMove(st, mv) {
    const b = [...st.board];
    b[mv.to] = mv.promo || mv.piece;
    b[mv.from] = null;
    if (mv.epCapture) { const [,ec] = rc(mv.to); const epR = rc(mv.from)[0]; b[idx(epR,ec)] = null; }
    if (mv.castle) {
      if (mv.castle==="K") { b[61]=b[63]; b[63]=null; }
      else if (mv.castle==="Q") { b[59]=b[56]; b[56]=null; }
      else if (mv.castle==="k") { b[5]=b[7]; b[7]=null; }
      else if (mv.castle==="q") { b[3]=b[0]; b[0]=null; }
    }
    // Update castling rights
    let cas = st.castling;
    const p = mv.piece.toLowerCase();
    if (p==="k") cas = st.turn==="w" ? cas.replace("K","").replace("Q","") : cas.replace("k","").replace("q","");
    if (p==="r") {
      if (mv.from===63) cas=cas.replace("K","");
      if (mv.from===56) cas=cas.replace("Q","");
      if (mv.from===7)  cas=cas.replace("k","");
      if (mv.from===0)  cas=cas.replace("q","");
    }
    if (mv.to===63) cas=cas.replace("K","");
    if (mv.to===56) cas=cas.replace("Q","");
    if (mv.to===7)  cas=cas.replace("k","");
    if (mv.to===0)  cas=cas.replace("q","");
    const ep = mv.doublePush ? (()=>{const [r2,c2]=rc(mv.to);return String.fromCharCode(97+c2)+(8-(r2+(st.turn==="w"?1:-1)));})() : "-";
    const half = (mv.captured || p==="p") ? 0 : st.half+1;
    const full = st.turn==="b" ? st.full+1 : st.full;
    return { board: b, turn: st.turn==="w"?"b":"w", castling: cas||"-", ep, half, full };
  }

  function legalMoves(fromSq) {
    const pseudo = pseudoMoves(state, fromSq);
    return pseudo.filter(mv => {
      const next = applyMove(state, mv);
      return !inCheck(next.board, state.turn);
    });
  }

  function allLegalMoves() {
    const moves = [];
    for (let i = 0; i < 64; i++) {
      if (state.board[i] && (state.turn==="w"?isWhite(state.board[i]):isBlack(state.board[i])))
        moves.push(...legalMoves(i));
    }
    return moves;
  }

  function move(from, to, promo) {
    const legal = legalMoves(from).filter(m => m.to===to && (!m.promo || m.promo?.toLowerCase()===promo?.toLowerCase()||!promo));
    if (!legal.length) return null;
    const mv = promo ? legal.find(m=>m.promo?.toLowerCase()===promo.toLowerCase()) || legal[0] : legal[0];
    history.push({ move: mv, state: { ...state, board: [...state.board] } });
    state = applyMove(state, mv);
    fenHistory.push(toFen(state));
    return mv;
  }

  function undo() {
    if (!history.length) return false;
    const prev = history.pop();
    state = prev.state;
    fenHistory.pop();
    return true;
  }

  function isGameOver() {
    if (!allLegalMoves().length) return inCheck(state.board, state.turn) ? "checkmate" : "stalemate";
    if (state.half >= 100) return "fifty-move";
    return null;
  }

  function getFen() { return toFen(state); }
  function getBoard() { return [...state.board]; }
  function getTurn() { return state.turn; }
  function isInCheck() { return inCheck(state.board, state.turn); }
  function getHistory() { return [...history]; }
  function loadFen(f) { state = parseFen(f); }

  return { move, undo, legalMoves, allLegalMoves, getFen, getBoard, getTurn, isInCheck, isGameOver, getHistory, loadFen, toFen, parseFen, applyMove };
}

export {
  createChess,
};
