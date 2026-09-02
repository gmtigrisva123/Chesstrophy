import { describe, expect, it } from "vitest";
import { PG_ERROR, SupabaseError, unwrap, unwrapMaybe } from "./errors.js";

describe("unwrap", () => {
  it("returns the data when there is no error", () => {
    expect(unwrap("load openings", { data: [{ id: "italian" }], error: null })).toEqual([
      { id: "italian" },
    ]);
  });

  // PostgREST reports failures in the result rather than throwing, so a call
  // site that ignores `error` silently renders an empty state. This is the
  // guard against that.
  it("throws when the result carries an error", () => {
    expect(() => unwrap("load openings", { data: null, error: { message: "boom" } })).toThrow(
      SupabaseError,
    );
  });

  it("names the operation in the message", () => {
    expect(() => unwrap("load puzzles", { data: null, error: { message: "boom" } })).toThrow(
      "load puzzles failed: boom",
    );
  });

  it("carries the Postgres error code through", () => {
    try {
      unwrap("insert", { data: null, error: { message: "dup", code: PG_ERROR.UNIQUE_VIOLATION } });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error.code).toBe("23505");
      expect(error.isDuplicate).toBe(true);
      expect(error.isForbidden).toBe(false);
    }
  });

  it("flags an RLS refusal", () => {
    try {
      unwrap("update", { data: null, error: { message: "denied", code: PG_ERROR.INSUFFICIENT_PRIVILEGE } });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error.isForbidden).toBe(true);
    }
  });
});

describe("unwrapMaybe", () => {
  it("returns null for PostgREST's no-rows code instead of throwing", () => {
    expect(unwrapMaybe("load profile", { data: null, error: { code: "PGRST116" } })).toBeNull();
  });

  it("still throws for any other error", () => {
    expect(() => unwrapMaybe("load profile", { data: null, error: { code: "42501" } })).toThrow(
      SupabaseError,
    );
  });

  it("passes data through unchanged", () => {
    expect(unwrapMaybe("load profile", { data: { username: "magnus" }, error: null })).toEqual({
      username: "magnus",
    });
  });
});
