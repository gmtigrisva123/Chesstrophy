import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `client.js` reads import.meta.env once at module evaluation, so each case
 * stubs the environment and then imports a fresh copy of the module.
 */
async function loadClient({ url, key } = {}) {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", url ?? "");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", key ?? "");
  return import("./client.js");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("isSupabaseConfigured", () => {
  // The default must be "no backend": the app is local-first, and a missing
  // env file should never be an error.
  it("is false when nothing is configured", async () => {
    const { isSupabaseConfigured } = await loadClient();
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("is false when only the URL is set", async () => {
    const { isSupabaseConfigured } = await loadClient({ url: "https://example.supabase.co" });
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("is false when only the key is set", async () => {
    const { isSupabaseConfigured } = await loadClient({ key: "anon-key" });
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("is true when both are set", async () => {
    const { isSupabaseConfigured } = await loadClient({
      url: "https://example.supabase.co",
      key: "anon-key",
    });
    expect(isSupabaseConfigured()).toBe(true);
  });
});

describe("getSupabaseClient", () => {
  it("refuses with an actionable message when unconfigured", async () => {
    const { getSupabaseClient } = await loadClient();
    expect(() => getSupabaseClient()).toThrow(/VITE_SUPABASE_URL/);
  });

  // One client per tab: several would each open their own auth listener and
  // disagree about the current session.
  it("returns the same promise on repeat calls", async () => {
    const { getSupabaseClient } = await loadClient({
      url: "https://example.supabase.co",
      key: "anon-key",
    });
    expect(getSupabaseClient()).toBe(getSupabaseClient());
  });

  it("creates a client bound to the configured project", async () => {
    const { getSupabaseClient } = await loadClient({
      url: "https://example.supabase.co",
      key: "anon-key",
    });
    const client = await getSupabaseClient();
    expect(client).toBeTruthy();
    expect(typeof client.from).toBe("function");
    expect(typeof client.rpc).toBe("function");
  });
});
