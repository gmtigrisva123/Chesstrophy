import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ── User profile (local — see summary note: no real accounts/auth exist yet) ──
const PROFILE_KEY = "chessprophy_profile";
function defaultProfile() {
  return {
    username: "Player", displayName: "", bio: "", avatar: "♞",
    email: "", // set on Create Account; used only to match a returning Login on this device — see OnboardingFlow
    chesscomUsername: "", lichessUsername: "",
    joined: new Date().toISOString(),
    joinedEvents: {}, // eventId -> true — local RSVP, since there's no real accounts/attendee backend
    viewedContent: {}, // ChessFlix contentId -> true, so a refresh never double-counts a view
    dismissedOnboarding: false,
    // Onboarding — set by OnboardingFlow; local-only for now, backend-ready shape.
    chessLevel: "", improvementAreas: [], dailyTrainingTime: "",
    onboardingCompleted: false, isGuest: false,
    themeMode: "dark", // 'light' | 'dark' | 'system'
    settings: {
      notifications: { rewards: true, streakReminders: true, weeklyMissions: true },
      privacy: { publicProfile: false },
      language: "en",
    },
  };
}
function loadProfile() {
  const stored = readJson(PROFILE_KEY, () => null);
  if (stored) {
    const defaults = defaultProfile();
    return { ...defaults, ...stored, settings: { ...defaults.settings, ...(stored.settings || {}) } };
  }
  const fresh = defaultProfile();
  saveProfile(fresh);
  return fresh;
}
function saveProfile(p) { writeJson(PROFILE_KEY, p); }

function hasJoinedEvent(id) { return !!(loadProfile().joinedEvents || {})[id]; }
function joinEventLocal(id) {
  const p = loadProfile();
  if (p.joinedEvents?.[id]) return;
  saveProfile({ ...p, joinedEvents: { ...(p.joinedEvents || {}), [id]: true } });
}
function eventCountdown(ev) {
  if (!ev.datetime) return null;
  const diff = new Date(ev.datetime).getTime() - Date.now();
  if (diff <= 0) return "Started";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 1) return `In ${days} days`;
  if (days === 1) return "Tomorrow";
  if (hours >= 1) return `In ${hours}h`;
  return "Starting soon";
}

export {
  PROFILE_KEY,
  defaultProfile,
  loadProfile,
  saveProfile,
  hasJoinedEvent,
  joinEventLocal,
  eventCountdown,
};
