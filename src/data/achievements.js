// ── Achievements ──────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: "first_course",   label: "Tactical Apprentice", desc: "Complete your first course",              icon: "🏆", check: econ => (econ.transactions || []).filter(t => t.type === "course_complete").length >= 1 },
  { id: "first_test_80",  label: "Sharp Mind",          desc: "Score 80%+ on a course test",              icon: "🎯", check: econ => (econ.transactions || []).some(t => t.type === "course_test_bonus") },
  { id: "streak_7",       label: "Consistent Learner",  desc: "Reach a 7-day learning streak",            icon: "🔥", check: econ => (econ.transactions || []).some(t => t.type === "streak_milestone" && t.referenceId === "streak:7") },
  { id: "coins_1000",     label: "Coin Collector",      desc: "Earn 1,000 lifetime ProphyCoins",          icon: "🪙", check: econ => (econ.lifetimeEarned || 0) >= 1000 },
  { id: "first_purchase", label: "Smart Investor",      desc: "Unlock your first premium resource",       icon: "💎", check: econ => Object.keys(econ.unlockedItems || {}).length >= 1 },
  { id: "five_courses",   label: "Well Rounded",        desc: "Complete 5 courses",                       icon: "🌟", check: econ => (econ.transactions || []).filter(t => t.type === "course_complete").length >= 5 },
];
const WEEKLY_MISSION_TEMPLATE = {
  tasks: [
    { key: "courses", label: "Complete 2 courses", target: 2,  type: "course_complete" },
    { key: "puzzles", label: "Solve 30 puzzles",   target: 30, type: "puzzle_solved"   },
    { key: "tests",   label: "Complete 1 test",    target: 1,  type: "course_test"     },
  ],
  rewardCoins: 200, rewardXP: 300,
};

export {
  ACHIEVEMENTS,
  WEEKLY_MISSION_TEMPLATE,
};
