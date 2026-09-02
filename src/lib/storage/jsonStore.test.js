import { beforeEach, describe, expect, it, vi } from "vitest";
import { readJson, writeJson } from "./jsonStore.js";
import { __bootstrapStorage, __cacheGet } from "./storageBridge.js";

describe("jsonStore", () => {
  beforeEach(async () => {
    await __bootstrapStorage();
  });

  it("round-trips a value", () => {
    expect(writeJson("chessprophy_profile", { username: "Magnus" })).toBe(true);
    expect(readJson("chessprophy_profile", () => null)).toEqual({ username: "Magnus" });
  });

  it("falls back when nothing is stored", () => {
    expect(readJson("chessprophy_profile", () => ({ fresh: true }))).toEqual({ fresh: true });
  });

  it("builds the default lazily, not on every read", () => {
    const createDefault = vi.fn(() => ({}));
    writeJson("chessprophy_economy", { coins: 5 });
    readJson("chessprophy_economy", createDefault);
    expect(createDefault).not.toHaveBeenCalled();
  });

  it("falls back when the stored value is not valid JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const key = "chessprophy_puzzles";
    // Plant a corrupt record directly in the host store, then re-hydrate the
    // in-memory cache the way the app does at boot.
    await window.storage.set(key, "{not json", false);
    await __bootstrapStorage();
    expect(__cacheGet(key)).toBe("{not json");

    expect(readJson(key, () => ({ safe: true }))).toEqual({ safe: true });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("reports a write failure instead of throwing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cyclic = {};
    cyclic.self = cyclic;
    expect(writeJson("chessprophy_openings", cyclic)).toBe(false);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
