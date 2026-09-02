import { createChess } from "./engine.js";
import { sanToMove } from "./pgn.js";

// Build SAN move list into a FEN history using the chess engine
function buildVariationFens(moves) {
  const chess = createChess();
  const fens = [chess.getFen()];
  for (const m of moves) {
    const mv = sanToMove(chess, m.san);
    if (!mv) break;
    chess.move(mv.from, mv.to, mv.promo);
    fens.push(chess.getFen());
  }
  return fens;
}

export {
  buildVariationFens,
};
