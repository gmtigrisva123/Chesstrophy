// ── PROGRESS REPOSITORY ───────────────────────────────────────────────────────
// Everything a signed-in learner accumulates. Reads are scoped by RLS, so none
// of these functions filter by user id — the database does it, and a bug here
// cannot expose someone else's rows.
//
// Writes that carry a *rule* (a rating change, a repetition interval, a coin
// payout) go through an RPC rather than an UPDATE, so the rule lives in one
// place and cannot be edited by the client.

import { getSupabaseClient } from "../client.js";
import { unwrap, unwrapMaybe } from "../errors.js";

// ── Profile ────────────────────────────────────────────────────────────────

/**
 * The signed-in user's profile, in the shape `loadProfile()` returns.
 * @returns {Promise<Record<string, any> | null>}
 */
async function fetchProfile() {
  const supabase = await getSupabaseClient();
  const row = unwrapMaybe(
    "load profile",
    await supabase.from("profiles").select("*").maybeSingle(),
  );
  if (!row) return null;

  return {
    username: row.username,
    displayName: row.display_name ?? "",
    bio: row.bio ?? "",
    avatar: row.avatar,
    chesscomUsername: row.chesscom_username ?? "",
    lichessUsername: row.lichess_username ?? "",
    joined: row.created_at,
    chessLevel: row.chess_level ?? "",
    improvementAreas: row.improvement_areas ?? [],
    dailyTrainingTime: row.daily_training_time ?? "",
    onboardingCompleted: row.onboarding_completed,
    isGuest: row.is_guest,
    themeMode: row.theme_mode,
    dismissedOnboarding: row.dismissed_onboarding,
    hasSeenLanding: row.has_seen_landing,
    settings: row.settings ?? {},
  };
}

/**
 * Applies a partial profile update. Only the columns present in `patch` are
 * written, so two screens editing different fields cannot clobber each other.
 *
 * @param {Record<string, any>} patch - Client-shaped fields, e.g. `{ displayName }`.
 */
async function updateProfile(patch) {
  const supabase = await getSupabaseClient();

  // Explicit mapping rather than a generic camel-to-snake helper: an unknown
  // key should be dropped here, not sent to the database to be rejected.
  const columns = {
    username: "username",
    displayName: "display_name",
    bio: "bio",
    avatar: "avatar",
    chesscomUsername: "chesscom_username",
    lichessUsername: "lichess_username",
    chessLevel: "chess_level",
    improvementAreas: "improvement_areas",
    dailyTrainingTime: "daily_training_time",
    onboardingCompleted: "onboarding_completed",
    isGuest: "is_guest",
    themeMode: "theme_mode",
    dismissedOnboarding: "dismissed_onboarding",
    hasSeenLanding: "has_seen_landing",
    settings: "settings",
  };

  const update = {};
  for (const [key, column] of Object.entries(columns)) {
    if (patch[key] !== undefined) update[column] = patch[key];
  }
  if (Object.keys(update).length === 0) return;

  const { data: user } = await supabase.auth.getUser();
  unwrap(
    "update profile",
    await supabase.from("profiles").update(update).eq("id", user?.user?.id).select().single(),
  );
}

// ── Economy ────────────────────────────────────────────────────────────────

/**
 * Balance, level and recent ledger rows.
 * @param {number} [transactionLimit]
 * @returns {Promise<Record<string, any>>}
 */
