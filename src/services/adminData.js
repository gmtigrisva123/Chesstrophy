import { PLACEMENT_QUESTIONS } from "../data/coachInsights.js";
import { __notifyAdminDataChanged } from "../lib/storage/adminDataEvents.js";
import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ── Admin data store — this is the site's content database (studies,
// courses, openings, news, events, resources, homepage config, etc.). Every
// public page reads from here, and the admin panel (src/features/admin,
// reached at #/admin) writes to it through src/services/adminContent.js so
// every change is audited.
const ADMIN_DATA_KEY = "cp_admin_data";
function defaultAdminData() {
  return {
    studies: [], // Community studies — nothing is seeded; content arrives only from a real CMS/backend
    courses: [], // Full Learn/Cheat Sheet/Practice courses — rendered live in Studies via CourseViewer
    storeItems: [
      { id: "store1", title: "Advanced Calculation Mastery", desc: "Deep calculation training for sharp, forcing positions.", difficulty: "Advanced", targetRating: "1600–1900", priceCoins: 2000, priceReal: null, icon: "🧮", published: true, archived: false },
      { id: "store2", title: "100 Tactical Positions", desc: "A hand-picked set of tactical puzzles across every major motif.", difficulty: "Intermediate", targetRating: "1200–1700", priceCoins: 500, priceReal: null, icon: "🧩", published: true, archived: false },
      { id: "store3", title: "Endgame Mastery Pack", desc: "Rook, minor-piece, and pawn endgames every serious player needs.", difficulty: "Advanced", targetRating: "1500–2000", priceCoins: 1500, priceReal: null, icon: "♚", published: true, archived: false },
    ],
    economyConfig: {
      course_complete:   { label: "Course completed",         coins: 100, xp: 250, enabled: true },
      course_test:       { label: "Test completed",           coins: 50,  xp: 100, enabled: true },
      course_test_bonus: { label: "80%+ test score bonus",    coins: 25,  xp: 50,  enabled: true },
      puzzle_solved:      { label: "Puzzle solved",            coins: 5,   xp: 15,  enabled: true },
      puzzle_pack:        { label: "Puzzle pack (10 solved)",  coins: 60,  xp: 120, enabled: true },
      daily_questions:    { label: "Daily Questions session",  coins: 20,  xp: 30,  enabled: true },
      weekly_mission:     { label: "Weekly mission complete",  coins: 200, xp: 300, enabled: true },
    },
    openings: [],
    lessons: [],
    announcements: [],
    news: [],
    events: [],
    dashboardConfig: {
      sections: { welcome: true, classicGames: true, openingTrainer: true, updates: true, featuredEvent: true, upcomingEvents: true, continueLearning: true, progress: true, recommendations: true, activity: true },
      order: ["welcome", "classicGames", "openingTrainer", "continueLearning", "updates", "featuredEvent", "upcomingEvents", "progress", "recommendations", "activity"],
      banner: { active: false, text: "", color: "#2563EB", linkLabel: "", linkTarget: "" },
    },
    chessflixConfig: {
      enabled: true,
      postPermission: "admins", // admins | admins_approved | custom
      approvedCreators: [], // usernames allowed to post, used by admins_approved / custom
      moderationEnabled: false, // when true, non-admin posts land as "pending" until approved
    },
    chessflixContent: [],
    resources: [],
    positions: [], // Board Builder: saved positions {id, fen, arrows, highlights, comment, title}
    questionCards: PLACEMENT_QUESTIONS.map((q, i) => ({ id: "qc" + i, ...q })), // ChessProphy AI placement quiz — admin-editable
    puzzlesAdmin: [], // Admin-authored puzzles merged into the live Puzzles page
    // ── ChessWiki — categories are fixed (matches the spec's 8 sections);
    // this list is the single source of truth for what shows up.
    wikiCategories: [
      { id:"openings",    icon:"♟️", label:"Openings",       desc:"Opening systems, variations, ideas and famous games." },
      { id:"tactics",     icon:"🧩", label:"Tactics",        desc:"Forks, pins, skewers, discovered attacks, sacrifices, etc." },
      { id:"strategy",    icon:"🧠", label:"Strategy",       desc:"Pawn structures, positional concepts, planning, piece activity." },
      { id:"endgames",    icon:"🏁", label:"Endgames",       desc:"King and pawn endings, rook endings, minor-piece endings, theoretical positions." },
      { id:"players",     icon:"👑", label:"Players",        desc:"Chess players, their careers, playing styles, achievements and famous games." },
      { id:"tournaments", icon:"🏆", label:"Tournaments",    desc:"Major tournaments, championships and important historical events." },
      { id:"history",     icon:"📜", label:"History",        desc:"Important events and developments in chess history." },
      { id:"concepts",    icon:"📖", label:"Chess Concepts", desc:"General chess terminology and concepts." },
    ],
    wikiArticles: [
      { id:"w1", title:"Sicilian Defense", categoryId:"openings",
        shortDesc:"The most popular and combative response to 1.e4, leading to sharp, asymmetrical positions.",
        content:"## Overview\nThe Sicilian Defense begins 1.e4 c5 and is Black's most popular and successful response to 1.e4 at every level of play. Rather than mirroring White's central control, Black stakes a claim on the d4 square from the side, leading to imbalanced, fighting positions.\n\n## Main Ideas\nBlack accepts a slightly passive position in the center in exchange for active piece play and good attacking chances against White's king, especially in lines where White castles queenside.\n\n## Variations\n- **Open Sicilian** (2.Nf3 and 3.d4) — the main line, leading to sharp theoretical battles\n- **Najdorf Variation** (2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6) — the most popular and deeply analyzed line in modern chess\n- **Dragon Variation** — Black fianchettoes the bishop to g7 for a razor-sharp opposite-side attacking game\n- **Sveshnikov Variation** — an aggressive, theory-heavy line embraced at the highest level\n\n## Famous Games\nThe Sicilian has produced some of the most celebrated attacking games in chess history, including many Kasparov–Karpov world championship battles fought in Najdorf and Scheveningen structures.\n\n## Learn More\nWork through ChessProphy's Sicilian repertoire courses and drilling lines in Openings to build this into your own game.",
        fen:"", moveSequence:"e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6",
        tags:["sicilian","e4","opening theory","black repertoire"], image:"",
        relatedArticleIds:["w2","w7"], relatedChessflixIds:[], relatedLessonIds:[],
        showPuzzlesCTA:true, puzzleThemeHint:"sicilian", showJourneyCTA:true, showOpeningToolCTA:true, openingHint:"Sicilian Defense",
        published:true, featured:true, views:0, createdAt:new Date(Date.now()-6*86400000).toISOString() },
      { id:"w2", title:"Najdorf Variation", categoryId:"openings",
        shortDesc:"The most deeply studied line of the Sicilian, a favorite of Fischer and Kasparov.",
        content:"## Overview\nThe Najdorf Variation arises after 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6. The quiet-looking 5...a6 is one of the most flexible and battle-tested moves in chess, preparing ...e5 or ...b5 while denying White's pieces the b5 square.\n\n## Main Ideas\nBlack keeps maximum flexibility, often expanding on the queenside with ...b5 while White chooses between the aggressive English Attack (Be3, f3, Qd2, O-O-O) or quieter systems.\n\n## Variations\n- **English Attack** — White's most testing try, aiming for a kingside pawn storm\n- **6.Bg5** — the classical main line, leading to razor-sharp theory\n- **6.Be2** — a quieter, positional approach\n\n## Famous Games\nBobby Fischer and Garry Kasparov both used the Najdorf as their primary weapon against 1.e4 for most of their careers, producing some of the richest opening theory in chess.\n\n## Learn More\nSee the Sicilian Defense article for the broader family this variation belongs to.",
        fen:"", moveSequence:"e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6",
        tags:["sicilian","najdorf","opening theory"], image:"",
        relatedArticleIds:["w1"], relatedChessflixIds:[], relatedLessonIds:[],
        showPuzzlesCTA:true, puzzleThemeHint:"sicilian", showJourneyCTA:false, showOpeningToolCTA:true, openingHint:"Najdorf Variation",
        published:true, featured:false, views:0, createdAt:new Date(Date.now()-5*86400000).toISOString() },
      { id:"w3", title:"The Fork", categoryId:"tactics",
        shortDesc:"A single move that attacks two or more enemy pieces at once — one of the first tactical motifs every player learns.",
        content:"## Overview\nA fork occurs when one piece attacks two (or more) enemy pieces simultaneously, forcing the opponent to lose material because they can only save one. Knights are especially notorious forking pieces due to their unusual movement pattern, but every piece — including pawns and kings — can deliver a fork.\n\n## Main Ideas\nThe strongest forks target the king alongside another valuable piece, since a check must be answered immediately, leaving no time to save the second attacked piece.\n\n## Typical Positions\nA classic pattern: a knight landing on a square that simultaneously attacks the enemy king and an undefended rook — often called a 'royal fork'.\n\n## Related Articles\nSee Pin and Skewer for the other core pieces of tactical vision.",
        fen:"r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", moveSequence:"",
        tags:["tactics","fork","knight","beginner"], image:"",
        relatedArticleIds:["w4"], relatedChessflixIds:[], relatedLessonIds:[],
        showPuzzlesCTA:true, puzzleThemeHint:"fork", showJourneyCTA:true, showOpeningToolCTA:false, openingHint:"",
        published:true, featured:true, views:0, createdAt:new Date(Date.now()-4*86400000).toISOString() },
      { id:"w4", title:"Pin", categoryId:"tactics",
        shortDesc:"Immobilizing an enemy piece because moving it would expose a more valuable piece behind it.",
        content:"## Overview\nA pin restricts an enemy piece from moving because doing so would expose a more valuable piece — often the king — to attack. A pin against the king is absolute: the pinned piece legally cannot move at all.\n\n## Main Ideas\nPinned pieces are frequently weak points to pile pressure onto with additional attackers, since the defender can't simply move the pinned piece away.\n\n## Related Articles\nSee The Fork and Skewer for related tactical motifs.",
        fen:"rnbqkb1r/pppp1ppp/5n2/4p3/4P3/3B4/PPPP1PPP/RNBQK1NR b KQkq - 3 3", moveSequence:"",
        tags:["tactics","pin","beginner"], image:"",
        relatedArticleIds:["w3"], relatedChessflixIds:[], relatedLessonIds:[],
        showPuzzlesCTA:true, puzzleThemeHint:"pin", showJourneyCTA:false, showOpeningToolCTA:false, openingHint:"",
        published:true, featured:false, views:0, createdAt:new Date(Date.now()-3*86400000).toISOString() },
      { id:"w5", title:"Zugzwang", categoryId:"concepts",
        shortDesc:"A position where a player is at a disadvantage because they are forced to move, and every legal move worsens their position.",
        content:"## Overview\nZugzwang (German for 'compulsion to move') describes a position where any legal move a player makes weakens their position — but since passing isn't allowed in chess, they're forced to move anyway. It's most common in the endgame, where the shortage of pieces makes 'waiting' options scarce.\n\n## Main Ideas\nUnderstanding zugzwang is essential for endgame technique, particularly in king and pawn endings, where a single tempo can decide the outcome.\n\n## Typical Positions\nA classic example: a king and pawn endgame where the defending king must give way and let the attacking king through, purely because it has no other legal move.\n\n## Related Articles\nSee Opposition, a closely related king-and-pawn endgame concept.",
        fen:"8/8/8/4k3/4P3/4K3/8/8 b - - 0 1", moveSequence:"",
        tags:["endgame","zugzwang","concept"], image:"",
        relatedArticleIds:["w6"], relatedChessflixIds:[], relatedLessonIds:[],
        showPuzzlesCTA:false, puzzleThemeHint:"", showJourneyCTA:true, showOpeningToolCTA:false, openingHint:"",
        published:true, featured:true, views:0, createdAt:new Date(Date.now()-2*86400000).toISOString() },
      { id:"w6", title:"Opposition", categoryId:"endgames",
        shortDesc:"A key king-and-pawn endgame technique where the kings face each other and whoever must move is at a disadvantage.",
        content:"## Overview\nOpposition occurs when two kings face each other on the same file, rank, or diagonal with exactly one square between them. Whichever side is NOT required to move 'has the opposition' and holds the advantage, since the opponent's king must give ground.\n\n## Main Ideas\nMastering opposition is the foundation of virtually all king and pawn endgame technique — it determines whether a lone king can stop a passed pawn, or whether an attacking king can force its way past a defender.\n\n## Related Articles\nSee Zugzwang, the broader principle opposition is built on.",
        fen:"8/8/4k3/8/4K3/8/4P3/8 w - - 0 1", moveSequence:"",
        tags:["endgame","opposition","king and pawn"], image:"",
        relatedArticleIds:["w5"], relatedChessflixIds:[], relatedLessonIds:[],
        showPuzzlesCTA:false, puzzleThemeHint:"", showJourneyCTA:true, showOpeningToolCTA:false, openingHint:"",
        published:true, featured:false, views:0, createdAt:new Date(Date.now()-1*86400000).toISOString() },
      { id:"w7", title:"Garry Kasparov", categoryId:"players",
        shortDesc:"World Chess Champion from 1985–2000 and one of the most dominant and influential players in chess history.",
        content:"## Overview\nGarry Kasparov became the youngest World Chess Champion in history in 1985 at age 22, and held the title until 2000. Known for his aggressive, deeply-prepared attacking style, he dominated top-level chess for close to two decades.\n\n## Playing Style\nKasparov was famous for exceptionally sharp opening preparation — particularly in the Sicilian Najdorf and King's Indian Defense — combined with relentless calculation and attacking energy in the middlegame.\n\n## Famous Games\nHis 1999 'Kasparov's Immortal' against Veselin Topalov is widely considered one of the greatest attacking games ever played.\n\n## Related Articles\nSee Sicilian Defense and Najdorf Variation for the openings most associated with his repertoire.",
        fen:"", moveSequence:"",
        tags:["players","world champion","kasparov"], image:"",
        relatedArticleIds:["w1","w2"], relatedChessflixIds:[], relatedLessonIds:[],
        showPuzzlesCTA:false, puzzleThemeHint:"", showJourneyCTA:false, showOpeningToolCTA:false, openingHint:"",
        published:true, featured:false, views:0, createdAt:new Date(Date.now()-8*86400000).toISOString() },
      { id:"w8", title:"The Immortal Game", categoryId:"history",
        shortDesc:"Anderssen vs. Kieseritzky, London 1851 — one of the most famous games ever played, celebrated for its audacious sacrifices.",
        content:"## Overview\nPlayed in London in 1851 during a break in the first international tournament, Adolf Anderssen's game against Lionel Kieseritzky became known as 'The Immortal Game' for its stunning series of sacrifices — Anderssen gave up a bishop, both rooks, and his queen before delivering checkmate with his three remaining minor pieces.\n\n## Why It Matters\nThe game is a landmark of the Romantic era of chess, when bold attacking play and material sacrifice for initiative were prized above solid, positional technique.\n\n## Related Articles\nSee Garry Kasparov for a look at how attacking chess evolved into the modern era.",
        fen:"", moveSequence:"e4 e5 f4 exf4 Bc4 Qh4+ Kf1 b5 Bxb5 Nf6 Nf3 Qh6 d3 Nh5 Nh4 Qg5 Nf5 c6 g4 Nf6 Rg1 cxb5 h4 Qg6 h5 Qg5 Qf3 Ng8 Bxf4 Qf6 Nc3 Bc5 Nd5 Qxb2 Bd6 Bxg1 e5 Qxa1+ Ke2 Na6 Nxg7+ Kd8 Qf6+ Nxf6 Be7#",
        tags:["history","famous games","romantic era"], image:"",
        relatedArticleIds:["w7"], relatedChessflixIds:[], relatedLessonIds:[],
        showPuzzlesCTA:false, puzzleThemeHint:"", showJourneyCTA:false, showOpeningToolCTA:false, openingHint:"",
        published:true, featured:true, views:0, createdAt:new Date(Date.now()-10*86400000).toISOString() },
    ],
    homepage: {
      features: [
        { id:"f1", icon:"🧩", title:"Daily Puzzles", desc:"Sharpen tactics with a fresh puzzle every day." },
        { id:"f2", icon:"🧠", title:"AI Coach", desc:"Personalized feedback powered by ChessProphy AI." },
        { id:"f3", icon:"♔",  title:"Opening Trainer", desc:"Master repertoires with spaced repetition." },
      ],
    },
    widgets: {
      dailyPuzzle: true, openingOfWeek: true, recentStudies: true,
      latestNews: true, leaderboard: true, events: true, announcements: true,
    },
    settings: {},
    content: {
      bannerActive: false, bannerText: "", bannerColor: "#2563EB",
    },
  };
}
// Earlier builds seeded placeholder records into defaultAdminData() — a sample
// study, opening, lesson, resource, announcement, news post, an event that was
// always "7 days away" with 128 fake attendees, a ChessFlix video with 1,284
// fake views, three invented member accounts, fake homepage stats and
// testimonials. Every browser that recorded a wiki/ChessFlix view has that
// demo data persisted in cp_admin_data, so dropping it from the defaults is
// not enough: strip those exact records on load so they can never render again.
// Records the user genuinely created (a ChessFlix post, say) have different
// ids and pass through untouched.
const DEMO_RECORD_IDS = {
  studies: ["s1", "s2"], openings: ["o1"], lessons: ["l1"], resources: ["r1"],
  announcements: ["a1"], news: ["n1"], events: ["ev1"], chessflixContent: ["cf1"],
};
function stripDemoRecords(parsed) {
  const next = { ...parsed };
  for (const [key, ids] of Object.entries(DEMO_RECORD_IDS)) {
    if (Array.isArray(next[key])) next[key] = next[key].filter(r => !ids.includes(r?.id));
  }
  delete next.users;
  if (next.homepage) {
    const { stats: _stats, testimonials: _testimonials, ...homepage } = next.homepage;
    next.homepage = homepage;
  }
  return next;
}

function loadAdminData() {
  const defaults = defaultAdminData();
  const stored = readJson(ADMIN_DATA_KEY, () => null);
  if (!stored) return defaults;
  const parsed = stripDemoRecords(stored);
  // Shallow-merge so older saved states pick up newly-added CMS sections
  return { ...defaults, ...parsed,
    settings: { ...defaults.settings, ...(parsed.settings || {}) },
    homepage: { ...defaults.homepage, ...(parsed.homepage || {}) },
    widgets: { ...defaults.widgets, ...(parsed.widgets || {}) },
    content: { ...defaults.content, ...(parsed.content || {}) },
  };
}
function saveAdminData(d) {
  if (writeJson(ADMIN_DATA_KEY, d)) __notifyAdminDataChanged();
}

export {
  ADMIN_DATA_KEY,
  defaultAdminData,
  loadAdminData,
  saveAdminData,
};
