# ADR 006: Supabase as an optional, additive backend

- **Status:** Accepted
- **Date:** 2026-08-25

## Context

The app has been entirely client-side. That is a genuine feature — it loads
fast, works offline, and has no operational cost — but three limitations follow
from it, and only one of them is cosmetic.

**Rewards can be farmed.** `grantReward()` enforces "this pays out once" with a
JavaScript check against a `completedRewards` map in `localStorage`. A user with
DevTools open can delete a key and re-claim, or set their balance directly.
Every anti-farming property the economy claims is advisory.

**Progress is trapped in one browser.** Clearing site data destroys everything.
Studying on a laptop and continuing on a phone is impossible.

**"Community" is single-player.** ChessFlix posting rights are checked in the
UI, event registrations live in one person's profile object, and participant
counts are literals in `src/data/`.

The first is a correctness problem, not a feature gap: the rules the product
states are not the rules it enforces.

## Decision

We add Supabase as an **optional, additive** backend.

- `supabase/` holds the schema: migrations, row level security, server-side
  rules, generated seed data, and pgTAP tests.
- `src/lib/supabase/` holds the client: a lazily-loaded SDK, auth wrapper, and
  repositories that return the shapes `src/data/` already exports.
- `src/services/contentSource.js` is the seam. It picks local or remote, and
  falls back to bundled content when a remote read fails or comes back empty.

**Optional is load-bearing, not a hedge.** With no `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY`:

- every code path resolves to the existing local behaviour,
- no network call is made, and
- the SDK is never downloaded, because `client.js` reaches it through a dynamic
  `import()`.

Anything carrying a _rule_ moves into the database as an RPC: `grant_reward`,
`spend_coins`, `record_puzzle_attempt`, `record_variation_attempt`. The client
reports what happened; the server decides what it is worth.

## Alternatives considered

| Option                             | Why not                                                                                                                                                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stay fully client-side**         | Leaves the economy unenforceable and progress non-portable. Fine for a demo, not for a product that shows people a balance.                                                                                                             |
| **Replace local storage outright** | A single large migration touching every screen, with no way to ship it incrementally and no fallback when the backend is down. The additive seam lets features move one at a time.                                                      |
| **Firebase**                       | Comparable convenience, but the security model is a rules DSL rather than SQL. Postgres row level security is testable with the same tools as the rest of the schema, and pgTAP lets us assert isolation from the client's actual role. |
| **A bespoke Node/Postgres API**    | More control, and an ongoing operational burden — auth, sessions, migrations, hosting — for a project whose whole appeal is that it has none.                                                                                           |
| **PocketBase / self-hosted**       | Same objection: someone has to run it.                                                                                                                                                                                                  |

## Consequences

### What this makes easier

- The economy's guarantees become real: a `UNIQUE` index on an append-only
  ledger cannot be edited from DevTools, and balances are written by a trigger
  rather than by a client.
- Progress follows the user across devices.
- The permission checks documented as a known limitation move into RLS
  policies, so bypassing the UI does not bypass the rule.
- Guests get a real anonymous user, so "Continue as Guest" produces data that
  can later be upgraded to a full account with the same user id.
- The catalogue becomes editable without a deploy.

### What this makes harder

- Two persistence paths exist, and both must keep working. Anything asserted in
  both places — the XP curve most obviously — can drift; `level_from_xp()` is
  pinned to the client's boundaries by a pgTAP test for exactly that reason.
- Features that adopt the backend become asynchronous. `contentSource.js` is
  async even in local mode so this cost is paid once, not twice.
- Running the full test suite now wants Docker. The static SQL linter exists so
  the common mistakes are still caught in a second, without it.

### What we accept

The migration is deliberately incomplete. The schema, the client layer and the
tests are all in place, but no feature screen has been switched over yet.
Migrating them is a one-line import change each, and doing it per feature —
with the local path as the fallback until each is proven — is safer than one
sweeping commit. `ARCHITECTURE.md` records this as a known limitation rather
than implying the backend is live.

## When to revisit

- If the local path stops being exercised in practice, delete it rather than
  maintaining two implementations of every read.
- If the schema outgrows what row level security can express cleanly — complex
  multi-tenant sharing, say — an application server in front of Postgres
  becomes worth its cost.
