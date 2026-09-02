// ══════════════════════════════════════════════════════════════════════════════
// ── ONBOARDING FLOW ─────────────────────────────────────────────────────────
// Shown once, right after a visitor enters the app from the LandingPage, unless
// they choose Guest (which skips straight to the Dashboard) or have already
// completed it (profile.onboardingCompleted). Data collected here is written
// onto the same local profile object everything else already reads/writes
// (see loadProfile/saveProfile) — username, chessLevel, improvementAreas[],
// dailyTrainingTime, onboardingCompleted — kept local-only for now, structured
// so it's a straight drop-in once Supabase/real auth exists.
// ══════════════════════════════════════════════════════════════════════════════
const ONBOARDING_LEVELS = [
  { id: "Beginner",     icon: "🌱", desc: "Learning the rules and basic tactics" },
  { id: "Intermediate", icon: "♟️", desc: "Comfortable with openings and tactics" },
  { id: "Advanced",     icon: "🔥", desc: "Strong tactical and positional player" },
  { id: "Expert",       icon: "🏆", desc: "Tournament-level, rated 2000+" },
];

const ONBOARDING_AREAS = [
  { id: "Tactics",   icon: "🧩" },
  { id: "Openings",  icon: "📚" },
  { id: "Strategy",  icon: "🧠" },
  { id: "Endgames",  icon: "🏁" },
  { id: "Calculation", icon: "🎯" },
  { id: "Overall Chess", icon: "♟️" },
];

const ONBOARDING_TIMES = [
  { id: "10 minutes",  icon: "⚡" },
  { id: "20 minutes",  icon: "🕐" },
  { id: "30 minutes",  icon: "🔥" },
  { id: "45 minutes",  icon: "💪" },
  { id: "60+ minutes", icon: "🧠" },
  { id: "It depends",  icon: "🤷" },
];

export {
  ONBOARDING_LEVELS,
  ONBOARDING_AREAS,
  ONBOARDING_TIMES,
};
