import { loadAdminData } from "./adminData.js";
import { STUDIES_DATA } from "../data/studies.js";
import { readJson, writeJson } from "../lib/storage/jsonStore.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── COURSE VIEWER (reusable Learn / Cheat Sheet / Practice experience) ────────
// Every course in the Study Library — authored (STUDIES_DATA) or admin-added —
// opens through this one component. It reads course.content when present and
// falls back to sensible generated content otherwise, so new courses work
// automatically with zero extra wiring.
// ══════════════════════════════════════════════════════════════════════════════

const CP_KEY = "chessprophy_course_progress";
function loadCourseProgress() { return readJson(CP_KEY, () => ({})); }
function saveCourseProgress(p) { writeJson(CP_KEY, p); }
function getCourseState(courseId) {
  const all = loadCourseProgress();
  return all[courseId] || { lastTab: "learn", chapterIndex: 0, furthest: 0, checklist: {}, quiz: {} };
}
function patchCourseState(courseId, patch) {
  const all = loadCourseProgress();
  const cur = all[courseId] || { lastTab: "learn", chapterIndex: 0, furthest: 0, checklist: {}, quiz: {} };
  const next = { ...cur, ...patch, updatedAt: new Date().toISOString() };
  all[courseId] = next;
  saveCourseProgress(all);
  return next;
}

// Finds whichever course the user most recently made progress in, across both
// authored (STUDIES_DATA) and admin-added courses — powers the dashboard's
// "Continue Learning" card without duplicating course storage.
function getMostRecentCourse() {
  const all = loadCourseProgress();
  const entries = Object.entries(all).filter(([, s]) => s.updatedAt);
  if (entries.length === 0) return null;
  entries.sort((a, b) => new Date(b[1].updatedAt) - new Date(a[1].updatedAt));
  const [courseId, state] = entries[0];

  let course = null;
  for (const cat of STUDIES_DATA) {
    const found = cat.items.find(i => i.id === courseId);
    if (found) { course = { ...found, category: cat.category, color: cat.color }; break; }
  }
  if (!course) {
    const adminCourses = loadAdminData().courses || [];
    course = adminCourses.find(c => c.id === courseId) || null;
  }
  if (!course) return null;

  const content = getCourseContent(course);
  const chapterCount = content.chapters?.length || 1;
  const pct = Math.round(((Math.min(state.furthest || 0, chapterCount - 1) + 1) / chapterCount) * 100);
  return { course, pct: Math.min(100, pct) };
}

function getCourseContent(course) {
  if (course.content) return course.content;
  // Generic fallback for courses without authored content (e.g. freshly added
  // admin studies) — keeps the three-tab structure working for every course.
  return {
    chapters: [
      { title: "Overview", body: [
          course.desc || `This course covers the key ideas behind ${course.title}.`,
          "Work through this material at your own pace, then move to the Cheat Sheet for a quick recap and Practice to put it into action.",
        ] },
    ],
    cheatSheet: {
      concepts: [course.title, course.category || "Chess Fundamentals"],
      rules: ["Review the Learn tab before jumping to Practice.", "Come back here for a 5-minute refresher any time."],
      mistakes: ["Skipping straight to practice without reviewing the fundamentals first."],
      tricks: ["Revisit this page before a tournament for a quick refresher."],
    },
    practice: {
      tasks: [`Solve puzzles related to ${course.title}.`, "Apply this concept in your next practice game."],
      puzzleTags: [course.category || "Tactics"],
      quiz: [],
      checklist: ["Solve 15 puzzles", "Play one practice game", "Review the cheat sheet"],
    },
  };
}

export {
  CP_KEY,
  loadCourseProgress,
  saveCourseProgress,
  getCourseState,
  patchCourseState,
  getMostRecentCourse,
  getCourseContent,
};
