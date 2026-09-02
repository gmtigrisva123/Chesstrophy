import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PuzzleBoard } from "./PuzzleBoard.jsx";
import { PUZZLE_DB } from "../../data/puzzles.js";
import { applySimpleMove, fenBoard, nameToSq } from "../../lib/chess/fen.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Alt text the board renders for each occupied square, in board order. */
function pieceAlts(container) {
  return [...container.querySelectorAll("img")].map(img => img.getAttribute("alt"));
}

describe("PuzzleBoard", () => {
  it("derives the position from the FEN when no board is supplied", () => {
    const { container } = render(<PuzzleBoard fen={START} />);
    // 32 pieces at the start of a game.
    expect(pieceAlts(container)).toHaveLength(32);
  });

  it("renders an empty board for an empty FEN", () => {
    const { container } = render(<PuzzleBoard fen="8/8/8/8/8/8/8/8 w - - 0 1" />);
    expect(pieceAlts(container)).toHaveLength(0);
  });

  // Regression: puzzle "f2" shipped with a stray space inside its FEN
  // ("…/2NBP N2/…"), which split the board field so only six ranks parsed. No
  // error was raised anywhere — the board simply rendered 40 squares with the
  // pieces shifted. This renders the real position from the catalogue.
  it("renders all 64 squares and 32 pieces for every catalogue puzzle", () => {
    for (const puzzle of PUZZLE_DB) {
      const { container, unmount } = render(<PuzzleBoard fen={puzzle.fen} />);
      expect(
        container.querySelectorAll("[data-square]"),
        `${puzzle.id} should render a full board`,
      ).toHaveLength(64);
      unmount();
    }
  });

  it("renders the corrected f2 position with its full complement of pieces", () => {
    const f2 = PUZZLE_DB.find(p => p.id === "f2");
    const { container } = render(<PuzzleBoard fen={f2.fen} />);
    expect(container.querySelectorAll("[data-square]")).toHaveLength(64);
    // 32 pieces remain in that position; before the fix only 20 rendered.
    expect(pieceAlts(container)).toHaveLength(32);
  });

  // Regression: PuzzleBoard used to ignore the `board` prop and always re-derive
  // the starting FEN, so a solved puzzle showed pieces that had never moved.
  it("renders the live board prop rather than re-deriving the starting FEN", () => {
    const moved = applySimpleMove(fenBoard(START), nameToSq("e2"), nameToSq("e4"));
    const { container } = render(<PuzzleBoard fen={START} board={moved} />);

    const squares = container.querySelectorAll("[data-square]");
    expect(squares.length).toBeGreaterThan(0);
    const e2 = container.querySelector(`[data-square="${nameToSq("e2")}"]`);
    const e4 = container.querySelector(`[data-square="${nameToSq("e4")}"]`);
    expect(e2.querySelector("img")).toBeNull();
    expect(e4.querySelector("img")).not.toBeNull();
  });
});
