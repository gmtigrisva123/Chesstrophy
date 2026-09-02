// ── OPENING LEARNING PATH ─────────────────────────────────────────────────
// The staged journey every opening follows. Built entirely on the existing
// OPENING_REPERTOIRE fields (no invented chess content) and the existing
// progress/academy stores — a stage's "done" state is either a real signal
// already tracked elsewhere (variation SR status, practice accuracy) or an
// explicit "Mark as learned" for read-only stages, saved via the same
// loadAcademyState/saveAcademyState checkpoint store OpeningAcademyView
// already uses for its concept checkpoints (namespaced per opening+stage so
// the two never collide).
const LEARNING_STAGES = [
  { id: "foundations", label: "Foundations",             icon: "🌱" },
  { id: "concepts",    label: "Concepts",                 icon: "🧠" },
  { id: "variations",  label: "Main Lines & Variations",  icon: "♟️" },
  { id: "plans",       label: "Plans & Ideas",            icon: "🗺️" },
  { id: "positions",   label: "Typical Positions",        icon: "📍" },
  { id: "tactics",     label: "Tactical Patterns",        icon: "⚡" },
  { id: "practice",    label: "Practice",                 icon: "🎯" },
  { id: "test",        label: "Mastery Test",             icon: "🏆" },
];

export {
  LEARNING_STAGES,
};
