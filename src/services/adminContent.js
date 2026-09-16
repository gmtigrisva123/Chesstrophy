import { logAdminAction } from "./adminAudit.js";
import { defaultAdminData, loadAdminData, saveAdminData } from "./adminData.js";
import { loadEconomy } from "./economy.js";
import { loadProfile } from "./profile.js";
import { loadPzState } from "./puzzleProgress.js";
import { PUZZLE_DB } from "../data/puzzles.js";
import { createChess } from "../lib/chess/engine.js";
import { parseSquarePairMove } from "../lib/chess/fen.js";
import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── ADMIN CONTENT OPERATIONS ──────────────────────────────────────────────────
// The admin panel never touches `saveAdminData` directly. Every write goes
// through `updateAdminData`, which applies the change, persists it (which
// also notifies every open page), and records an audit entry — so there is
// exactly one path by which content changes, and it is always logged.
// ══════════════════════════════════════════════════════════════════════════════

const COMMUNITY_GAMES_KEY = "chessprophy_community_games";
const BACKUP_VERSION = 1;

/**
 * @param {(data: object) => object} mutate - returns the next admin data
 * @param {{action: string, target?: string, summary: string, meta?: object}} audit
 */
function updateAdminData(mutate, audit) {
  const next = mutate(loadAdminData());
  saveAdminData(next);
  if (audit) logAdminAction(audit);
  return next;
}

function newRecordId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Insert or replace one record (matched by id) in a list collection. */
function upsertRecord(collection, record, { label } = {}) {
  const exists = (loadAdminData()[collection] || []).some(r => r.id === record.id);
  return updateAdminData(
    data => {
      const list = data[collection] || [];
      const nextList = exists ? list.map(r => (r.id === record.id ? record : r)) : [...list, record];
      return { ...data, [collection]: nextList };
    },
    { action: `${collection}.${exists ? "update" : "create"}`, target: `${collection}:${record.id}`, summary: `${exists ? "Updated" : "Created"} ${label || collection} “${record.title || record.name || record.label || record.id}”` },
  );
}

function deleteRecord(collection, id, { label } = {}) {
  const record = (loadAdminData()[collection] || []).find(r => r.id === id);
  if (!record) return null;
  updateAdminData(
    data => ({ ...data, [collection]: (data[collection] || []).filter(r => r.id !== id) }),
    { action: `${collection}.delete`, target: `${collection}:${id}`, summary: `Deleted ${label || collection} “${record.title || record.name || record.label || id}”` },
  );
  return record; // handed back so the caller can offer Undo
}

function patchRecord(collection, id, patch, { label, summary } = {}) {
  return updateAdminData(
    data => ({ ...data, [collection]: (data[collection] || []).map(r => (r.id === id ? { ...r, ...patch } : r)) }),
    { action: `${collection}.patch`, target: `${collection}:${id}`, summary: summary || `Changed ${label || collection} ${id}: ${Object.keys(patch).join(", ")}`, meta: patch },
  );
}

function updateSection(section, patch, summary) {
  return updateAdminData(
    data => ({ ...data, [section]: { ...(data[section] || {}), ...patch } }),
    { action: `${section}.update`, target: section, summary: summary || `Updated ${section}: ${Object.keys(patch).join(", ")}` },
  );
}

// ── Community games (a separate key, written by the public page) ─────────────
function loadCommunityGames() { return readJson(COMMUNITY_GAMES_KEY, () => []); }
function deleteCommunityGame(id) {
  const games = loadCommunityGames();
  const game = games.find(g => g.id === id);
  if (!game) return null;
  writeJson(COMMUNITY_GAMES_KEY, games.filter(g => g.id !== id));
  logAdminAction({ action: "communityGames.delete", target: `communityGames:${id}`, summary: `Removed community game by ${game.player}` });
  return game;
}

// ── Backup / restore ──────────────────────────────────────────────────────────
function exportAdminBackup() {
  return JSON.stringify({ version: BACKUP_VERSION, app: "chessprophy", exportedAt: new Date().toISOString(), adminData: loadAdminData() }, null, 2);
}

/**
 * Restores a backup produced by exportAdminBackup. Unknown top-level keys are
 * dropped and missing ones filled from defaults, so a backup from an older
 * build cannot leave the store missing a section a page expects.
 */
