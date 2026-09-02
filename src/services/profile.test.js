import { beforeEach, describe, expect, it } from "vitest";
import { defaultProfile, eventCountdown, hasJoinedEvent, joinEventLocal, loadProfile, saveProfile } from "./profile.js";
import { __bootstrapStorage } from "../lib/storage/storageBridge.js";

describe("profile", () => {
  beforeEach(async () => {
    await __bootstrapStorage();
  });

  it("creates and persists a default profile on first load", () => {
    const profile = loadProfile();
    expect(profile.username).toBe("Player");
    expect(profile.onboardingCompleted).toBe(false);
    // The default is written through, so a second load returns the same record.
    expect(loadProfile().joined).toBe(profile.joined);
  });

  it("round-trips saved fields", () => {
    saveProfile({ ...loadProfile(), displayName: "Hikaru", chessLevel: "Advanced" });
    expect(loadProfile()).toMatchObject({ displayName: "Hikaru", chessLevel: "Advanced" });
  });

  // A stored profile written before a field existed must still pick up the new
  // default rather than coming back undefined.
  it("back-fills fields added after a profile was stored", () => {
    saveProfile({ username: "Legacy" });
    const profile = loadProfile();
    expect(profile.username).toBe("Legacy");
    expect(profile.themeMode).toBe(defaultProfile().themeMode);
    expect(profile.settings.notifications.rewards).toBe(true);
  });

  it("merges nested settings rather than replacing them wholesale", () => {
    saveProfile({ ...loadProfile(), settings: { language: "vi" } });
    const { settings } = loadProfile();
    expect(settings.language).toBe("vi");
    expect(settings.notifications.rewards).toBe(true);
  });

  describe("event RSVPs", () => {
    it("records a join exactly once", () => {
      expect(hasJoinedEvent("e1")).toBe(false);
      joinEventLocal("e1");
      joinEventLocal("e1");
      expect(hasJoinedEvent("e1")).toBe(true);
      expect(Object.keys(loadProfile().joinedEvents)).toEqual(["e1"]);
    });
  });

  describe("eventCountdown", () => {
    const hours = (n) => new Date(Date.now() + n * 3600_000).toISOString();

    it("returns null when the event has no date", () => {
      expect(eventCountdown({})).toBeNull();
    });

    it.each([
      ["Started", -1],
      ["Starting soon", 0.5],
      ["In 3h", 3.2],
      ["Tomorrow", 30],
      ["In 3 days", 24 * 3 + 1],
    ])("renders %s", (expected, offsetHours) => {
      expect(eventCountdown({ datetime: hours(offsetHours) })).toBe(expected);
    });
  });
});