async function fetchEconomy(transactionLimit = 50) {
  const supabase = await getSupabaseClient();
  const [wallet, transactions, unlocks, achievements] = await Promise.all([
    supabase.from("wallets").select("*").maybeSingle(),
    supabase
      .from("coin_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(transactionLimit),
    supabase.from("user_unlocks").select("store_item_id"),
    supabase.from("user_achievements").select("achievement_id, unlocked_at"),
  ]);

  const w = unwrapMaybe("load wallet", wallet) ?? {
    coins: 0, xp: 0, lifetime_earned: 0, total_spent: 0,
  };

  return {
    coins: w.coins,
    xp: w.xp,
    lifetimeEarned: w.lifetime_earned,
    totalSpent: w.total_spent,
    transactions: (unwrap("load transactions", transactions) ?? []).map((t) => ({
      id: t.id,
      date: t.created_at,
      amount: t.coin_delta,
      xp: t.xp_delta,
      reason: t.reason,
      type: t.reward_type,
      referenceId: t.reference_id,
      balanceAfter: t.balance_after,
    })),
    unlockedItems: Object.fromEntries(
      (unwrap("load unlocks", unlocks) ?? []).map((u) => [u.store_item_id, true]),
    ),
    achievements: Object.fromEntries(
      (unwrap("load achievements", achievements) ?? []).map((a) => [
        a.achievement_id,
        { unlockedAt: a.unlocked_at },
      ]),
    ),
  };
}

/**
 * Grants a reward. Idempotent per `(rewardType, referenceId)` — calling it
 * twice for the same completed activity is a no-op the second time, enforced
 * by a unique index rather than by client bookkeeping.
 *
 * The caller does **not** pass an amount: the server reads it from
 * `reward_rules`, so a tampered request cannot mint coins.
 *
 * @param {string} rewardType - e.g. "course_complete".
 * @param {string} referenceId - The thing it is for, e.g. a course id.
 * @param {string} [reason] - Human-readable label for the ledger row.
 * @returns {Promise<{granted: boolean, reason?: string, coins?: number, xp?: number,
 *   balance?: number, leveledUp?: boolean, newLevel?: number, newAchievements?: string[]}>}
 */
async function grantReward(rewardType, referenceId, reason) {
  const supabase = await getSupabaseClient();
  return unwrap(
    "grant reward",
    await supabase.rpc("grant_reward", {
      p_reward_type: rewardType,
      p_reference_id: String(referenceId),
      p_reason: reason ?? null,
    }),
  );
}

/**
 * Buys a store item. Price, ownership and balance are all checked server-side.
 *
 * @param {string} storeItemId
 * @returns {Promise<{ok: boolean, error?: string, need?: number, balance?: number}>}
 */
async function purchaseStoreItem(storeItemId) {
  const supabase = await getSupabaseClient();
  return unwrap(
    "purchase store item",
    await supabase.rpc("spend_coins", { p_store_item_id: storeItemId, p_reason: null }),
  );
}

// ── Puzzles ────────────────────────────────────────────────────────────────

/**
 * Records an attempt. The Elo change is computed by the database — the client
 * reports what happened, not what it should be worth.
 *
 * @param {{puzzleId: string, solved: boolean, hintUsed?: boolean, durationMs?: number}} attempt
 * @returns {Promise<{ratingDelta: number, rating: number, streak: number, alreadySolved: boolean}>}
 */
async function recordPuzzleAttempt({ puzzleId, solved, hintUsed = false, durationMs = null }) {
  const supabase = await getSupabaseClient();
  return unwrap(
    "record puzzle attempt",
    await supabase.rpc("record_puzzle_attempt", {
      p_puzzle_id: puzzleId,
      p_solved: solved,
      p_hint_used: hintUsed,
      p_duration_ms: durationMs,
    }),
  );
}

/** @returns {Promise<Record<string, any>>} */
async function fetchPuzzleProgress() {
  const supabase = await getSupabaseClient();
  const [progress, solved] = await Promise.all([
    supabase.from("puzzle_progress").select("*").maybeSingle(),
    supabase.from("puzzle_attempts").select("puzzle_id").eq("solved", true),
  ]);

  const p = unwrapMaybe("load puzzle progress", progress) ?? {};
  return {
    puzzleRating: p.puzzle_rating ?? 1200,
    streak: p.current_streak ?? 0,
    longestStreak: p.longest_streak ?? 0,
    lastSolvedDate: p.last_solved_on ?? null,
    potdSolved: p.daily_puzzle_solved_on === new Date().toISOString().slice(0, 10),
    freeUsed: p.free_used_count ?? 0,
    solved: (unwrap("load solved puzzles", solved) ?? []).map((a) => a.puzzle_id),
  };
}

// ── Openings ───────────────────────────────────────────────────────────────

/**
 * Advances the spaced-repetition schedule for one variation. The interval
 * table lives in the database, so a client cannot shorten its own reviews.
 *
 * @param {string} variationId
 * @param {boolean} wasCorrect
 * @returns {Promise<Record<string, any>>}
 */
async function recordVariationAttempt(variationId, wasCorrect) {
  const supabase = await getSupabaseClient();
  return unwrap(
    "record variation attempt",
    await supabase.rpc("record_variation_attempt", {
      p_variation_id: variationId,
      p_was_correct: wasCorrect,
    }),
  );
}

/** Variations due for review today or earlier, oldest first. */
async function fetchDueVariations() {
  const supabase = await getSupabaseClient();
  return unwrap("load due variations", await supabase.from("due_variations").select("*")) ?? [];
}

/** Weighted mastery percentage per opening. */
async function fetchOpeningMastery() {
  const supabase = await getSupabaseClient();
  return unwrap("load opening mastery", await supabase.from("opening_mastery").select("*")) ?? [];
}

// ── Courses ────────────────────────────────────────────────────────────────

/**
 * Upserts course progress. `updated_at` is maintained by a trigger, which is
 * what "Continue Learning" orders by.
 *
 * @param {string} courseId
 * @param {Record<string, any>} patch
 */
async function saveCourseProgress(courseId, patch) {
  const supabase = await getSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  unwrap(
    "save course progress",
    await supabase.from("course_progress").upsert(
      {
        user_id: user?.user?.id,
        course_id: courseId,
        last_tab: patch.lastTab,
        chapter_index: patch.chapterIndex,
        furthest_index: patch.furthest,
        checklist: patch.checklist,
        quiz: patch.quiz,
      },
      { onConflict: "user_id,course_id" },
    ),
  );
}

/** @returns {Promise<Record<string, any>[]>} */
async function fetchCourseProgress() {
  const supabase = await getSupabaseClient();
  return unwrap(
    "load course progress",
    await supabase.from("course_progress").select("*").order("updated_at", { ascending: false }),
  ) ?? [];
}

// ── Daily questions ────────────────────────────────────────────────────────

/** Per-topic accuracy, computed by the database from the answer log. */
async function fetchTopicStats() {
  const supabase = await getSupabaseClient();
  return unwrap("load topic stats", await supabase.from("user_topic_stats").select("*")) ?? [];
}

/**
 * Records one answer. The unique constraint makes a double-submit a no-op
 * rather than a double-count.
 *
 * @param {{sessionDate: string, questionId: string, topic: string,
 *   selectedIndex: number, isCorrect: boolean, secondsTaken?: number}} answer
 */
async function recordQuestionAnswer(answer) {
  const supabase = await getSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  const result = await supabase.from("daily_question_answers").insert({
    user_id: user?.user?.id,
    session_date: answer.sessionDate,
    question_id: answer.questionId,
    topic: answer.topic,
    selected_index: answer.selectedIndex,
    is_correct: answer.isCorrect,
    seconds_taken: answer.secondsTaken ?? null,
  });
  // A replayed answer is expected, not an error.
  if (result.error && result.error.code === "23505") return;
  unwrap("record question answer", result);
}

export {
  fetchProfile,
  updateProfile,
  fetchEconomy,
  grantReward,
  purchaseStoreItem,
  recordPuzzleAttempt,
  fetchPuzzleProgress,
  recordVariationAttempt,
  fetchDueVariations,
  fetchOpeningMastery,
  saveCourseProgress,
  fetchCourseProgress,
  fetchTopicStats,
  recordQuestionAnswer,
};
