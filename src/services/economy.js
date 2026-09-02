import { loadAdminData } from "./adminData.js";
import { ACHIEVEMENTS, WEEKLY_MISSION_TEMPLATE } from "../data/achievements.js";
import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── PROPHYCOINS ECONOMY ENGINE ─────────────────────────────────────────────────
// ProphyCoins are a virtual, non-cash reward currency. This engine simulates a
// server-validated transaction ledger on top of the same window.storage bridge
// used everywhere else in this file. Every reward is granted through
// grantReward(type, referenceId, ...) which is idempotent per (type, referenceId)
// pair — calling it twice for the same completed activity is a no-op the second
// time, which is what stops refresh-farming and double-claiming in this
// architecture. Coins are NEVER set directly by any UI component; every balance
// change goes through grantReward / spendCoins / adminAdjustBalance so there is
// always a matching transaction row. See the note at the bottom of this section
// for what a real backend would still need to add.
// ══════════════════════════════════════════════════════════════════════════════

const ECON_KEY = "chessprophy_economy";

function defaultEconomy() {
  return {
    coins: 0,
    xp: 0,
    lifetimeEarned: 0,
    totalSpent: 0,
    transactions: [],       // { id, date, amount, xp, reason, type, referenceId, balanceAfter }
    completedRewards: {},   // `${type}:${referenceId}` -> true  — idempotency ledger (anti-farm)
    unlockedItems: {},      // storeItemId -> true
    achievements: {},       // achievementId -> { unlockedAt }
    missions: { weekStart: null, progress: {}, claimed: false },
  };
}

function loadEconomy() {
  return { ...defaultEconomy(), ...readJson(ECON_KEY, () => ({})) };
}
function saveEconomy(e) { writeJson(ECON_KEY, e); }

// ── XP / Level curve — Level 1: 0 XP, Level 2: 500 XP, Level 3: 1,200 XP... ──
const LEVEL_THRESHOLDS = [0, 500, 1200, 2100, 3200, 4500, 6000, 7700, 9600, 11700, 14000];
function levelFromXP(xp) {
  let lvl = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) { if (xp >= LEVEL_THRESHOLDS[i]) lvl = i + 1; else break; }
  if (xp >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) {
    const extra = xp - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    lvl = LEVEL_THRESHOLDS.length + Math.floor(extra / 2500);
  }
  return lvl;
}
function levelBounds(level) {
  const idx = level - 1;
  const last = LEVEL_THRESHOLDS.length - 1;
  const min = idx <= last ? LEVEL_THRESHOLDS[idx] : LEVEL_THRESHOLDS[last] + (idx - last) * 2500;
  const max = level <= last ? LEVEL_THRESHOLDS[level] : LEVEL_THRESHOLDS[last] + (level - last) * 2500;
  return { min, max };
}

