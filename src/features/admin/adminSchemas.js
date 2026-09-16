import { validateFen, validatePuzzleSolution } from "../../services/adminContent.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── COLLECTION SCHEMAS ────────────────────────────────────────────────────────
// One declarative description per content collection in the admin store.
// CollectionManager renders the list, filters, form and validation from these,
// so adding a new manageable collection is a schema entry, not a new screen.
//
//   key          the adminData property (an array of records with an `id`)
//   idPrefix     prefix for generated ids (must not collide with catalogue ids)
//   statusOf     record → "published" | "draft" | "archived" | "pending" | …
//   quickToggle  a boolean field flipped straight from the list row
//   columns      what the list shows besides the title
//   fields       the form. Types: text, url, number, textarea, markdown, tags,
//                toggle, select, date, datetime, fen, moves, options, json
//   validate     record → { field: "message" }  (empty object when valid)
//   load / beforeSave   optional transforms between stored record and form
// ══════════════════════════════════════════════════════════════════════════════

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];
const required = (r, keys) => Object.fromEntries(keys.filter(k => !String(r[k] ?? "").trim()).map(k => [k, "Required"]));
const statusFromFlags = (r) => (r.archived ? "archived" : r.published ? "published" : "draft");
const today = () => new Date().toDateString();

const COLLECTIONS = {
  news: {
    key: "news", icon: "📰", label: "News post", plural: "News", idPrefix: "news",
    description: "Articles shown on the News page and in the dashboard's Updates strip.",
    statusOf: r => (r.published ? "published" : "draft"),
    quickToggle: { field: "published", on: "Published", off: "Draft" },
    columns: [{ key: "author", label: "Author" }, { key: "date", label: "Date" }],
    fields: [
      { key: "title", label: "Title", type: "text", span: 2 },
      { key: "author", label: "Author", type: "text" },
      { key: "date", label: "Display date", type: "text", hint: "e.g. Mon Jan 05 2026" },
      { key: "cover", label: "Cover image URL", type: "url", span: 2 },
      { key: "content", label: "Content", type: "markdown", rows: 12, span: 2, hint: "Markdown: # headings, **bold**, lists" },
      { key: "tags", label: "Tags", type: "tags", span: 2 },
      { key: "published", label: "Published", type: "toggle" },
    ],
    create: () => ({ title: "", cover: "", content: "", tags: [], author: "ChessProphy Team", date: today(), published: false }),
    validate: r => required(r, ["title", "content"]),
  },

  events: {
    key: "events", icon: "📅", label: "Event", plural: "Events", idPrefix: "ev",
    description: "Tournaments, webinars and meetups. The featured event gets the hero card on the dashboard.",
    statusOf: r => (r.featured ? "featured" : (!r.datetime || new Date(r.datetime) >= new Date()) ? "upcoming" : "archived"),
    quickToggle: { field: "featured", on: "Featured", off: "Feature" },
    columns: [{ key: "type", label: "Type" }, { key: "date", label: "Date" }, { key: "organizer", label: "Organizer" }],
    fields: [
      { key: "title", label: "Title", type: "text", span: 2 },
      { key: "type", label: "Type", type: "select", options: ["Rapid", "Blitz", "Classical", "Tournament", "Webinar", "Meetup", "Other"] },
      { key: "organizer", label: "Organizer", type: "text" },
      { key: "datetime", label: "Starts at", type: "datetime", hint: "Your local time; the display date/time are derived from this" },
      { key: "registerUrl", label: "External registration URL", type: "url" },
      { key: "banner", label: "Banner image URL", type: "url", span: 2 },
      { key: "desc", label: "Description", type: "textarea", rows: 4, span: 2 },
      { key: "featured", label: "Featured event", type: "toggle" },
    ],
    create: () => ({ title: "", banner: "", type: "Rapid", organizer: "ChessProphy Team", datetime: "", registerUrl: "", desc: "", featured: false, status: "upcoming" }),
    validate: r => ({ ...required(r, ["title"]), ...(r.datetime && Number.isNaN(new Date(r.datetime).getTime()) ? { datetime: "Not a valid date" } : {}) }),
    beforeSave: r => {
      if (!r.datetime) return { ...r, date: r.date || "TBA", time: r.time || "" };
      const d = new Date(r.datetime);
      return { ...r, datetime: d.toISOString(), date: d.toDateString(), time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }), status: d >= new Date() ? "upcoming" : "ended" };
    },
    load: r => ({ ...r, datetime: r.datetime ? toLocalInput(r.datetime) : "" }),
  },

  announcements: {
    key: "announcements", icon: "📢", label: "Announcement", plural: "Announcements", idPrefix: "ann",
    description: "Short notices pinned to the dashboard's Updates strip while active.",
    statusOf: r => (r.active ? "active" : "hidden"),
    quickToggle: { field: "active", on: "Active", off: "Hidden" },
    columns: [{ key: "scope", label: "Scope" }, { key: "date", label: "Date" }],
    fields: [
      { key: "title", label: "Title", type: "text", span: 2 },
      { key: "body", label: "Body", type: "textarea", rows: 4, span: 2 },
      { key: "scope", label: "Scope", type: "select", options: ["Global", "Dashboard"] },
      { key: "active", label: "Active", type: "toggle" },
    ],
    create: () => ({ title: "", body: "", scope: "Global", active: true, date: today() }),
    validate: r => required(r, ["title", "body"]),
  },

  puzzlesAdmin: {
    key: "puzzlesAdmin", icon: "🧩", label: "Puzzle", plural: "Custom puzzles", idPrefix: "ap",
    description: "Extra practice puzzles, merged into the Puzzles page after the built-in set. Solutions are checked against the engine before they can be saved.",
    statusOf: () => "published",
    columns: [{ key: "theme", label: "Theme" }, { key: "rating", label: "Rating" }],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "rating", label: "Rating", type: "number", min: 400, max: 3000 },
      { key: "fen", label: "Starting position (FEN)", type: "fen", span: 2 },
      { key: "solution", label: "Solution", type: "moves", span: 2, hint: "Full line, space-separated: player move, reply, player move… e.g. d1e2 e8g8" },
      { key: "theme", label: "Theme", type: "text" },
      { key: "tags", label: "Tags", type: "tags" },
      { key: "desc", label: "Description", type: "textarea", rows: 3, span: 2 },
    ],
    create: () => ({ title: "", rating: 1200, fen: "", solution: [], theme: "", desc: "", tags: [] }),
    validate: r => {
      const errs = required(r, ["title", "fen"]);
      const rating = Number(r.rating);
      if (!(rating >= 400 && rating <= 3000)) errs.rating = "400 – 3000";
      const problem = validatePuzzleSolution(r.fen, r.solution);
      if (problem && !errs.fen) errs[problem.toLowerCase().includes("fen") || problem.includes("rank") || problem.includes("king") ? "fen" : "solution"] = problem;
      return errs;
    },
    beforeSave: r => ({ ...r, rating: Number(r.rating), fen: r.fen.trim(), solution: Array.isArray(r.solution) ? r.solution : String(r.solution).trim().split(/[\s,]+/).filter(Boolean) }),
  },

  storeItems: {
    key: "storeItems", icon: "🪙", label: "Store item", plural: "Store items", idPrefix: "store",
    description: "Premium resources purchasable with ProphyCoins.",
    statusOf: statusFromFlags,
    quickToggle: { field: "published", on: "Live", off: "Draft" },
    columns: [{ key: "priceCoins", label: "Price", render: v => `🪙 ${Number(v || 0).toLocaleString()}` }, { key: "difficulty", label: "Level" }],
    fields: [
      { key: "icon", label: "Icon (emoji)", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "desc", label: "Description", type: "textarea", rows: 3, span: 2 },
      { key: "difficulty", label: "Difficulty", type: "select", options: DIFFICULTIES },
      { key: "targetRating", label: "Target rating", type: "text", hint: "e.g. 1200–1700" },
      { key: "priceCoins", label: "Price (ProphyCoins)", type: "number", min: 0 },
      { key: "published", label: "Published", type: "toggle" },
      { key: "archived", label: "Archived", type: "toggle" },
    ],
    create: () => ({ title: "", desc: "", difficulty: "Intermediate", targetRating: "", priceCoins: 500, priceReal: null, icon: "📘", published: false, archived: false }),
    validate: r => ({ ...required(r, ["title"]), ...(Number(r.priceCoins) >= 0 ? {} : { priceCoins: "Must be 0 or more" }) }),
    beforeSave: r => ({ ...r, priceCoins: Number(r.priceCoins) }),
  },

  studies: {
    key: "studies", icon: "✍️", label: "Community study", plural: "Community studies", idPrefix: "cs",
    description: "Stand-alone studies listed under “Community Studies” on the Studies page.",
    statusOf: statusFromFlags,
    quickToggle: { field: "published", on: "Published", off: "Draft" },
    columns: [{ key: "category", label: "Category" }, { key: "difficulty", label: "Level" }, { key: "time", label: "Time" }],
    fields: [
      { key: "title", label: "Title", type: "text", span: 2 },
      { key: "category", label: "Category", type: "select", options: ["Opening", "Middlegame", "Endgame", "Tactics", "Strategy"] },
      { key: "difficulty", label: "Difficulty", type: "select", options: DIFFICULTIES },
      { key: "time", label: "Study time", type: "text", hint: "e.g. 30 min" },
      { key: "url", label: "Source URL", type: "url" },
      { key: "thumbnail", label: "Thumbnail URL", type: "url", span: 2 },
      { key: "desc", label: "Summary", type: "textarea", rows: 3, span: 2 },
      { key: "body", label: "Body", type: "markdown", rows: 8, span: 2 },
      { key: "tags", label: "Tags", type: "tags", span: 2 },
      { key: "published", label: "Published", type: "toggle" },
      { key: "featured", label: "Featured", type: "toggle" },
      { key: "archived", label: "Archived", type: "toggle" },
    ],
    create: () => ({ title: "", desc: "", body: "", pgn: "", difficulty: "Intermediate", category: "Tactics", time: "", tags: [], url: "", image: "", thumbnail: "", published: false, archived: false, featured: false }),
    validate: r => required(r, ["title", "desc"]),
  },

  courses: {
    key: "courses", icon: "🎓", label: "Course", plural: "Courses", idPrefix: "course",
    description: "Full Learn / Cheat Sheet / Practice courses. Chapters are edited as JSON — start from the template.",
    statusOf: statusFromFlags,
    quickToggle: { field: "published", on: "Published", off: "Draft" },
    columns: [{ key: "difficulty", label: "Level" }, { key: "author", label: "Author" }, { key: "content", label: "Chapters", render: v => `${v?.chapters?.length || 0} ch.` }],
    fields: [
      { key: "title", label: "Title", type: "text", span: 2 },
      { key: "difficulty", label: "Difficulty", type: "select", options: DIFFICULTIES },
      { key: "author", label: "Author", type: "text" },
      { key: "color", label: "Accent colour", type: "text", hint: "#RRGGBB" },
      { key: "category", label: "Category", type: "text" },
      { key: "desc", label: "Summary", type: "textarea", rows: 3, span: 2 },
      { key: "content", label: "Course content (JSON)", type: "json", rows: 14, span: 2, template: () => ({
        chapters: [{ title: "Chapter 1", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", body: ["First paragraph.", "Second paragraph."], note: "" }],
        cheatSheet: { concepts: [], rules: [], mistakes: [], tricks: [] },
        practice: { tasks: [], puzzleTags: [], quiz: [{ q: "Question?", options: ["A", "B", "C"], answer: 0 }], checklist: ["Solve 15 puzzles"] },
      }) },
      { key: "published", label: "Published", type: "toggle" },
      { key: "archived", label: "Archived", type: "toggle" },
    ],
    create: () => ({ title: "", desc: "", difficulty: "Beginner", author: "ChessProphy", color: "#C9A84C", category: "", content: { chapters: [], cheatSheet: {}, practice: {} }, published: false, archived: false }),
    validate: r => {
      const errs = required(r, ["title"]);
      const c = r.content;
      if (!c || typeof c !== "object" || !Array.isArray(c.chapters)) errs.content = "content.chapters must be an array";
      else if (c.chapters.some(ch => !ch?.title)) errs.content = "every chapter needs a title";
      else { const bad = c.chapters.find(ch => ch.fen && validateFen(ch.fen)); if (bad) errs.content = `chapter “${bad.title}”: ${validateFen(bad.fen)}`; }
      return errs;
    },
  },

  openings: {
    key: "openings", icon: "♔", label: "Community opening", plural: "Community openings", idPrefix: "co",
    description: "Extra openings listed under “Community Openings” on the Openings page.",
    statusOf: statusFromFlags,
    quickToggle: { field: "published", on: "Published", off: "Draft" },
    columns: [{ key: "eco", label: "ECO" }, { key: "side", label: "Side" }, { key: "difficulty", label: "Level" }],
    fields: [
      { key: "name", label: "Name", type: "text", span: 2 },
      { key: "eco", label: "ECO code", type: "text", hint: "e.g. B20-B99" },
      { key: "side", label: "Played as", type: "select", options: ["White", "Black"] },
      { key: "difficulty", label: "Difficulty", type: "select", options: DIFFICULTIES },
      { key: "moves", label: "Main line", type: "text", hint: "e.g. 1.e4 c5 2.Nf3" },
      { key: "fen", label: "Key position (FEN)", type: "fen", span: 2, optional: true },
      { key: "desc", label: "Description", type: "textarea", rows: 3, span: 2 },
      { key: "variationNames", label: "Variations", type: "tags", span: 2 },
      { key: "imageUrl", label: "Image URL", type: "url" },
      { key: "videoUrl", label: "Video URL", type: "url" },
      { key: "url", label: "Source URL", type: "url", span: 2 },
      { key: "tags", label: "Tags", type: "tags", span: 2 },
      { key: "published", label: "Published", type: "toggle" },
      { key: "archived", label: "Archived", type: "toggle" },
    ],
    create: () => ({ name: "", eco: "", side: "White", desc: "", moves: "", pgn: "", fen: "", difficulty: "Intermediate", tags: [], variationNames: [], imageUrl: "", videoUrl: "", url: "", published: false, archived: false }),
    validate: r => ({ ...required(r, ["name"]), ...(r.fen && validateFen(r.fen) ? { fen: validateFen(r.fen) } : {}) }),
    load: r => ({ ...r, variationNames: (r.variations || []).map(v => v.name).filter(Boolean) }),
    beforeSave: ({ variationNames = [], ...r }) => ({ ...r, pgn: r.pgn || r.moves, variations: variationNames.map(name => ({ name })) }),
  },

  lessons: {
    key: "lessons", icon: "📖", label: "Lesson", plural: "Lessons", idPrefix: "les",
    description: "Short lessons that wiki articles can link to as related reading.",
    statusOf: r => (r.published ? "published" : "draft"),
    quickToggle: { field: "published", on: "Published", off: "Draft" },
    columns: [{ key: "category", label: "Category" }, { key: "difficulty", label: "Level" }],
    fields: [
      { key: "title", label: "Title", type: "text", span: 2 },
      { key: "category", label: "Category", type: "text" },
      { key: "difficulty", label: "Difficulty", type: "select", options: DIFFICULTIES },
      { key: "desc", label: "Summary", type: "textarea", rows: 2, span: 2 },
      { key: "body", label: "Body", type: "markdown", rows: 8, span: 2 },
      { key: "fen", label: "Position (FEN)", type: "fen", span: 2, optional: true },
      { key: "image", label: "Image URL", type: "url" },
      { key: "video", label: "Video URL", type: "url" },
      { key: "published", label: "Published", type: "toggle" },
    ],
    create: () => ({ title: "", category: "Tactics", difficulty: "Beginner", desc: "", body: "", image: "", video: "", fen: "", published: false }),
    validate: r => ({ ...required(r, ["title"]), ...(r.fen && validateFen(r.fen) ? { fen: validateFen(r.fen) } : {}) }),
  },

  resources: {
    key: "resources", icon: "🔗", label: "Resource", plural: "Resources", idPrefix: "res",
    description: "External links, PDFs and videos kept in the content library.",
    statusOf: r => (r.archived ? "archived" : "published"),
    quickToggle: { field: "archived", on: "Archived", off: "Archive" },
    columns: [{ key: "type", label: "Type" }, { key: "category", label: "Category" }],
    fields: [
      { key: "title", label: "Title", type: "text", span: 2 },
      { key: "type", label: "Type", type: "select", options: ["PDF", "Video", "Link", "Book"] },
      { key: "category", label: "Category", type: "text" },
      { key: "url", label: "URL", type: "url", span: 2 },
      { key: "desc", label: "Description", type: "textarea", rows: 3, span: 2 },
      { key: "archived", label: "Archived", type: "toggle" },
    ],
    create: () => ({ title: "", type: "Link", category: "", url: "", desc: "", archived: false }),
    validate: r => required(r, ["title", "url"]),
  },

  questionCards: {
    key: "questionCards", icon: "🧠", label: "Placement question", plural: "AI placement quiz", idPrefix: "qc",
    description: "The questions the ChessProphy AI placement quiz asks. Each answer type feeds a different cognitive metric.",
    statusOf: () => "published",
    columns: [{ key: "type", label: "Type" }, { key: "label", label: "Label" }],
    fields: [
      { key: "type", label: "Measures", type: "select", options: ["tactical", "positional", "endgame", "strategy", "pattern"] },
      { key: "label", label: "Label", type: "text" },
      { key: "question", label: "Question", type: "textarea", rows: 3, span: 2 },
      { key: "options", label: "Answer options", type: "options", span: 2 },
      { key: "correct", label: "Correct option", type: "optionIndex", optionsKey: "options" },
      { key: "explanation", label: "Explanation", type: "textarea", rows: 2, span: 2 },
    ],
    create: () => ({ type: "tactical", label: "", question: "", options: ["", "", "", ""], correct: 0, explanation: "" }),
    validate: r => {
      const errs = required(r, ["label", "question"]);
      const opts = (r.options || []).filter(o => String(o).trim());
      if (opts.length < 2) errs.options = "At least two answer options";
      if (!(Number(r.correct) >= 0 && Number(r.correct) < (r.options || []).length)) errs.correct = "Pick the correct option";
      return errs;
    },
    beforeSave: r => ({ ...r, options: (r.options || []).map(o => String(o).trim()).filter(Boolean), correct: Number(r.correct) }),
    titleField: "label",
  },

  wikiCategories: {
    key: "wikiCategories", icon: "🗂️", label: "Wiki category", plural: "Wiki categories", idPrefix: "wc",
    description: "The sections ChessWiki is organised into.",
    statusOf: () => "published",
    columns: [{ key: "id", label: "Slug" }],
    fields: [
      { key: "icon", label: "Icon (emoji)", type: "text" },
      { key: "label", label: "Name", type: "text" },
      { key: "desc", label: "Description", type: "textarea", rows: 2, span: 2 },
    ],
    create: () => ({ icon: "📖", label: "", desc: "" }),
    validate: r => required(r, ["label"]),
    beforeSave: r => ({ ...r, id: r.id || r.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }),
    titleField: "label",
  },

  wikiArticles: {
    key: "wikiArticles", icon: "📚", label: "Wiki article", plural: "Wiki articles", idPrefix: "w",
    description: "ChessWiki encyclopedia entries.",
    statusOf: r => (r.published ? (r.featured ? "featured" : "published") : "draft"),
    quickToggle: { field: "published", on: "Published", off: "Draft" },
    columns: [{ key: "categoryId", label: "Category" }, { key: "views", label: "Views" }],
    fields: [
      { key: "title", label: "Title", type: "text", span: 2 },
      { key: "categoryId", label: "Category", type: "select", optionsFrom: "wikiCategories" },
      { key: "image", label: "Image URL", type: "url" },
      { key: "shortDesc", label: "Short description", type: "textarea", rows: 2, span: 2 },
      { key: "content", label: "Content", type: "markdown", rows: 14, span: 2 },
      { key: "fen", label: "Diagram (FEN)", type: "fen", optional: true, span: 2 },
      { key: "moveSequence", label: "Move sequence", type: "text", hint: "SAN, space separated: e4 c5 Nf3", span: 2 },
      { key: "tags", label: "Tags", type: "tags", span: 2 },
      { key: "relatedArticleIds", label: "Related article ids", type: "tags" },
      { key: "openingHint", label: "Opening name for the Openings CTA", type: "text" },
      { key: "puzzleThemeHint", label: "Puzzle theme for the Puzzles CTA", type: "text" },
      { key: "showPuzzlesCTA", label: "Show Puzzles CTA", type: "toggle" },
      { key: "showJourneyCTA", label: "Show Learning Tree CTA", type: "toggle" },
      { key: "showOpeningToolCTA", label: "Show Openings CTA", type: "toggle" },
      { key: "published", label: "Published", type: "toggle" },
      { key: "featured", label: "Featured", type: "toggle" },
    ],
    create: () => ({ title: "", categoryId: "concepts", shortDesc: "", content: "", fen: "", moveSequence: "", tags: [], image: "", relatedArticleIds: [], relatedChessflixIds: [], relatedLessonIds: [], showPuzzlesCTA: false, puzzleThemeHint: "", showJourneyCTA: false, showOpeningToolCTA: false, openingHint: "", published: false, featured: false, views: 0, createdAt: new Date().toISOString() }),
    validate: r => ({ ...required(r, ["title", "shortDesc", "content"]), ...(r.fen && validateFen(r.fen) ? { fen: validateFen(r.fen) } : {}) }),
  },

  chessflixContent: {
    key: "chessflixContent", icon: "🎬", label: "ChessFlix post", plural: "ChessFlix", idPrefix: "cf",
    description: "Videos and images in ChessFlix. Pending posts wait for approval on the Moderation page.",
    statusOf: r => r.status || "draft",
    columns: [{ key: "creatorName", label: "Creator" }, { key: "category", label: "Category" }, { key: "views", label: "Views" }],
    fields: [
      { key: "title", label: "Title", type: "text", span: 2 },
      { key: "type", label: "Media type", type: "select", options: ["video", "image"] },
      { key: "category", label: "Category", type: "text" },
      { key: "mediaUrl", label: "Media URL", type: "url", span: 2 },
      { key: "thumbnail", label: "Thumbnail URL", type: "url", span: 2 },
      { key: "desc", label: "Description", type: "textarea", rows: 3, span: 2 },
      { key: "creatorName", label: "Creator name", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["published", "pending", "rejected"] },
      { key: "featured", label: "Featured", type: "toggle" },
    ],
    create: () => ({ title: "", desc: "", type: "video", mediaUrl: "", thumbnail: "", category: "Openings", creatorName: "ChessProphy Team", creatorId: "admin", views: 0, status: "published", featured: false, createdAt: new Date().toISOString() }),
    validate: r => required(r, ["title", "mediaUrl"]),
  },
};

function toLocalInput(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function recordTitle(schema, r) {
  return r[schema.titleField || "title"] || r.name || r.label || r.id;
}

export {
  COLLECTIONS,
  DIFFICULTIES,
  recordTitle,
  toLocalInput,
};
