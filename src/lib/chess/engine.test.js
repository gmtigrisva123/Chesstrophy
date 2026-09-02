import { describe, expect, it } from "vitest";
import { createChess } from "./engine.js";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Board index for algebraic square notation, e.g. "e4" -> 36. */
function sq(name) {
  return (8 - Number(name[1])) * 8 + (name.charCodeAt(0) - 97);
}

describe("createChess", () => {
  it("starts from the standard position when given no FEN", () => {
    expect(createChess().getFen()).toBe(START_FEN);
  });

  it("round-trips a FEN through parse and serialise", () => {
    const fen = "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3";
    expect(createChess(fen).getFen()).toBe(fen);
  });

  it("advances the side to move after a legal move", () => {
    const chess = createChess();
    expect(chess.getTurn()).toBe("w");
    expect(chess.move(sq("e2"), sq("e4"))).toBeTruthy();
    expect(chess.getTurn()).toBe("b");
  });

  it("rejects a move that leaves its own king in check", () => {
    // Black king e8, black rook e7, white rook e1: the black rook is pinned to
    // the file, so stepping off it would expose the king.
    const chess = createChess("4k3/4r3/8/8/8/8/8/4R2K b - - 0 1");
    expect(chess.move(sq("e7"), sq("d7"))).toBeFalsy();
    // Sliding along the file keeps the king shielded, so that stays legal.
    expect(chess.move(sq("e7"), sq("e6"))).toBeTruthy();
  });

  it("allows kingside castling and relocates the rook", () => {
    const chess = createChess("r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 3 4");
    expect(chess.move(sq("e1"), sq("g1"))).toBeTruthy();
    const board = chess.getBoard();
    expect(board[sq("g1")]).toBe("K");
    expect(board[sq("f1")]).toBe("R");
    expect(board[sq("h1")]).toBeNull();
  });

  it("promotes a pawn to the requested piece", () => {
    const chess = createChess("8/4P3/8/8/8/8/8/k6K w - - 0 1");
    expect(chess.move(sq("e7"), sq("e8"), "q")).toBeTruthy();
    expect(chess.getBoard()[sq("e8")]).toBe("Q");
  });

  it("detects check", () => {
    const chess = createChess("4k3/8/8/8/8/8/8/4R2K b - - 0 1");
    expect(chess.isInCheck()).toBe(true);
  });

  it("reports checkmate as game over", () => {
    // Fool's mate: Black's queen on h4 mates.
    const chess = createChess("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3");
    expect(chess.isGameOver()).toBeTruthy();
  });

  it("undo restores the previous position", () => {
    const chess = createChess();
    chess.move(sq("e2"), sq("e4"));
    chess.undo();
    expect(chess.getFen()).toBe(START_FEN);
    expect(chess.getTurn()).toBe("w");
  });

  it("offers exactly twenty legal opening moves for White", () => {
    expect(createChess().allLegalMoves()).toHaveLength(20);
  });

  it("legalMoves is empty for an empty square", () => {
    expect(createChess().legalMoves(sq("e4"))).toHaveLength(0);
  });
});
