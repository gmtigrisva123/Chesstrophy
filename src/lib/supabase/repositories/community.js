// ── COMMUNITY REPOSITORY ──────────────────────────────────────────────────────
// ChessFlix posts, submitted games and de-duplicated view counting.
//
// Note what is absent: there is no `canPost()` check here. Posting rights are
// enforced by the RLS policy on `chessflix_posts`, so a client that skips the
// UI gate still gets refused. The `canPostChessFlix()` helper below exists only
// so the interface can hide an affordance the user cannot use — it is never the
// thing that protects the table.

import { getSupabaseClient } from "../client.js";
import { unwrap } from "../errors.js";

/**
 * Whether the signed-in user may post. Advisory only — the database decides.
 * @returns {Promise<boolean>}
 */
async function canPostChessFlix() {
  const supabase = await getSupabaseClient();
  return Boolean(unwrap("check posting permission", await supabase.rpc("can_post_chessflix")));
}

/**
 * Published ChessFlix posts, newest first.
 * @param {{page?: number, pageSize?: number, category?: string}} [options]
 */
async function fetchChessFlixPosts({ page = 0, pageSize = 24, category } = {}) {
  const supabase = await getSupabaseClient();
  let query = supabase
    .from("chessflix_posts")
    .select("*, profiles!chessflix_posts_creator_id_fkey ( username, avatar )")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (category) query = query.eq("category", category);

  return unwrap("load chessflix posts", await query) ?? [];
}

/**
 * Submits a post. It lands as `pending`: the insert policy pins the status, so
 * nothing can self-publish.
 *
 * @param {{title: string, description: string, mediaType: "video"|"image",
 *   mediaUrl: string, category?: string, thumbnailUrl?: string}} post
 * @returns {Promise<Record<string, any>>}
 */
async function createChessFlixPost(post) {
  const supabase = await getSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  return unwrap(
    "create chessflix post",
    await supabase
      .from("chessflix_posts")
      .insert({
        creator_id: user?.user?.id,
        title: post.title,
        description: post.description,
        media_type: post.mediaType,
        media_url: post.mediaUrl,
        thumbnail_url: post.thumbnailUrl ?? null,
        category: post.category ?? null,
        status: "pending",
      })
      .select()
      .single(),
  );
}

/**
 * Records a view. Counting is a database trigger keyed on
 * `(user, kind, id)`, so a refresh cannot inflate the number and the client
 * cannot set it directly.
 *
 * @param {"chessflix"|"wiki_article"} kind
 * @param {string} contentId
 */
async function recordView(kind, contentId) {
  const supabase = await getSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) return; // Signed-out visitors are not counted.

  const result = await supabase
    .from("content_views")
    .insert({ user_id: user.user.id, content_kind: kind, content_id: contentId });

  // Already viewed: exactly the outcome we want, not a failure.
  if (result.error && result.error.code === "23505") return;
  unwrap("record view", result);
}

/**
 * @param {{page?: number, pageSize?: number}} [options]
 */
async function fetchCommunityGames({ page = 0, pageSize = 24 } = {}) {
  const supabase = await getSupabaseClient();
  return unwrap(
    "load community games",
    await supabase
      .from("community_games")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1),
  ) ?? [];
}

/**
 * @param {{playerName: string, opponentName?: string, playerRating?: number,
 *   event?: string, playedOn?: string, result?: string, pgn: string,
 *   description?: string}} game
 */
async function submitCommunityGame(game) {
  const supabase = await getSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  return unwrap(
    "submit community game",
    await supabase
      .from("community_games")
      .insert({
        submitter_id: user?.user?.id,
        player_name: game.playerName,
        opponent_name: game.opponentName ?? null,
        player_rating: game.playerRating ?? null,
        event: game.event ?? null,
        played_on: game.playedOn ?? null,
        result: game.result ?? null,
        pgn: game.pgn,
        description: game.description ?? null,
      })
      .select()
      .single(),
  );
}

// ── Events ─────────────────────────────────────────────────────────────────

/** Upcoming events with a real participant count. */
async function fetchEvents() {
  const supabase = await getSupabaseClient();
  return unwrap(
    "load events",
    await supabase
      .from("events_with_counts")
      .select("*")
      .eq("status", "published")
      .order("starts_at", { ascending: true }),
  ) ?? [];
}

/**
 * RSVPs to an event. The primary key makes it idempotent.
 * @param {string} eventId
 */
async function joinEvent(eventId) {
  const supabase = await getSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  const result = await supabase
    .from("event_registrations")
    .insert({ event_id: eventId, user_id: user?.user?.id });
  if (result.error && result.error.code === "23505") return;
  unwrap("join event", result);
}

/** @returns {Promise<string[]>} Event ids the user has joined. */
async function fetchMyEventRegistrations() {
  const supabase = await getSupabaseClient();
  const rows = unwrap(
    "load event registrations",
    await supabase.from("event_registrations").select("event_id"),
  );
  return (rows ?? []).map((r) => r.event_id);
}

/** Opt-in leaderboard: only users with a public profile appear. */
async function fetchLeaderboard(limit = 50) {
  const supabase = await getSupabaseClient();
  return unwrap(
    "load leaderboard",
    await supabase.from("leaderboard").select("*").limit(limit),
  ) ?? [];
}

export {
  canPostChessFlix,
  fetchChessFlixPosts,
  createChessFlixPost,
  recordView,
  fetchCommunityGames,
  submitCommunityGame,
  fetchEvents,
  joinEvent,
  fetchMyEventRegistrations,
  fetchLeaderboard,
};
