import { beforeEach, describe, expect, it } from "vitest";
import { grantReward, levelBounds, levelFromXP, loadEconomy, spendCoins } from "./economy.js";
import { __bootstrapStorage } from "../lib/storage/storageBridge.js";

describe("economy", () => {
  beforeEach(async () => {
    await __bootstrapStorage();
  });

  describe("levelFromXP", () => {
    it.each([
      [0, 1],
      [499, 1],
      [500, 2],
      [1200, 3],
      [14000, 11],
      [16500, 12],
    ])("maps %i XP to level %i", (xp, level) => {
      expect(levelFromXP(xp)).toBe(level);
    });

    it("keeps levelBounds consistent with levelFromXP", () => {
      for (const xp of [0, 750, 3300, 14000, 20000]) {
        const level = levelFromXP(xp);
        const { min, max } = levelBounds(level);
        expect(xp).toBeGreaterThanOrEqual(min);
        expect(xp).toBeLessThan(max);
      }
    });
  });

  describe("grantReward", () => {
    it("credits coins and XP and records a transaction", () => {
      const result = grantReward("puzzle_solved", "p1", { coins: 5, xp: 15, reason: "Puzzle solved" });
      expect(result).not.toBeNull();

      const econ = loadEconomy();
      expect(econ.coins).toBe(5);
      expect(econ.xp).toBe(15);
      expect(econ.lifetimeEarned).toBe(5);
      expect(econ.transactions).toHaveLength(1);
      expect(econ.transactions[0]).toMatchObject({ amount: 5, xp: 15, balanceAfter: 5 });
    });

    // This is what stops refresh-farming: the completion screen may re-render
    // any number of times, but the payout happens once.
    it("is idempotent per (type, referenceId)", () => {
      grantReward("course_complete", "kp-vs-k", { coins: 100, xp: 250 });
      const second = grantReward("course_complete", "kp-vs-k", { coins: 100, xp: 250 });

      expect(second).toBeNull();
      expect(loadEconomy().coins).toBe(100);
      expect(loadEconomy().transactions).toHaveLength(1);
    });

    it("treats a different referenceId as a separate payout", () => {
      grantReward("puzzle_solved", "p1", { coins: 5, xp: 15 });
      grantReward("puzzle_solved", "p2", { coins: 5, xp: 15 });
      expect(loadEconomy().coins).toBe(10);
    });

    it("reports a level-up when the grant crosses a threshold", () => {
      const result = grantReward("weekly_mission", "w1", { coins: 0, xp: 600 });
      expect(result.leveledUp).toBe(true);
      expect(result.prevLevel).toBe(1);
      expect(result.newLevel).toBe(2);
    });
  });

  describe("spendCoins", () => {
    it("refuses a purchase the balance cannot cover", () => {
      const result = spendCoins("store1", 2000, "Advanced Calculation Mastery");
      expect(result).toEqual({ ok: false, error: "insufficient", need: 2000 });
      expect(loadEconomy().transactions).toHaveLength(0);
    });

    it("debits the balance and unlocks the item", () => {
      grantReward("weekly_mission", "w1", { coins: 200, xp: 0 });
      const result = spendCoins("store2", 150, "100 Tactical Positions");

      expect(result.ok).toBe(true);
      const econ = loadEconomy();
      expect(econ.coins).toBe(50);
      expect(econ.totalSpent).toBe(150);
      expect(econ.unlockedItems.store2).toBe(true);
    });

    it("refuses to charge twice for the same item", () => {
      grantReward("weekly_mission", "w1", { coins: 500, xp: 0 });
      spendCoins("store2", 150);
      const second = spendCoins("store2", 150);

      expect(second).toEqual({ ok: false, error: "already-owned" });
      expect(loadEconomy().coins).toBe(350);
    });
  });
});
