#!/usr/bin/env node
/**
 * Generates `supabase/seed.sql` from the application's own content modules.
 *
 * The alternative — hand-writing INSERT statements — guarantees drift: someone
 * adds an opening to `src/data/openingRepertoire.js`, nobody remembers the
 * seed, and local databases quietly stop matching the app. Deriving the seed
 * from the same modules the client imports makes that impossible.
 *
 *   npm run db:seed:generate      # rewrite supabase/seed.sql
 *   npm run db:seed:check         # fail if it is out of date (CI)
 *
 * The generated file is committed so that `supabase db reset` works without a
 * Node toolchain, and so a reviewer can see what actually goes into the
 * database in a pull request diff.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "supabase", "seed.sql");
const checkOnly = process.argv.includes("--check");

// Several data modules are imported by services that expect the artifact
// host's storage API. Stub it before importing anything.
globalThis.window ??= {};
globalThis.window.storage ??= { get: async () => null, set: async () => {} };

// ── SQL literal helpers ─────────────────────────────────────────────────────
// Everything here goes through one of these. No template literal ever
// interpolates raw content into SQL.

/** @param {unknown} value */
function sqlText(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** @param {unknown} value */
function sqlNumber(value) {
  if (value === null || value === undefined || value === "") return "null";
  const n = Number(value);
  if (!Number.isFinite(n)) return "null";
  return String(n);
}

/** @param {unknown} value */
function sqlBool(value) {
  return value ? "true" : "false";
}

/**
 * Postgres text[] literal. Uses the ARRAY[...] constructor rather than the
 * '{...}' form, so embedded quotes, commas and braces need no second layer of
 * escaping.
 *
 * @param {unknown[]} values
 */
function sqlTextArray(values) {
  const items = (Array.isArray(values) ? values : []).filter((v) => v !== null && v !== undefined);
  if (items.length === 0) return "'{}'::text[]";
  return `array[${items.map((v) => sqlText(String(v))).join(", ")}]::text[]`;
}

/** @param {unknown} value */
function sqlJson(value) {
  return `${sqlText(JSON.stringify(value ?? {}))}::jsonb`;
}

/** Slugifies a human label into the id charset the schema's CHECK allows. */
function slug(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Emits one INSERT ... ON CONFLICT block. */
function insertBlock(table, columns, rows, { conflictTarget, updateColumns } = {}) {
  if (rows.length === 0) return `-- ${table}: no rows\n\n`;

  const conflict = conflictTarget ?? `(${columns[0]})`;
  const updates = (updateColumns ?? columns.slice(1)).map((c) => `  ${c} = excluded.${c}`).join(",\n");
  const values = rows.map((r) => `  (${r.join(", ")})`).join(",\n");

  return [
    `insert into public.${table} (${columns.join(", ")}) values`,
    values,
    `on conflict ${conflict} do update set`,
    updates,
    `;`,
    ``,
    ``,
  ].join("\n");
}

/** Emits an INSERT that ignores rows that already exist (no updatable columns). */
function insertIgnoreBlock(table, columns, rows) {
  if (rows.length === 0) return `-- ${table}: no rows\n\n`;
  const values = rows.map((r) => `  (${r.join(", ")})`).join(",\n");
  return `insert into public.${table} (${columns.join(", ")}) values\n${values}\non conflict do nothing;\n\n`;
}

function section(title) {
  const rule = "-".repeat(74);
  return `\n-- ${rule}\n-- ${title}\n-- ${rule}\n\n`;
}

/**
 * Emits a timestamp that is stable across runs.
 *
 * Some demo content in `defaultAdminData()` is defined relative to
 * `Date.now()` — the sample event starts "next week". Writing that out as an
 * absolute instant makes the generated file differ on every run, which breaks
 * `db:seed:check` and fills pull requests with meaningless diffs.
 *
 * A future timestamp is therefore emitted as a whole-day offset from `now()`,
 * evaluated by Postgres at load time. The text is identical every run, and the
 * demo event stays in the future instead of going stale.
 *
 * The offset is measured in whole calendar days, both ends floored to local
 * midnight. Comparing the raw instants would let a midnight-aligned source
 * date (`new Date().toDateString()`) round to a different day depending on the
 * time of day the generator runs, so `db:seed:check` would flip red at noon
 * with nobody having touched the content.
 *
 * @param {string | undefined} isoDate
 * @param {string} fallback - SQL emitted when there is no usable date.
 */
function sqlTimestamp(isoDate, fallback = "null") {
  if (!isoDate || Number.isNaN(Date.parse(isoDate))) return fallback;

  const target = new Date(isoDate);
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const offsetDays = Math.round((startOfDay(target) - startOfDay(new Date())) / 86_400_000);

  if (offsetDays > 0) return `now() + interval '${offsetDays} days'`;
  if (offsetDays < 0 && offsetDays > -370) return `now() - interval '${Math.abs(offsetDays)} days'`;

  // Genuinely fixed historical dates are emitted as written.
  return offsetDays === 0 ? "now()" : sqlText(target.toISOString());
}

/**
 * Deterministic uuid derived from content, so re-running the generator does
 * not produce a different id for the same row.
 */
function stableUuid(...parts) {
  const hex = createHash("sha256").update(parts.join(" ")).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

// ── Load the application's content ──────────────────────────────────────────

const { OPENING_REPERTOIRE } = await import("../src/data/openingRepertoire.js");
const { PUZZLE_DB } = await import("../src/data/puzzles.js");
const { ALL_GAMES } = await import("../src/data/classicGames.js");
const { STUDIES_DATA } = await import("../src/data/studies.js");
const { DQ_BANK, QUIZ_BANK } = await import("../src/data/dailyQuestions.js");
const { PLACEMENT_QUESTIONS } = await import("../src/data/coachInsights.js");
const { TREE_DATA } = await import("../src/data/learningTree.js");
const { ACHIEVEMENTS } = await import("../src/data/achievements.js");
const { defaultAdminData } = await import("../src/services/adminData.js");

const admin = defaultAdminData();
const chunks = [];

chunks.push(`-- =========================================================================
-- ChessProphy - seed data
-- =========================================================================
--
--   GENERATED FILE - DO NOT EDIT BY HAND.
--
--   Source:     src/data/*.js and src/services/adminData.js
--   Generator:  scripts/generate-supabase-seed.mjs
--   Regenerate: npm run db:seed:generate
--   CI asserts this file matches its sources (npm run db:seed:check).
--
-- Every statement is idempotent, so this can be re-run against a database that
-- already holds it. Applied automatically by \`supabase db reset\`.
--
-- Content ids are the application's own stable identifiers, so a re-seed
-- updates rows in place rather than duplicating them. Learner data is never
-- touched by this file.
-- =========================================================================

begin;
`);

// ── Openings ────────────────────────────────────────────────────────────────

const EDITORIAL_KEYS = [
  "mainIdeas",
  "strategicConcepts",
  "tacticalThemes",
  "typicalPlans",
  "pieceDevelopment",
  "pawnStructures",
  "importantSquares",
  "typicalSacrifices",
  "commonMistakes",
  "moveOrderTricks",
  "transpositions",
  "commonTraps",
  "opponentResponses",
  "famousPlayers",
  "modelGames",
];

chunks.push(section("Openings"));
chunks.push(
  insertBlock(
    "openings",
    [
      "id",
      "name",
      "eco",
      "opening_group",
      "for_side",
      "style",
      "difficulty",
      "rating_band",
      "popularity",
      "study_time",
      "accent_colour",
      "tags",
      "history",
      "overview",
      "editorial",
      "sort_order",
      "is_published",
    ],
    OPENING_REPERTOIRE.map((op, i) => [
      sqlText(op.id),
      sqlText(op.name),
      sqlText(op.eco),
      sqlText(op.group),
      sqlText(String(op.forSide).toLowerCase()),
      sqlText(op.style),
      sqlText(op.difficulty),
      sqlText(op.rating),
      sqlNumber(op.popularity),
      sqlText(op.studyTime),
      sqlText(op.color ?? "#C9A84C"),
      sqlTextArray(op.tags),
      sqlText(op.history),
      sqlText(op.overview),
      sqlJson(Object.fromEntries(EDITORIAL_KEYS.filter((k) => op[k] !== undefined).map((k) => [k, op[k]]))),
      sqlNumber(i),
      sqlBool(true),
    ]),
  ),
);

const variations = OPENING_REPERTOIRE.flatMap((op) =>
  op.variations.map((v, i) => ({ ...v, openingId: op.id, order: i })),
);

chunks.push(
  insertBlock(
    "opening_variations",
    ["id", "opening_id", "name", "difficulty", "plans", "traps", "sort_order"],
    variations.map((v) => [
      sqlText(v.id),
      sqlText(v.openingId),
      sqlText(v.name),
      sqlText(v.difficulty),
      sqlText(v.plans),
      sqlTextArray(v.traps),
      sqlNumber(v.order),
    ]),
  ),
);

chunks.push(
  insertBlock(
    "opening_variation_moves",
    ["variation_id", "ply", "san", "explanation"],
    variations.flatMap((v) =>
      (v.moves ?? []).map((m, ply) => [sqlText(v.id), sqlNumber(ply), sqlText(m.san), sqlText(m.explain)]),
    ),
    { conflictTarget: "(variation_id, ply)", updateColumns: ["san", "explanation"] },
  ),
);

// ── Puzzles ─────────────────────────────────────────────────────────────────

chunks.push(section("Puzzles"));
chunks.push(
  insertBlock(
    "puzzles",
    ["id", "title", "description", "theme", "rating", "fen", "solution", "tags", "is_daily", "is_published"],
    PUZZLE_DB.map((p) => [
      sqlText(p.id),
      sqlText(p.title),
      sqlText(p.desc),
      sqlText(p.theme),
      sqlNumber(p.rating),
      sqlText(p.fen),
      sqlTextArray(p.solution),
      sqlTextArray(p.tags),
      sqlBool(p.id === "potd"),
      sqlBool(true),
    ]),
  ),
);

// ── Classic games ───────────────────────────────────────────────────────────

chunks.push(section("Classic games"));
chunks.push(
  insertBlock(
    "classic_games",
    [
      "id",
      "white_player",
      "black_player",
      "white_rating",
      "black_rating",
      "event",
      "played_year",
      "result",
      "opening_name",
      "eco",
      "description",
      "pgn",
      "is_published",
    ],
    ALL_GAMES.map((g) => [
      sqlNumber(g.id),
      sqlText(g.white),
      sqlText(g.black),
      sqlNumber(g.wr),
      sqlNumber(g.br),
      sqlText(g.event),
      sqlNumber(g.year),
      sqlText(g.result || "*"),
      sqlText(g.opening),
      sqlText(g.eco),
      sqlText(g.desc),
      sqlText(g.pgn),
      sqlBool(true),
    ]),
  ),
);

// ── Studies and courses ─────────────────────────────────────────────────────

chunks.push(section("Study categories and courses"));

const categories = STUDIES_DATA.map((c, i) => ({
  id: slug(c.category),
  label: c.category,
  icon: c.icon,
  colour: c.color,
  order: i,
}));

chunks.push(
  insertBlock(
    "study_categories",
    ["id", "label", "icon", "accent_colour", "sort_order"],
    categories.map((c) => [
      sqlText(c.id),
      sqlText(c.label),
      sqlText(c.icon),
      sqlText(c.colour ?? "#C9A84C"),
      sqlNumber(c.order),
    ]),
  ),
);

const courses = STUDIES_DATA.flatMap((c, ci) =>
  c.items.map((item, ii) => ({ ...item, categoryId: slug(c.category), order: ci * 100 + ii })),
);

chunks.push(
  insertBlock(
    "courses",
    [
      "id",
      "category_id",
      "title",
      "description",
      "difficulty",
      "lesson_count",
      "cheat_sheet",
      "sort_order",
      "is_published",
    ],
    courses.map((c) => [
      sqlText(c.id),
      sqlText(c.categoryId),
      sqlText(c.title),
      sqlText(c.desc),
      sqlText(c.difficulty),
      sqlNumber(c.lessons ?? 0),
      // The Cheat Sheet tab is an object of named lists; stored as one JSON
      // document because it is rendered as a unit and never queried.
      sqlJson(c.content?.cheatSheet ?? {}),
      sqlNumber(c.order),
      sqlBool(true),
    ]),
  ),
);

chunks.push(
  insertBlock(
    "course_chapters",
    ["course_id", "chapter_index", "title", "fen", "body", "note"],
    courses.flatMap((c) =>
      (c.content?.chapters ?? []).map((ch, i) => [
        sqlText(c.id),
        sqlNumber(i),
        sqlText(ch.title),
        sqlText(ch.fen),
        sqlTextArray(ch.body),
        sqlText(ch.note),
      ]),
    ),
    { conflictTarget: "(course_id, chapter_index)", updateColumns: ["title", "fen", "body", "note"] },
  ),
);

chunks.push(
  insertBlock(
    "course_practice_questions",
    ["course_id", "question_index", "prompt", "options", "answer_index", "explanation"],
    courses.flatMap((c) =>
      (c.content?.practice?.quiz ?? []).map((q, i) => [
        sqlText(c.id),
        sqlNumber(i),
        sqlText(q.q),
        sqlTextArray(q.options),
        sqlNumber(q.answer ?? 0),
        sqlText(q.explain),
      ]),
    ),
    {
      conflictTarget: "(course_id, question_index)",
      updateColumns: ["prompt", "options", "answer_index", "explanation"],
    },
  ),
);

// ── Question banks ──────────────────────────────────────────────────────────

chunks.push(section("Question banks"));

chunks.push(
  insertBlock(
    "daily_questions",
    [
      "id",
      "rating_group",
      "topic",
      "question_type",
      "prompt",
      "options",
      "answer_index",
      "explanation",
      "learning_note",
      "difficulty",
      "strength_needed",
      "fen",
      "is_published",
    ],
    Object.entries(DQ_BANK).flatMap(([band, questions]) =>
      questions.map((q) => [
        sqlText(q.id),
        sqlText(band),
        sqlText(q.topic),
        sqlText(q.type),
        sqlText(q.q),
        sqlTextArray(q.options),
        sqlNumber(q.answer),
        sqlText(q.explain),
        sqlText(q.learning),
        sqlText(q.difficulty),
        sqlText(q.strengthNeeded),
        sqlText(q.fen),
        sqlBool(true),
      ]),
    ),
  ),
);

chunks.push(
  insertBlock(
    "quiz_questions",
    ["id", "category", "prompt", "options", "answer_index", "explanation", "is_published"],
    Object.entries(QUIZ_BANK).flatMap(([category, questions]) =>
      questions.map((q) => [
        sqlText(stableUuid("quiz", category, q.q)),
        sqlText(category),
        sqlText(q.q),
        sqlTextArray(q.options),
        sqlNumber(q.answer),
        sqlText(q.explain),
        sqlBool(true),
      ]),
    ),
  ),
);

chunks.push(
  insertBlock(
    "placement_questions",
    ["id", "question_type", "label", "prompt", "options", "answer_index", "explanation", "sort_order"],
    PLACEMENT_QUESTIONS.map((q, i) => [
      sqlText(q.id ?? `placement-${i + 1}`),
      sqlText(q.type),
      sqlText(q.label),
      sqlText(q.question),
      sqlTextArray(q.options),
      sqlNumber(q.correct),
      sqlText(q.explanation),
      sqlNumber(i),
    ]),
  ),
);

// ── Skill tree ──────────────────────────────────────────────────────────────

chunks.push(section("Skill tree"));

const treeNodes = [];
const treeEdges = [];
(function walk(node, parentId, depth, index) {
  treeNodes.push({
    id: node.id,
    parentId,
    label: node.label,
    icon: node.icon,
    colour: node.color,
    description: node.desc,
    xp: node.xpReward ?? 0,
    order: depth * 100 + index,
  });
  for (const requirement of node.requires ?? []) {
    if (requirement !== node.id) treeEdges.push({ node: node.id, requires: requirement });
  }
  (node.children ?? []).forEach((child, i) => walk(child, node.id, depth + 1, i));
})(TREE_DATA, null, 0, 0);

// Parents are emitted before children because the walk is depth-first from the
// root, which satisfies the self-referencing foreign key on insert.
chunks.push(
  insertBlock(
    "skill_tree_nodes",
    ["id", "parent_id", "label", "icon", "accent_colour", "description", "xp_reward", "sort_order"],
    treeNodes.map((n) => [
      sqlText(n.id),
      sqlText(n.parentId),
      sqlText(n.label),
      sqlText(n.icon),
      sqlText(n.colour),
      sqlText(n.description),
      sqlNumber(n.xp),
      sqlNumber(n.order),
    ]),
  ),
);

chunks.push(
  insertIgnoreBlock(
    "skill_tree_prerequisites",
    ["node_id", "requires_node_id"],
    treeEdges.map((e) => [sqlText(e.node), sqlText(e.requires)]),
  ),
);

// ── Economy configuration ───────────────────────────────────────────────────

chunks.push(section("Economy: reward rules, achievements, store"));

chunks.push(
  insertBlock(
    "reward_rules",
    ["reward_type", "label", "coins", "xp", "is_enabled"],
    Object.entries(admin.economyConfig).map(([type, cfg]) => [
      sqlText(type),
      sqlText(cfg.label),
      sqlNumber(cfg.coins),
      sqlNumber(cfg.xp),
      sqlBool(cfg.enabled !== false),
    ]),
  ),
);

// Additional reward types the client grants but the CMS config does not list.
chunks.push(
  insertBlock(
    "reward_rules",
    ["reward_type", "label", "coins", "xp", "is_enabled"],
    [
      [
        sqlText("streak_milestone"),
        sqlText("Streak milestone reached"),
        sqlNumber(75),
        sqlNumber(150),
        sqlBool(true),
      ],
      [sqlText("store_purchase"), sqlText("Store purchase"), sqlNumber(0), sqlNumber(0), sqlBool(true)],
    ],
  ),
);

// The client evaluates achievements with a JavaScript predicate. Those cannot
// cross into SQL, so each is restated as a declarative rule that
// check_achievements() understands. Keep this map in step with
// src/data/achievements.js.
const ACHIEVEMENT_CRITERIA = {
  first_course: { kind: "transaction_count", type: "course_complete", target: 1 },
  first_test_80: { kind: "transaction_count", type: "course_test_bonus", target: 1 },
  // The client predicate also matches referenceId === "streak:7"; `reference`
  // carries that through so the server evaluates the same condition.
  streak_7: { kind: "transaction_count", type: "streak_milestone", reference: "streak:7", target: 1 },
  coins_1000: { kind: "lifetime_earned", target: 1000 },
  first_purchase: { kind: "unlock_count", target: 1 },
  five_courses: { kind: "transaction_count", type: "course_complete", target: 5 },
};

const unmappedAchievements = ACHIEVEMENTS.filter((a) => !ACHIEVEMENT_CRITERIA[a.id]);
if (unmappedAchievements.length > 0) {
  console.error(
    "✗ Achievements with no server-side criteria:\n" +
      unmappedAchievements.map((a) => `    ${a.id} (${a.label})`).join("\n") +
      "\n  Add a rule to ACHIEVEMENT_CRITERIA in this script, and support its\n" +
      "  `kind` in check_achievements() (supabase/migrations/*_economy.sql).",
  );
  process.exit(1);
}

chunks.push(
  insertBlock(
    "achievements",
    ["id", "label", "description", "icon", "criteria", "sort_order"],
    ACHIEVEMENTS.map((a, i) => [
      sqlText(a.id),
      sqlText(a.label),
      sqlText(a.desc),
      sqlText(a.icon),
      sqlJson(ACHIEVEMENT_CRITERIA[a.id]),
      sqlNumber(i),
    ]),
  ),
);

chunks.push(
  insertBlock(
    "store_items",
    [
      "id",
      "title",
      "description",
      "icon",
      "difficulty",
      "target_rating",
      "price_coins",
      "price_real",
      "sort_order",
      "is_published",
    ],
    (admin.storeItems ?? [])
      .filter((s) => !s.archived)
      .map((s, i) => [
        sqlText(s.id),
        sqlText(s.title),
        sqlText(s.desc),
        sqlText(s.icon),
        sqlText(s.difficulty),
        sqlText(s.targetRating),
        sqlNumber(s.priceCoins),
        sqlNumber(s.priceReal),
        sqlNumber(i),
        sqlBool(s.published !== false),
      ]),
  ),
);

// ── ChessWiki ───────────────────────────────────────────────────────────────

chunks.push(section("ChessWiki"));

chunks.push(
  insertBlock(
    "wiki_categories",
    ["id", "label", "icon", "description", "sort_order"],
    (admin.wikiCategories ?? []).map((c, i) => [
      sqlText(c.id),
      sqlText(c.label),
      sqlText(c.icon),
      sqlText(c.desc),
      sqlNumber(i),
    ]),
  ),
);

const wikiCategoryIds = new Set((admin.wikiCategories ?? []).map((c) => c.id));
const wikiArticles = (admin.wikiArticles ?? []).filter((a) => wikiCategoryIds.has(a.categoryId));

chunks.push(
  insertBlock(
    "wiki_articles",
    [
      "id",
      "category_id",
      "title",
      "short_description",
      "content",
      "fen",
      "move_sequence",
      "image_url",
      "tags",
      "is_featured",
      "show_puzzles_cta",
      "show_opening_tool_cta",
      "puzzle_theme_hint",
      "status",
    ],
    wikiArticles.map((a) => [
      sqlText(a.id),
      sqlText(a.categoryId),
      sqlText(a.title),
      sqlText(a.shortDesc),
      sqlText(a.content ?? ""),
      sqlText(a.fen),
      sqlText(a.moveSequence),
      sqlText(a.image),
      sqlTextArray(a.tags),
      sqlBool(a.featured),
      sqlBool(a.showPuzzlesCTA),
      sqlBool(a.showOpeningToolCTA),
      sqlText(a.puzzleThemeHint),
      sqlText("published"),
    ]),
  ),
);

const wikiArticleIds = new Set(wikiArticles.map((a) => a.id));
const wikiLinks = wikiArticles.flatMap((a) => [
  // Only article links are foreign-keyed within this seed; the other kinds
  // point at content that may not be loaded yet, which the schema allows.
  ...(a.relatedArticleIds ?? [])
    .filter((t) => wikiArticleIds.has(t))
    .map((t, i) => ({ article: a.id, kind: "article", target: t, order: i })),
  ...(a.relatedChessflixIds ?? []).map((t, i) => ({ article: a.id, kind: "chessflix", target: t, order: i })),
  ...(a.relatedLessonIds ?? []).map((t, i) => ({ article: a.id, kind: "lesson", target: t, order: i })),
]);

chunks.push(
  insertIgnoreBlock(
    "wiki_article_links",
    ["article_id", "link_kind", "target_id", "sort_order"],
    wikiLinks.map((l) => [sqlText(l.article), sqlText(l.kind), sqlText(l.target), sqlNumber(l.order)]),
  ),
);

// ── Site settings ───────────────────────────────────────────────────────────

chunks.push(section("Site settings"));

const settings = admin.settings ?? {};
chunks.push(
  insertBlock(
    "site_settings",
    [
      "id",
      "site_name",
      "tagline",
      "seo_title",
      "hero_title",
      "hero_subtitle",
      "hero_cta_label",
      "primary_colour",
      "accent_colour",
      "discord_url",
      "youtube_url",
      "twitter_url",
      "maintenance_mode",
      "banner_active",
      "banner_text",
      "banner_colour",
      "homepage",
    ],
    [
      [
        "true",
        sqlText(settings.siteName ?? "ChessProphy"),
        sqlText(settings.tagline ?? "AI-Powered Chess Learning Platform"),
        sqlText(settings.seoTitle),
        sqlText(settings.heroTitle ?? "Master Chess with AI-Powered Learning"),
        sqlText(
          settings.heroSubtitle ??
            "Personalized training, daily puzzles, and an AI coach - all in one place.",
        ),
        sqlText(settings.heroCtaLabel ?? "Start Learning Free"),
        sqlText(settings.primaryColor ?? "#2563EB"),
        sqlText(settings.accentColor ?? "#C9A84C"),
        sqlText(settings.discordUrl),
        sqlText(settings.youtubeUrl),
        sqlText(settings.twitterUrl),
        sqlBool(false),
        sqlBool(admin.content?.bannerActive),
        sqlText(admin.content?.bannerText),
        sqlText(admin.content?.bannerColor ?? "#2563EB"),
        sqlJson(admin.homepage ?? {}),
      ],
    ],
  ),
);

// ── News, events, announcements ─────────────────────────────────────────────

chunks.push(section("News, events and announcements"));

chunks.push(
  insertBlock(
    "news_posts",
    ["id", "title", "content", "cover_url", "author", "tags", "published_at", "status"],
    (admin.news ?? [])
      .filter((n) => n.published !== false)
      .map((n) => [
        sqlText(stableUuid("news", n.title)),
        sqlText(n.title),
        sqlText(n.content ?? ""),
        sqlText(n.cover),
        sqlText(n.author),
        sqlTextArray(n.tags),
        sqlTimestamp(n.date, "now()"),
        sqlText("published"),
      ]),
  ),
);

chunks.push(
  insertBlock(
    "events",
    [
      "id",
      "title",
      "description",
      "banner_url",
      "event_type",
      "organizer",
      "starts_at",
      "register_url",
      "participant_cap",
      "is_featured",
      "status",
    ],
    (admin.events ?? []).map((e) => [
      sqlText(stableUuid("event", e.title)),
      sqlText(e.title),
      sqlText(e.desc),
      sqlText(e.banner),
      sqlText(e.type),
      sqlText(e.organizer),
      sqlTimestamp(e.datetime),
      sqlText(e.registerUrl),
      sqlNumber(e.participants),
      sqlBool(e.featured),
      sqlText("published"),
    ]),
  ),
);

chunks.push(
  insertBlock(
    "announcements",
    ["id", "title", "body", "scope", "is_active"],
    (admin.announcements ?? []).map((a) => [
      sqlText(stableUuid("announcement", a.title)),
      sqlText(a.title),
      sqlText(a.body),
      sqlText(a.scope ?? "Global"),
      sqlBool(a.active !== false),
    ]),
  ),
);

const chapterCount = courses.reduce((n, c) => n + (c.content?.chapters?.length ?? 0), 0);
const moveCount = variations.reduce((n, v) => n + (v.moves?.length ?? 0), 0);

chunks.push(`
commit;

-- Summary of what this file loads:
--   openings ${OPENING_REPERTOIRE.length} | variations ${variations.length} | moves ${moveCount}
--   puzzles ${PUZZLE_DB.length} | classic games ${ALL_GAMES.length}
--   study categories ${categories.length} | courses ${courses.length} | chapters ${chapterCount}
--   daily questions ${Object.values(DQ_BANK).flat().length} | quiz questions ${Object.values(QUIZ_BANK).flat().length} | placement ${PLACEMENT_QUESTIONS.length}
--   skill tree nodes ${treeNodes.length} | prerequisites ${treeEdges.length}
--   achievements ${ACHIEVEMENTS.length} | store items ${(admin.storeItems ?? []).length}
--   wiki categories ${(admin.wikiCategories ?? []).length} | wiki articles ${wikiArticles.length}
`);

// ── Write or verify ─────────────────────────────────────────────────────────

const generated = chunks.join("");

if (checkOnly) {
  let current = "";
  try {
    current = readFileSync(outputPath, "utf8");
  } catch {
    console.error(`✗ ${path.relative(rootDir, outputPath)} does not exist. Run: npm run db:seed:generate`);
    process.exit(1);
  }
  if (current !== generated) {
    console.error(
      `✗ ${path.relative(rootDir, outputPath)} is out of date with src/data/.\n  Run: npm run db:seed:generate`,
    );
    process.exit(1);
  }
  console.log("✓ seed.sql matches its sources.");
} else {
  writeFileSync(outputPath, generated);
  console.log(
    `✓ Wrote ${path.relative(rootDir, outputPath)} (${generated.split("\n").length} lines, ${(generated.length / 1024).toFixed(1)} kB)`,
  );
}