function newTxId() { return "tx" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// Reward amounts are admin-configurable (Admin → Economy → Rewards). Every
// grant call site looks up its amount here first, falling back to a sane
// default if the admin hasn't touched the config yet.
function rewardCfg(type, fallbackCoins, fallbackXp) {
  const cfg = (loadAdminData().economyConfig || {})[type];
  if (!cfg) return { coins: fallbackCoins, xp: fallbackXp, enabled: true };
  return { coins: cfg.coins, xp: cfg.xp, enabled: cfg.enabled !== false };
}

// Grant coins/XP for a genuinely completed activity. Idempotent per (type, referenceId) —
// e.g. ("course_complete","kp-vs-k") can only ever pay out once, no matter how many
// times the completion screen re-renders or the page is refreshed.
function grantReward(type, referenceId, { coins = 0, xp = 0, reason = "" } = {}) {
  const econ = loadEconomy();
  const key = `${type}:${referenceId}`;
  if (econ.completedRewards[key]) return null; // already claimed
  const prevLevel = levelFromXP(econ.xp);
  const newCoins = econ.coins + coins;
  const newXP = econ.xp + xp;
  const newLevel = levelFromXP(newXP);
  const tx = { id: newTxId(), date: new Date().toISOString(), amount: coins, xp, reason, type, referenceId, balanceAfter: newCoins };
  econ.coins = newCoins;
  econ.xp = newXP;
  econ.lifetimeEarned = (econ.lifetimeEarned || 0) + Math.max(0, coins);
  econ.transactions = [tx, ...(econ.transactions || [])].slice(0, 300);
  econ.completedRewards = { ...econ.completedRewards, [key]: true };
  saveEconomy(econ);
  const newAchievements = checkNewAchievements(econ);
  return { tx, leveledUp: newLevel > prevLevel, prevLevel, newLevel, coins, xp, newAchievements };
}
// Alias — grantReward already checks achievements internally; this name is used
// at call sites to make the intent explicit (reward + possible achievement unlock).
function grantRewardWithAchievements(type, referenceId, opts) { return grantReward(type, referenceId, opts); }

// Spend coins on a store item. Refuses if already owned or insufficient balance —
// the client never decides "yes" on its own; this function is the single gate.
function spendCoins(itemId, amount, reason = "") {
  const econ = loadEconomy();
  if (econ.unlockedItems[itemId]) return { ok: false, error: "already-owned" };
  if (amount > econ.coins) return { ok: false, error: "insufficient", need: amount - econ.coins };
  const newCoins = econ.coins - amount;
  const tx = { id: newTxId(), date: new Date().toISOString(), amount: -amount, xp: 0, reason, type: "store_purchase", referenceId: itemId, balanceAfter: newCoins };
  econ.coins = newCoins;
  econ.totalSpent = (econ.totalSpent || 0) + amount;
  econ.transactions = [tx, ...(econ.transactions || [])].slice(0, 300);
  econ.unlockedItems = { ...econ.unlockedItems, [itemId]: true };
  saveEconomy(econ);
  const newAchievements = checkNewAchievements(econ);
  return { ok: true, tx, newAchievements };
}

// Admin-only manual balance adjustment. Always creates an audit transaction and
// never allows the balance to go negative.
function adminAdjustBalance(amount, reason) {
  const econ = loadEconomy();
  const newCoins = Math.max(0, econ.coins + amount);
  const actualDelta = newCoins - econ.coins;
  const tx = { id: newTxId(), date: new Date().toISOString(), amount: actualDelta, xp: 0, reason: `Admin adjustment: ${reason || "no reason given"}`, type: "admin_adjustment", referenceId: "admin", balanceAfter: newCoins };
  econ.coins = newCoins;
  if (actualDelta > 0) econ.lifetimeEarned = (econ.lifetimeEarned || 0) + actualDelta;
  if (actualDelta < 0) econ.totalSpent = (econ.totalSpent || 0) + Math.abs(actualDelta);
  econ.transactions = [tx, ...(econ.transactions || [])].slice(0, 300);
  saveEconomy(econ);
  return tx;
}
function checkNewAchievements(econ) {
  const unlocked = econ.achievements || {};
  const newly = [];
  ACHIEVEMENTS.forEach(a => { if (!unlocked[a.id] && a.check(econ)) newly.push(a); });
  if (newly.length) {
    const next = { ...unlocked };
    newly.forEach(a => { next[a.id] = { unlockedAt: new Date().toISOString() }; });
    econ.achievements = next;
    saveEconomy(econ);
  }
  return newly;
}

// ── Weekly missions ───────────────────────────────────────────────────────────
function getWeekStart(d = new Date()) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}
function computeMissionProgress(weekStart) {
  const econ = loadEconomy();
  const weekStartDate = new Date(weekStart + "T00:00:00");
  const txs = (econ.transactions || []).filter(t => new Date(t.date) >= weekStartDate);
  const progress = {};
  WEEKLY_MISSION_TEMPLATE.tasks.forEach(task => { progress[task.key] = txs.filter(t => t.type === task.type).length; });
  return progress;
}
function getWeeklyMissionState() {
  const econ = loadEconomy();
  const weekStart = getWeekStart();
  const claimed = econ.missions?.weekStart === weekStart ? !!econ.missions.claimed : false;
  return { weekStart, progress: computeMissionProgress(weekStart), claimed };
}
function claimWeeklyMission() {
  const state = getWeeklyMissionState();
  const allDone = WEEKLY_MISSION_TEMPLATE.tasks.every(t => (state.progress[t.key] || 0) >= t.target);
  if (!allDone || state.claimed) return null;
  const econ = loadEconomy();
  econ.missions = { weekStart: state.weekStart, progress: state.progress, claimed: true };
  saveEconomy(econ);
  const cfg = rewardCfg("weekly_mission", WEEKLY_MISSION_TEMPLATE.rewardCoins, WEEKLY_MISSION_TEMPLATE.rewardXP);
  if (!cfg.enabled) return null;
  return grantReward("weekly_mission", state.weekStart, { coins: cfg.coins, xp: cfg.xp, reason: "Weekly mission complete" });
}

export {
  ECON_KEY,
  defaultEconomy,
  loadEconomy,
  saveEconomy,
  LEVEL_THRESHOLDS,
  levelFromXP,
  levelBounds,
  newTxId,
  rewardCfg,
  grantReward,
  grantRewardWithAchievements,
  spendCoins,
  adminAdjustBalance,
  checkNewAchievements,
  getWeekStart,
  computeMissionProgress,
  getWeeklyMissionState,
  claimWeeklyMission,
};
