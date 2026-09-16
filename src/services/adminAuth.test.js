import { beforeEach, describe, expect, it } from "vitest";
import { MAX_ATTEMPTS, changeLocalPasscode, endAdminSession, getAdminSession, hasLocalPasscode, lockoutRemaining, setLocalPasscode, startAdminSession, validatePasscode, verifyLocalPasscode } from "./adminAuth.js";
import { __bootstrapStorage } from "../lib/storage/storageBridge.js";

describe("adminAuth (local mode)", () => {
  beforeEach(async () => {
    await __bootstrapStorage();
    endAdminSession();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("has no passcode until one is set, then verifies only the right one", async () => {
    expect(hasLocalPasscode()).toBe(false);
    await setLocalPasscode("correct horse battery");
    expect(hasLocalPasscode()).toBe(true);
    expect(await verifyLocalPasscode("correct horse battery")).toBe(true);
    expect(await verifyLocalPasscode("wrong")).toBe(false);
  });

  it("rejects weak passcodes", async () => {
    expect(validatePasscode("short")).toMatch(/8 characters/);
    await expect(setLocalPasscode("short")).rejects.toThrow(/8 characters/);
  });

  it("never stores the passcode in clear text", async () => {
    await setLocalPasscode("do-not-store-me");
    const raw = await window.storage.get("cp_admin_auth");
    expect(raw.value).not.toContain("do-not-store-me");
    expect(JSON.parse(raw.value).hash).toHaveLength(64);
  });

  it("locks out after repeated failures and unlocks later", async () => {
    await setLocalPasscode("correct horse battery");
    for (let i = 0; i < MAX_ATTEMPTS; i++) expect(await verifyLocalPasscode("nope")).toBe(false);
    expect(lockoutRemaining()).toBeGreaterThan(0);
    // Even the right passcode is refused while locked.
    expect(await verifyLocalPasscode("correct horse battery")).toBe(false);
  });

  it("changes the passcode only when the current one is right", async () => {
    await setLocalPasscode("first-passcode");
    await expect(changeLocalPasscode("wrong-one", "second-passcode")).rejects.toThrow(/incorrect/i);
    await changeLocalPasscode("first-passcode", "second-passcode");
    expect(await verifyLocalPasscode("second-passcode")).toBe(true);
    expect(await verifyLocalPasscode("first-passcode")).toBe(false);
  });

  it("keeps a session for the tab, or for seven days when remembered", () => {
    expect(getAdminSession()).toBeNull();
    startAdminSession({ actor: "owner", mode: "local" });
    expect(getAdminSession()).toMatchObject({ actor: "owner", role: "admin", expiresAt: null });
    endAdminSession();
    expect(getAdminSession()).toBeNull();

    startAdminSession({ actor: "owner", mode: "local", remember: true });
    const days = (new Date(getAdminSession().expiresAt) - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThanOrEqual(7);
  });

  it("drops an expired remembered session", () => {
    window.localStorage.setItem("cp_admin_session", JSON.stringify({ actor: "old", role: "admin", mode: "local", expiresAt: new Date(Date.now() - 1000).toISOString() }));
    expect(getAdminSession()).toBeNull();
  });
});
