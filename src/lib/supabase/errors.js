// ── SUPABASE ERROR HANDLING ───────────────────────────────────────────────────
// PostgREST reports failures as a `{ data, error }` pair rather than throwing.
// Ignoring `error` is the most common bug in Supabase client code: the query
// "succeeds" with `data === null`, and the UI renders an empty state that looks
// like "you have no progress" rather than "something is broken".
//
// Every repository call in this directory goes through `unwrap()`.

/** Postgres error codes worth naming, so call sites can branch on intent. */
const PG_ERROR = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  CHECK_VIOLATION: "23514",
  INSUFFICIENT_PRIVILEGE: "42501",
};

/**
 * An error from the database, carrying enough context to be actionable in a
 * log without leaking row contents.
 */
class SupabaseError extends Error {
  /**
   * @param {string} operation - What was being attempted, e.g. "load openings".
   * @param {{message?: string, code?: string, details?: string, hint?: string}} cause
   */
  constructor(operation, cause) {
    super(`${operation} failed: ${cause?.message ?? "unknown error"}`);
    this.name = "SupabaseError";
    this.operation = operation;
    this.code = cause?.code;
    this.details = cause?.details;
    this.hint = cause?.hint;
  }

  /** True when the row already existed — usually a benign replay, not a failure. */
  get isDuplicate() {
    return this.code === PG_ERROR.UNIQUE_VIOLATION;
  }

  /** True when RLS refused the operation. Almost always a policy bug or a signed-out user. */
  get isForbidden() {
    return this.code === PG_ERROR.INSUFFICIENT_PRIVILEGE;
  }
}

/**
 * Unwraps a PostgREST result, raising on error.
 *
 * @template T
 * @param {string} operation - Human description used in the error message.
 * @param {{data: T, error: unknown}} result
 * @returns {T}
 */
function unwrap(operation, result) {
  if (result?.error) throw new SupabaseError(operation, result.error);
  return result?.data;
}

/**
 * Unwraps a result but treats "no rows" as `null` rather than an error, for the
 * common "load my X, which may not exist yet" read.
 *
 * @template T
 * @param {string} operation
 * @param {{data: T, error: unknown}} result
 * @returns {T | null}
 */
function unwrapMaybe(operation, result) {
  // PGRST116 is PostgREST's "expected one row, found none" from .single().
  if (result?.error && result.error.code === "PGRST116") return null;
  return unwrap(operation, result);
}

export { PG_ERROR, SupabaseError, unwrap, unwrapMaybe };