function importAdminBackup(json) {
  let parsed;
  try { parsed = JSON.parse(json); } catch { throw new Error("That file is not valid JSON."); }
  const incoming = parsed?.adminData && typeof parsed.adminData === "object" ? parsed.adminData : parsed;
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) throw new Error("That file does not look like a ChessProphy backup.");
  const defaults = defaultAdminData();
  const known = Object.keys(defaults);
  const present = known.filter(k => k in incoming);
  if (present.length === 0) throw new Error("That file does not contain any ChessProphy content sections.");
  const merged = { ...defaults };
  present.forEach(k => { merged[k] = incoming[k]; });
  saveAdminData(merged);
  logAdminAction({ action: "backup.import", summary: `Restored backup (${present.length} sections${parsed?.exportedAt ? `, exported ${new Date(parsed.exportedAt).toLocaleString()}` : ""})` });
  return present;
}

function resetAdminDataToDefaults() {
  saveAdminData(defaultAdminData());
  logAdminAction({ action: "content.reset", summary: "Reset all site content to defaults" });
}

// ── Overview numbers ──────────────────────────────────────────────────────────
function contentStats() {
  const d = loadAdminData();
  const flix = d.chessflixContent || [];
  const econ = loadEconomy();
  const pz = loadPzState();
  const profile = loadProfile();
  return {
    news: { total: (d.news || []).length, published: (d.news || []).filter(n => n.published).length },
    events: { total: (d.events || []).length, upcoming: (d.events || []).filter(e => !e.datetime || new Date(e.datetime) >= new Date()).length },
    announcements: { total: (d.announcements || []).length, active: (d.announcements || []).filter(a => a.active).length },
    puzzles: { builtIn: PUZZLE_DB.length, custom: (d.puzzlesAdmin || []).length },
    storeItems: { total: (d.storeItems || []).length, live: (d.storeItems || []).filter(s => s.published && !s.archived).length },
    wiki: { articles: (d.wikiArticles || []).length, published: (d.wikiArticles || []).filter(a => a.published).length, categories: (d.wikiCategories || []).length },
    studies: { total: (d.studies || []).length, courses: (d.courses || []).length },
    chessflix: { total: flix.length, pending: flix.filter(c => c.status === "pending").length, published: flix.filter(c => c.status === "published").length },
    communityGames: loadCommunityGames().length,
    learner: { username: profile.username, coins: econ.coins, xp: econ.xp, puzzlesSolved: (pz.solved || []).length, transactions: (econ.transactions || []).length },
    maintenance: !!d.settings?.maintenanceMode,
  };
}

// ── Validation helpers used by the editors ────────────────────────────────────
function validateFen(fen) {
  if (!fen || typeof fen !== "string") return "A FEN is required.";
  const parts = fen.trim().split(/\s+/);
  const rows = parts[0]?.split("/") || [];
  if (rows.length !== 8) return "The board part of the FEN must have 8 ranks separated by “/”.";
  for (const row of rows) {
    let n = 0;
    for (const ch of row) {
      if (/[1-8]/.test(ch)) n += Number(ch);
      else if (/[prnbqkPRNBQK]/.test(ch)) n += 1;
      else return `Unexpected character “${ch}” in the FEN.`;
    }
    if (n !== 8) return "Every rank must add up to 8 squares.";
  }
  if (parts[1] && !/^[wb]$/.test(parts[1])) return "Side to move must be “w” or “b”.";
  const board = rows.join("");
  if (!board.includes("K") || !board.includes("k")) return "Both kings must be on the board.";
  return "";
}

/**
 * Plays a puzzle's solution through the engine. Returns "" when every ply is
 * legal from the starting FEN, otherwise the first problem found.
 */
function validatePuzzleSolution(fen, solution) {
  const fenProblem = validateFen(fen);
  if (fenProblem) return fenProblem;
  const tokens = Array.isArray(solution) ? solution : String(solution || "").trim().split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) return "A solution needs at least one move (e.g. e2e4).";
  const chess = createChess(fen.trim());
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(tok)) return `Move ${i + 1} “${tok}” must look like e2e4 or e7e8q.`;
    const { from, to, promo } = parseSquarePairMove(tok.toLowerCase());
    if (!chess.legalMoves(from).some(m => m.to === to)) return `Move ${i + 1} “${tok}” is not legal in that position (${chess.getTurn() === "w" ? "White" : "Black"} to move).`;
    chess.move(from, to, promo);
  }
  return "";
}

export {
  COMMUNITY_GAMES_KEY,
  updateAdminData,
  newRecordId,
  upsertRecord,
  deleteRecord,
  patchRecord,
  updateSection,
  loadCommunityGames,
  deleteCommunityGame,
  exportAdminBackup,
  importAdminBackup,
  resetAdminDataToDefaults,
  contentStats,
  validateFen,
  validatePuzzleSolution,
};
