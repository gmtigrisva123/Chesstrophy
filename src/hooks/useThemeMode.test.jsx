import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useThemeMode } from "./useThemeMode.js";
import { __bootstrapStorage } from "../lib/storage/storageBridge.js";
import { loadProfile } from "../services/profile.js";

/** Replaces window.matchMedia with a controllable stub. */
function stubColorScheme(prefersDark) {
  const listeners = new Set();
  const query = {
    matches: prefersDark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_type, fn) => listeners.add(fn),
    removeEventListener: (_type, fn) => listeners.delete(fn),
  };
  vi.stubGlobal("matchMedia", () => query);
  return {
    query,
    emit(next) {
      query.matches = next;
      listeners.forEach(fn => fn(query));
    },
  };
}

describe("useThemeMode", () => {
  beforeEach(async () => {
    await __bootstrapStorage();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to dark", () => {
    stubColorScheme(false);
    const { result } = renderHook(() => useThemeMode());
    expect(result.current.themeMode).toBe("dark");
    expect(result.current.dark).toBe(true);
  });

  it("mirrors the resolved scheme onto the document", () => {
    stubColorScheme(false);
    const { result } = renderHook(() => useThemeMode());
    expect(document.documentElement.dataset.theme).toBe("dark");

    act(() => result.current.setThemeMode("light"));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(result.current.dark).toBe(false);
  });

  it("persists the preference to the profile", () => {
    stubColorScheme(false);
    const { result } = renderHook(() => useThemeMode());
    act(() => result.current.setThemeMode("light"));
    expect(loadProfile().themeMode).toBe("light");
  });

  it("resolves 'system' from the OS preference", () => {
    stubColorScheme(false);
    const { result } = renderHook(() => useThemeMode());
    act(() => result.current.setThemeMode("system"));
    expect(result.current.dark).toBe(false);
  });

  it("follows OS changes while the mode is 'system'", () => {
    const scheme = stubColorScheme(false);
    const { result } = renderHook(() => useThemeMode());
    act(() => result.current.setThemeMode("system"));
    expect(result.current.dark).toBe(false);

    act(() => scheme.emit(true));
    expect(result.current.dark).toBe(true);
  });

  it("ignores OS changes once an explicit mode is chosen", () => {
    const scheme = stubColorScheme(false);
    const { result } = renderHook(() => useThemeMode());
    act(() => result.current.setThemeMode("light"));

    act(() => scheme.emit(true));
    expect(result.current.dark).toBe(false);
  });

  it("accepts the legacy boolean setDark shim", () => {
    stubColorScheme(false);
    const { result } = renderHook(() => useThemeMode());
    act(() => result.current.setDark(false));
    expect(result.current.themeMode).toBe("light");
  });
});
