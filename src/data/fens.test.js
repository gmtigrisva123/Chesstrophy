import { describe, expect, it } from "vitest";
import { DQ_BANK } from "./dailyQuestions.js";
import { PUZZLE_DB } from "./puzzles.js";
import { STUDIES_DATA } from "./studies.js";

/**
 * Validates a FEN's board field structurally: eight ranks, each summing to
 * exactly eight squares, using only piece letters and digits.
 *
 * A malformed FEN does not throw anywhere in the app — `fenBoard()` simply
 * produces an array of the wrong length and the board renders with pieces
 * missing or shifted. That is exactly how puzzle "f2" shipped for a while with
 * a stray space in the middle of its third rank, splitting the FEN so only six
 * ranks parsed.
 *
 * @param {string} fen
 * @returns {string | null} A description of the problem, or null when valid.
 */
function validateFen(fen) {
  if (typeof fen !== "string" || fen.trim() === "") return "empty";

  const fields = fen.trim().split(/\s+/);
  if (fields.length < 2) return `expected at least 2 fields, got ${fields.length}`;

  const [board, sideToMove] = fields;
  const ranks = board.split("/");
  if (ranks.length !== 8) return `${ranks.length} ranks, expected 8`;

  for (const [index, rank] of ranks.entries()) {
    let squares = 0;
    for (const character of rank) {
      if (/[1-8]/.test(character)) squares += Number(character);
      else if (/[pnbrqkPNBRQK]/.test(character)) squares += 1;
      else return `rank ${8 - index} contains "${character}"`;
    }
    if (squares !== 8) return `rank ${8 - index} covers ${squares} squares, expected 8`;
  }

  if (!/^[wb]$/.test(sideToMove)) return `side to move is "${sideToMove}"`;
  return null;
}

/** Collects every FEN in the bundled content, labelled by where it came from. */
function collectFens() {
  const found = [];

  for (const puzzle of PUZZLE_DB) {
    found.push({ label: `puzzles/${puzzle.id}`, fen: puzzle.fen });
  }

  for (const [band, questions] of Object.entries(DQ_BANK)) {
    for (const question of questions) {
      if (question.fen) found.push({ label: `dailyQuestions/${band}/${question.id}`, fen: question.fen });
    }
  }

  for (const category of STUDIES_DATA) {
    for (const course of category.items) {
      for (const [index, chapter] of (course.content?.chapters ?? []).entries()) {
        if (chapter.fen) found.push({ label: `studies/${course.id}#${index}`, fen: chapter.fen });
      }
    }
  }

  return found;
}

describe("validateFen", () => {
  it("accepts the starting position", () => {
    expect(validateFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBeNull();
  });

  it("rejects a rank that does not cover eight squares", () => {
    expect(validateFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN w KQkq - 0 1")).toMatch(/rank 1/);
  });

  // The exact corruption that shipped: a space splits the board field, so the
  // last two ranks are read as the side-to-move field instead.
  it("rejects a board field broken by a stray space", () => {
    expect(validateFen("r1bq1rk1/ppp2ppp/2n1pn2/3p4/1bPP4/2NBP N2/PP3PPP/R1BQ1RK1 w - - 2 8")).toMatch(
      /6 ranks/,
    );
  });

  it("rejects an unknown piece letter", () => {
    expect(validateFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBXR w KQkq - 0 1")).toMatch(/"X"/);
  });
});

describe("bundled content", () => {
  const fens = collectFens();

  it("contains FENs to check", () => {
    expect(fens.length).toBeGreaterThan(10);
  });

  it.each(fens)("$label has a well-formed FEN", ({ fen }) => {
    expect(validateFen(fen)).toBeNull();
  });
});
