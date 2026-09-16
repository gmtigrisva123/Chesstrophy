import { beforeEach, describe, expect, it } from "vitest";
import { loadAuditLog } from "./adminAudit.js";
import { endAdminSession, startAdminSession } from "./adminAuth.js";
import { deleteRecord, exportAdminBackup, importAdminBackup, patchRecord, resetAdminDataToDefaults, upsertRecord, validateFen, validatePuzzleSolution } from "./adminContent.js";
import { loadAdminData } from "./adminData.js";
import { __bootstrapStorage } from "../lib/storage/storageBridge.js";

describe("adminContent", () => {
  beforeEach(async () => {
    await __bootstrapStorage();
    endAdminSession();
    startAdminSession({ actor: "tester", mode: "local" });
  });

  it("creates, patches and deletes records, logging each step with the actor", () => {
    upsertRecord("news", { id: "n_test", title: "Hello", content: "Body", published: false }, { label: "News post" });
    expect(loadAdminData().news.find(n => n.id === "n_test")).toMatchObject({ title: "Hello" });

    patchRecord("news", "n_test", { published: true }, { label: "News post" });
    expect(loadAdminData().news.find(n => n.id === "n_test").published).toBe(true);

    const removed = deleteRecord("news", "n_test", { label: "News post" });
    expect(removed.title).toBe("Hello");
    expect(loadAdminData().news.some(n => n.id === "n_test")).toBe(false);

    const log = loadAuditLog();
    expect(log.map(e => e.action)).toEqual(["news.delete", "news.patch", "news.create"]);
    expect(log.every(e => e.actor === "tester")).toBe(true);
  });

  it("round-trips a backup and ignores unknown sections", () => {
    upsertRecord("announcements", { id: "a_x", title: "Keep me", body: "…", active: true });
    const backup = exportAdminBackup();
    resetAdminDataToDefaults();
    expect(loadAdminData().announcements).toHaveLength(0);

    const parsed = JSON.parse(backup);
    parsed.adminData.notARealSection = [1, 2, 3];
    const restored = importAdminBackup(JSON.stringify(parsed));
    expect(restored).toContain("announcements");
    expect(loadAdminData().announcements[0].title).toBe("Keep me");
    expect(loadAdminData().notARealSection).toBeUndefined();
  });

  it("refuses files that are not backups", () => {
    expect(() => importAdminBackup("not json")).toThrow(/valid JSON/);
    expect(() => importAdminBackup(JSON.stringify({ hello: "world" }))).toThrow(/content sections/);
  });

  it("validates FENs", () => {
    expect(validateFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBe("");
    expect(validateFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1")).toMatch(/8 ranks/);
    expect(validateFen("rnbqkbnr/pppppppp/9/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1")).toMatch(/character|add up/);
    expect(validateFen("8/8/8/8/8/8/8/8 w - - 0 1")).toMatch(/kings/);
  });

  it("plays a puzzle solution through the engine", () => {
    const fen = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5";
    expect(validatePuzzleSolution(fen, ["d1e2", "e8g8"])).toBe("");
    expect(validatePuzzleSolution(fen, "d1e2 e8g8")).toBe("");
    expect(validatePuzzleSolution(fen, ["a1a3"])).toMatch(/not legal/); // rook blocked by its own pawn
    expect(validatePuzzleSolution(fen, ["zz"])).toMatch(/look like/);
    expect(validatePuzzleSolution(fen, [])).toMatch(/at least one/);
  });
});
