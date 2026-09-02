import { loadAdminData, saveAdminData } from "./adminData.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── CHESSWIKI ─────────────────────────────────────────────────────────────────
// A searchable, interconnected chess encyclopedia. Reuses the existing admin
// data store (loadAdminData/saveAdminData), the shared card/button/markdown
// helpers, and the shared WikiBoard/InteractiveBoard for positions — no new
// systems, same patterns as News/Events/Studies.
// ══════════════════════════════════════════════════════════════════════════════

// De-duplicated view counter: only counts once per article per browser session,
// so refreshing the page doesn't inflate "Popular" rankings.
const WIKI_SEEN_KEY = "cp_wiki_seen";

function readSeenArticles() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(WIKI_SEEN_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Private-mode browsers and a corrupt entry look the same here, and both
    // mean the same thing: we have no record, so count this view.
    return [];
  }
}

function wikiTrackView(articleId) {
  const seen = readSeenArticles();
  if (seen.includes(articleId)) return;

  const data = loadAdminData();
  const articles = (data.wikiArticles || []).map(a => a.id === articleId ? { ...a, views: (a.views || 0) + 1 } : a);
  saveAdminData({ ...data, wikiArticles: articles });

  try {
    sessionStorage.setItem(WIKI_SEEN_KEY, JSON.stringify([...seen, articleId]));
  } catch {
    // Storage disabled — the view still counted, it just is not de-duplicated.
  }
}

function wikiSearchArticles(articles, categories, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const catLabel = (id) => categories.find(c => c.id === id)?.label || "";
  return articles.filter(a =>
    a.title.toLowerCase().includes(q) ||
    (a.shortDesc || "").toLowerCase().includes(q) ||
    catLabel(a.categoryId).toLowerCase().includes(q) ||
    (a.tags || []).some(t => t.toLowerCase().includes(q))
  ).slice(0, 20);
}

export {
  wikiTrackView,
  wikiSearchArticles,
};
