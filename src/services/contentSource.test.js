import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `contentSource` decides local-vs-remote through `isSupabaseConfigured()`, so
 * each case mocks that module and re-imports for a clean decision.
 */
async function loadModule({ configured }) {
  vi.resetModules();
  vi.doMock("../lib/supabase/client.js", () => ({
    isSupabaseConfigured: () => configured,
    getSupabaseClient: () => {
      throw new Error("should not be called in these tests");
    },
  }));
  return import("./contentSource.js");
}

/** Replaces the catalogue repository the module lazily imports. */
function mockCatalogue(overrides) {
  vi.doMock("../lib/supabase/repositories/catalogue.js", () => ({
    fetchOpenings: vi.fn(async () => []),
    fetchPuzzles: vi.fn(async () => []),
    fetchClassicGames: vi.fn(async () => []),
    fetchStudies: vi.fn(async () => []),
    ...overrides,
  }));
}

afterEach(() => {
  vi.doUnmock("../lib/supabase/client.js");
  vi.doUnmock("../lib/supabase/repositories/catalogue.js");
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("with no backend configured", () => {
  let content;
  let originalRepertoire;

  beforeEach(async () => {
    content = await loadModule({ configured: false });
    ({ OPENING_REPERTOIRE: originalRepertoire } = await import("../data/openingRepertoire.js"));
  });

  it("reports remote content as disabled", () => {
    expect(content.isRemoteContentEnabled()).toBe(false);
  });

  it("serves the bundled openings", async () => {
    await expect(content.loadOpenings()).resolves.toEqual(originalRepertoire);
  });

  it("serves the bundled puzzles", async () => {
    const { PUZZLE_DB } = await import("../data/puzzles.js");
    await expect(content.loadPuzzles()).resolves.toEqual(PUZZLE_DB);
  });

  it("serves the bundled classic games", async () => {
    const { ALL_GAMES } = await import("../data/classicGames.js");
    await expect(content.loadClassicGames()).resolves.toEqual(ALL_GAMES);
  });

  it("serves the bundled studies", async () => {
    const { STUDIES_DATA } = await import("../data/studies.js");
    await expect(content.loadStudies()).resolves.toEqual(STUDIES_DATA);
  });
});

describe("with a backend configured", () => {
  it("reports remote content as enabled", async () => {
    mockCatalogue({});
    const content = await loadModule({ configured: true });
    expect(content.isRemoteContentEnabled()).toBe(true);
  });

  it("returns what the backend gives it", async () => {
    const remote = [{ id: "kings-gambit", name: "King's Gambit", variations: [] }];
    mockCatalogue({ fetchOpenings: vi.fn(async () => remote) });
    const content = await loadModule({ configured: true });
    await expect(content.loadOpenings()).resolves.toEqual(remote);
  });

  // A backend outage must degrade to bundled content, not to a blank screen.
  it("falls back to bundled content when the backend throws", async () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCatalogue({
      fetchOpenings: vi.fn(async () => {
        throw new Error("network down");
      }),
    });
    const content = await loadModule({ configured: true });
    const { OPENING_REPERTOIRE } = await import("../data/openingRepertoire.js");

    await expect(content.loadOpenings()).resolves.toEqual(OPENING_REPERTOIRE);
    // The outage is still reported rather than silently swallowed.
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  // An empty table is almost always an unseeded database, and rendering
  // nothing would look like data loss.
  it("falls back when the backend returns nothing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockCatalogue({ fetchPuzzles: vi.fn(async () => []) });
    const content = await loadModule({ configured: true });
    const { PUZZLE_DB } = await import("../data/puzzles.js");

    await expect(content.loadPuzzles()).resolves.toEqual(PUZZLE_DB);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("passes pagination options through to the backend", async () => {
    const fetchClassicGames = vi.fn(async () => [{ id: 1 }]);
    mockCatalogue({ fetchClassicGames });
    const content = await loadModule({ configured: true });

    await content.loadClassicGames({ page: 2, pageSize: 10 });
    expect(fetchClassicGames).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
  });
});
