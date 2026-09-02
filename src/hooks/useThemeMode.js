import { useCallback, useEffect, useState } from "react";
import { loadProfile, saveProfile } from "../services/profile.js";

/** @typedef {"light" | "dark" | "system"} ThemeMode */

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Reads the OS-level colour preference. Returns `true` when the platform has no
 * opinion, matching the app's dark-first design.
 *
 * @returns {boolean}
 */
function prefersDark() {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia(DARK_QUERY).matches;
}

/**
 * Resolves a stored preference into the boolean the UI actually renders with.
 *
 * @param {ThemeMode} mode
 * @returns {boolean}
 */
function resolveDark(mode) {
  return mode === "system" ? prefersDark() : mode === "dark";
}

/**
 * Owns the app's colour scheme: the persisted preference, the resolved
 * light/dark boolean, and the `data-theme` attribute the global stylesheet
 * keys off. Keeping the attribute in sync here — rather than in a `<style>`
 * tag inside the main shell — is what lets the landing, onboarding and
 * maintenance screens share the same page background.
 *
 * @returns {{ themeMode: ThemeMode, dark: boolean, setThemeMode: (mode: ThemeMode) => void, setDark: (value: boolean) => void }}
 */
function useThemeMode() {
  const [themeMode, setThemeModeState] = useState(() => loadProfile().themeMode || "dark");
  const [dark, setDark] = useState(() => resolveDark(themeMode));

  const setThemeMode = useCallback((mode) => {
    setThemeModeState(mode);
    setDark(resolveDark(mode));
    saveProfile({ ...loadProfile(), themeMode: mode });
  }, []);

  // Follow the OS while the preference is "system".
  useEffect(() => {
    if (themeMode !== "system" || typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => setDark(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [themeMode]);

  // Expose the resolved scheme to CSS (and to the browser, via color-scheme).
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  // Back-compat shim: call sites that predate `setThemeMode` pass a boolean.
  const setDarkCompat = useCallback((value) => setThemeMode(value ? "dark" : "light"), [setThemeMode]);

  return { themeMode, dark, setThemeMode, setDark: setDarkCompat };
}

export { useThemeMode, resolveDark, prefersDark };
