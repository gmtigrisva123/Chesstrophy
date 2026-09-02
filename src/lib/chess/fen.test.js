import { describe, expect, it } from "vitest";
import { algSqToIdx, applySimpleMove, fenBoard, movesMatch, nameToSq, parseSquarePairMove, sqName } from "./fen.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("fenBoard", () => {
  it("expands a FEN into 64 squares", () => {
    const board = fenBoard(START);
    expect(board).toHaveLength(64);
    expect(board[0]).toBe("r");
    expect(board[63]).toBe("R");
    expect(board[nameToSq("e4")]).toBeNull();
  });

  it("expands multi-digit runs of empty squares", () => {
    expect(fenBoard("8/8/8/8/8/8/8/8 w - - 0 1").every(s => s === null)).toBe(true);
  });
});

describe("square naming", () => {
  it("round-trips between name and index", () => {
    for (const name of ["a1", "a8", "h1", "h8", "e4", "d5"]) {
      expect(sqName(nameToSq(name))).toBe(name);
    }
  });

  it("agrees with algSqToIdx", () => {
    expect(algSqToIdx("e4")).toBe(nameToSq("e4"));
    expect(algSqToIdx("a8")).toBe(0);
    expect(algSqToIdx("h1")).toBe(63);
  });
});

describe("parseSquarePairMove", () => {
  it("reads a plain move", () => {
    expect(parseSquarePairMove("e2e4")).toEqual({ from: nameToSq("e2"), to: nameToSq("e4"), promo: undefined });
  });

  it("reads a promotion suffix", () => {
    expect(parseSquarePairMove("c2c1q").promo).toBe("q");
  });
});

describe("applySimpleMove", () => {
  it("moves the piece and clears the origin", () => {
    const after = applySimpleMove(fenBoard(START), nameToSq("e2"), nameToSq("e4"));
    expect(after[nameToSq("e4")]).toBe("P");
    expect(after[nameToSq("e2")]).toBeNull();
  });

  it("does not mutate the board it is given", () => {
    const before = fenBoard(START);
    applySimpleMove(before, nameToSq("e2"), nameToSq("e4"));
    expect(before[nameToSq("e2")]).toBe("P");
  });

  // Regression: a castle used to render as the king teleporting past a rook
  // that never moved, because only the king's square was updated.
  it("relocates the rook when the king castles kingside", () => {
    const after = applySimpleMove(fenBoard("4k2r/8/8/8/8/8/8/4K2R b Kk - 0 1"), nameToSq("e8"), nameToSq("g8"));
    expect(after[nameToSq("g8")]).toBe("k");
    expect(after[nameToSq("f8")]).toBe("r");
    expect(after[nameToSq("h8")]).toBeNull();
  });

  it("relocates the rook when the king castles queenside", () => {
    const after = applySimpleMove(fenBoard("r3k3/8/8/8/8/8/8/R3K3 w Qq - 0 1"), nameToSq("e1"), nameToSq("c1"));
    expect(after[nameToSq("c1")]).toBe("K");
    expect(after[nameToSq("d1")]).toBe("R");
    expect(after[nameToSq("a1")]).toBeNull();
  });

  it("leaves rooks alone for a one-square king move", () => {
    const after = applySimpleMove(fenBoard("4k2r/8/8/8/8/8/8/4K2R b Kk - 0 1"), nameToSq("e8"), nameToSq("f8"));
    expect(after[nameToSq("h8")]).toBe("r");
  });
});

describe("movesMatch", () => {
  it("matches a solution token by its from/to squares", () => {
    expect(movesMatch(nameToSq("d1"), nameToSq("e2"), "d1e2")).toBe(true);
    expect(movesMatch(nameToSq("d1"), nameToSq("e3"), "d1e2")).toBe(false);
  });

  it("matches a promotion token by its squares alone", () => {
    expect(movesMatch(nameToSq("c2"), nameToSq("c1"), "c2c1q")).toBe(true);
  });
});
