// ── CATALOGUE REPOSITORY ──────────────────────────────────────────────────────
// Read access to the content everyone shares: openings, puzzles, classic games,
// courses and the wiki.
//
// Each function returns data in the shape the existing `src/data/` modules
// already export, so a feature can switch from the bundled constant to the
// database by changing one import. That mapping is the whole point of this
// layer — without it, every component would need to learn the SQL column
// names, and swapping back would be a rewrite.

import { getSupabaseClient } from "../client.js";
import { unwrap } from "../errors.js";

/** Default page size. The API also caps at 1000 rows (see supabase/config.toml). */
const PAGE_SIZE = 100;

/**
 * Reshapes an `openings` row (plus its variations) into the object
 * `src/data/openingRepertoire.js` exports.
 *
 * @param {Record<string, any>} row
 * @returns {Record<string, any>}
 */
function toOpening(row) {
  return {
    id: row.id,
    name: row.name,
    eco: row.eco,
    group: row.opening_group,
    color: row.accent_colour,
    style: row.style,
    difficulty: row.difficulty,
    rating: row.rating_band,
    popularity: row.popularity,
    studyTime: row.study_time,
    tags: row.tags ?? [],
    forSide: row.for_side === "white" ? "White" : "Black",
    history: row.history,
    overview: row.overview,
    // The editorial sections are stored as one document; spread them back out
    // so call sites keep reading `opening.mainIdeas` and friends.
    ...(row.editorial ?? {}),
    variations: (row.opening_variations ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        id: v.id,
        name: v.name,
        difficulty: v.difficulty,
        plans: v.plans,
        traps: v.traps ?? [],
        moves: (v.opening_variation_moves ?? [])
          .slice()
          .sort((a, b) => a.ply - b.ply)
          .map((m) => ({ san: m.san, explain: m.explanation })),
      })),
  };
}

/**
 * Loads the full opening repertoire with variations and moves.
 *
 * One round trip rather than 1 + N + N·M: PostgREST embeds the related rows
 * through the foreign keys.
 *
 * @returns {Promise<Record<string, any>[]>}
 */
async function fetchOpenings() {
  const supabase = await getSupabaseClient();
  const rows = unwrap(
    "load openings",
    await supabase
      .from("openings")
      .select(
        `*,
         opening_variations (
           *,
           opening_variation_moves ( ply, san, explanation )
         )`,
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
  );
  return (rows ?? []).map(toOpening);
}

/**
 * @param {string} id
 * @returns {Promise<Record<string, any> | null>}
 */
async function fetchOpening(id) {
  const supabase = await getSupabaseClient();
  const rows = unwrap(
    "load opening",
    await supabase
      .from("openings")
      .select(
        `*,
         opening_variations (
           *,
           opening_variation_moves ( ply, san, explanation )
         )`,
      )
      .eq("id", id)
      .limit(1),
  );
  return rows?.[0] ? toOpening(rows[0]) : null;
}

/**
 * @returns {Promise<Record<string, any>[]>} Puzzles in the shape of PUZZLE_DB.
 */
async function fetchPuzzles() {
  const supabase = await getSupabaseClient();
  const rows = unwrap(
    "load puzzles",
    await supabase
      .from("puzzles")
      .select("id, title, description, theme, rating, fen, solution, tags, is_daily")
      .eq("is_published", true)
      .order("rating", { ascending: true }),
  );
  return (rows ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    desc: p.description,
    theme: p.theme,
    rating: p.rating,
    fen: p.fen,
    solution: p.solution ?? [],
    tags: p.tags ?? [],
    isDaily: p.is_daily,
  }));
}

/**
 * @param {{page?: number, pageSize?: number, player?: string}} [options]
 * @returns {Promise<Record<string, any>[]>} Games in the shape of ALL_GAMES.
 */
