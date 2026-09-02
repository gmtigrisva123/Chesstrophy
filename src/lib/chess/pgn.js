import { sqName } from "./fen.js";

// ── PGN Parser ──────────────────────────────────────────────
function parsePGN(pgn) {
  const moves = [];
  const moveText = pgn.replace(/\{[^}]*\}/g,"").replace(/\([^)]*\)/g,"");
  const tokens = moveText.trim().split(/\s+/);
  for (const t of tokens) {
    if (!t || /^\d+\.+$/.test(t) || ["1-0","0-1","1/2-1/2","*"].includes(t)) continue;
    moves.push(t);
  }
  return moves;
}

// Convert SAN to from/to using chess engine
// Converts a move object (as produced by createChess()'s legalMoves/allLegalMoves)
// into SAN-ish notation for display. Not a full disambiguation-aware SAN
// generator (no need — callers only use this for informational "other legal
// tries" text, never for engine input), just piece + capture + destination.
function moveToSan(m, suffix = "") {
  if (!m) return "";
  if (m.castle === "K" || m.castle === "k") return "O-O" + suffix;
  if (m.castle === "Q" || m.castle === "q") return "O-O-O" + suffix;
  const dest = sqName(m.to);
  const promo = m.promo ? "=" + m.promo.toUpperCase() : "";
  const capture = !!m.captured || m.epCapture;
  const pieceLower = m.piece ? m.piece.toLowerCase() : "p";
  if (pieceLower === "p") {
    const fromFile = String.fromCharCode(97 + (m.from % 8));
    return (capture ? fromFile + "x" : "") + dest + promo + suffix;
  }
  return pieceLower.toUpperCase() + (capture ? "x" : "") + dest + suffix;
}

function sanToMove(chess, san) {
  const clean = san.replace(/[+#!?]/g,"");
  const all = chess.allLegalMoves();
  // Castling
  if (clean==="O-O"||clean==="0-0") { const m=all.find(m=>m.castle==="K"||m.castle==="k"); return m||null; }
  if (clean==="O-O-O"||clean==="0-0-0") { const m=all.find(m=>m.castle==="Q"||m.castle==="q"); return m||null; }
  const board = chess.getBoard();
  const turn = chess.getTurn();

  // Parse SAN
  let promo = null;
  let s = clean;
  if (s.includes("=")) { promo = s.split("=")[1][0]; s = s.split("=")[0]; }
  else if (/[QRBN]$/.test(s) && s.length > 2) { const last=s[s.length-1]; if ("QRBN".includes(last)) { promo=last; s=s.slice(0,-1); } }

  const toFile = s.slice(-2,-1).charCodeAt(0)-97;
  const toRank = 8-parseInt(s.slice(-1));
  const toSq = toRank*8+toFile;

  const pieceChar = s[0];
  let pieceLower = "p";
  let fromFile = -1, fromRank = -1;

  if ("KQRBN".includes(pieceChar)) {
    pieceLower = pieceChar.toLowerCase();
    s = s.slice(1);
    if (s.length > 2) {
      if (/[a-h]/.test(s[0])) fromFile = s[0].charCodeAt(0)-97;
      else if (/[1-8]/.test(s[0])) fromRank = 8-parseInt(s[0]);
    }
  } else {
    pieceLower = "p";
    if (s.length > 2 && /[a-h]/.test(s[0])) fromFile = s[0].charCodeAt(0)-97;
  }

  const expectedPiece = turn==="w" ? pieceLower.toUpperCase() : pieceLower;
  const candidates = all.filter(m => {
    if (m.to !== toSq) return false;
    if (board[m.from] !== expectedPiece) return false;
    if (fromFile >= 0 && m.from % 8 !== fromFile) return false;
    if (fromRank >= 0 && Math.floor(m.from/8) !== fromRank) return false;
    if (promo && m.promo && m.promo.toLowerCase() !== promo.toLowerCase()) return false;
    return true;
  });
  return candidates[0] || null;
}

export {
  parsePGN,
  moveToSan,
  sanToMove,
};