async function fetchClassicGames({ page = 0, pageSize = PAGE_SIZE, player } = {}) {
  const supabase = await getSupabaseClient();
  let query = supabase
    .from("classic_games")
    .select("*")
    .eq("is_published", true)
    .order("played_year", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (player) {
    query = query.or(`white_player.ilike.%${player}%,black_player.ilike.%${player}%`);
  }

  const rows = unwrap("load classic games", await query);
  return (rows ?? []).map((g) => ({
    id: g.id,
    white: g.white_player,
    black: g.black_player,
    wr: g.white_rating,
    br: g.black_rating,
    event: g.event,
    year: g.played_year,
    result: g.result,
    opening: g.opening_name,
    eco: g.eco,
    desc: g.description,
    pgn: g.pgn,
  }));
}

/**
 * Loads every course grouped by category, in the shape of STUDIES_DATA.
 *
 * @returns {Promise<Record<string, any>[]>}
 */
async function fetchStudies() {
  const supabase = await getSupabaseClient();
  const rows = unwrap(
    "load studies",
    await supabase
      .from("study_categories")
      .select(
        `*,
         courses (
           *,
           course_chapters ( chapter_index, title, fen, body, note ),
           course_practice_questions ( question_index, prompt, options, answer_index, explanation )
         )`,
      )
      .order("sort_order", { ascending: true }),
  );

  return (rows ?? []).map((cat) => ({
    category: cat.label,
    icon: cat.icon,
    color: cat.accent_colour,
    items: (cat.courses ?? [])
      .filter((c) => c.is_published)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({
        id: c.id,
        title: c.title,
        desc: c.description,
        difficulty: c.difficulty,
        lessons: c.lesson_count,
        content: {
          chapters: (c.course_chapters ?? [])
            .slice()
            .sort((a, b) => a.chapter_index - b.chapter_index)
            .map((ch) => ({ title: ch.title, fen: ch.fen, body: ch.body ?? [], note: ch.note })),
          cheatSheet: c.cheat_sheet ?? {},
          practice: {
            quiz: (c.course_practice_questions ?? [])
              .slice()
              .sort((a, b) => a.question_index - b.question_index)
              .map((q) => ({
                q: q.prompt,
                options: q.options ?? [],
                answer: q.answer_index,
                explain: q.explanation,
              })),
          },
        },
      })),
  }));
}

/**
 * Full-text wiki search, executed in Postgres.
 *
 * The local-first build had to download every article and filter in the
 * browser; this is the same feature with the work in the right place.
 *
 * @param {string} query
 * @param {number} [limit]
 * @returns {Promise<Record<string, any>[]>}
 */
async function searchWiki(query, limit = 20) {
  const trimmed = query?.trim();
  if (!trimmed) return [];
  const supabase = await getSupabaseClient();
  return unwrap(
    "search wiki",
    await supabase.rpc("search_wiki", { query: trimmed, max_results: limit }),
  ) ?? [];
}

/**
 * @returns {Promise<{categories: Record<string, any>[], articles: Record<string, any>[]}>}
 */
async function fetchWiki() {
  const supabase = await getSupabaseClient();
  const [categories, articles] = await Promise.all([
    supabase.from("wiki_categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("wiki_articles").select("*").eq("status", "published"),
  ]);
  return {
    categories: unwrap("load wiki categories", categories) ?? [],
    articles: unwrap("load wiki articles", articles) ?? [],
  };
}

/**
 * The single site-settings row.
 * @returns {Promise<Record<string, any> | null>}
 */
async function fetchSiteSettings() {
  const supabase = await getSupabaseClient();
  const rows = unwrap(
    "load site settings",
    await supabase.from("site_settings").select("*").limit(1),
  );
  return rows?.[0] ?? null;
}

export {
  fetchOpenings,
  fetchOpening,
  fetchPuzzles,
  fetchClassicGames,
  fetchStudies,
  fetchWiki,
  searchWiki,
  fetchSiteSettings,
};
