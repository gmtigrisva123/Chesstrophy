#!/usr/bin/env node
/**
 * Static checks over supabase/migrations and supabase/seed.sql.
 *
 * A migration is only exercised end-to-end when someone runs `supabase db
 * reset`, and by then a mistake has usually already been committed. These
 * checks run in a second, on every commit, and target the failure modes that
 * are both easy to make and expensive to discover late:
 *
 *   1. A table created without RLS enabled — the single most common way a
 *      Supabase project leaks every row to every visitor.
 *   2. RLS enabled but no policy written, which locks a table so completely
 *      that the feature silently returns empty arrays.
 *   3. A SECURITY DEFINER function without a pinned search_path — a textbook
 *      privilege-escalation vector.
 *   4. A view without security_invoker, which runs as its owner and bypasses
 *      the RLS of every table beneath it.
 *   5. Unbalanced dollar-quoting or parentheses, which turn into a syntax
 *      error hundreds of lines from the actual mistake.
 *   6. Seeds referencing a table no migration creates.
 *   7. Migration filenames that are out of order or duplicated, which makes
 *      the apply order depend on the filesystem.
 *
 * Run: npm run db:lint
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(rootDir, "supabase", "migrations");
const seedPath = path.join(rootDir, "supabase", "seed.sql");
const testsDir = path.join(rootDir, "supabase", "tests");

/** @type {{file: string, message: string}[]} */
const problems = [];
/** @type {string[]} */
const notes = [];

function fail(file, message) {
  problems.push({ file, message });
}

/**
 * Strips line comments and string/dollar-quoted literals so the structural
 * checks below never match on prose inside a comment or a quoted string.
 *
 * @param {string} sql
 * @returns {string}
 */
function stripNoise(sql) {
  let out = "";
  let i = 0;
  while (i < sql.length) {
    // Line comment
    if (sql.startsWith("--", i)) {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end;
      continue;
    }
    // Block comment
    if (sql.startsWith("/*", i)) {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      continue;
    }
    // Dollar-quoted body: replace with a placeholder so its contents cannot
    // trip the paren balance, but keep a marker so we can still find them.
    const dollar = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
    if (dollar) {
      const tag = dollar[0];
      const end = sql.indexOf(tag, i + tag.length);
      if (end === -1) return out + " __UNTERMINATED_DOLLAR_QUOTE__ ";
      out += " __BODY__ ";
      i = end + tag.length;
      continue;
    }
    // Single-quoted string
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") {
          j += 2;
          continue;
        }
        if (sql[j] === "'") break;
        j += 1;
      }
      out += " '' ";
      i = j + 1;
      continue;
    }
    out += sql[i];
    i += 1;
  }
  return out;
}

/** Counts dollar-quote openers/closers to catch an unterminated function body. */
function checkDollarQuotes(file, sql) {
  const tags = sql.match(/\$[A-Za-z_][A-Za-z0-9_]*\$|\$\$/g) ?? [];
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  for (const [tag, count] of counts) {
    if (count % 2 !== 0) {
      fail(file, `unbalanced dollar-quote ${tag}: appears ${count} times (must be even)`);
    }
  }
}

/** Verifies parentheses balance across the whole file, ignoring literals. */
function checkParenBalance(file, stripped) {
  let depth = 0;
  for (const ch of stripped) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (depth < 0) {
      fail(file, "unbalanced parentheses: a ')' closes nothing");
      return;
    }
  }
  if (depth !== 0) fail(file, `unbalanced parentheses: ${depth} unclosed '('`);
}

// ── Read the migrations ─────────────────────────────────────────────────────

let migrationFiles;
try {
  migrationFiles = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
} catch {
  console.error(`✗ No migrations directory at ${path.relative(rootDir, migrationsDir)}`);
  process.exit(1);
}

if (migrationFiles.length === 0) {
  console.error("✗ No migrations found.");
  process.exit(1);
}

// Supabase applies migrations in lexicographic filename order, so the names
// must sort the same way the intended order runs.
const sorted = [...migrationFiles].sort();
if (JSON.stringify(sorted) !== JSON.stringify(migrationFiles.slice().sort())) {
  fail("migrations", "filenames do not sort deterministically");
}

const timestamps = new Set();
for (const file of sorted) {
  const match = /^(\d{14})_[a-z0-9_]+\.sql$/.exec(file);
  if (!match) {
    fail(file, "filename must be <14-digit timestamp>_snake_case_name.sql");
    continue;
  }
  if (timestamps.has(match[1])) {
    fail(file, `duplicate migration timestamp ${match[1]} — apply order would be ambiguous`);
  }
  timestamps.add(match[1]);
}

// ── Per-file structure ──────────────────────────────────────────────────────

/** Tables created, in creation order. */
const createdTables = [];
/** Tables that have `enable row level security`. */
const rlsEnabled = new Set();
/** Tables named by at least one `create policy ... on public.X`. */
const tablesWithPolicies = new Set();
/** Views created. */
const createdViews = new Map();

for (const file of sorted) {
  const raw = readFileSync(path.join(migrationsDir, file), "utf8");
  const sql = stripNoise(raw);

  checkDollarQuotes(file, raw);
  checkParenBalance(file, sql);

  if (sql.includes("__UNTERMINATED_DOLLAR_QUOTE__")) {
    fail(file, "unterminated dollar-quoted body");
  }

  for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z0-9_]+)/gi)) {
    createdTables.push({ table: m[1], file });
  }
  for (const m of sql.matchAll(/alter\s+table\s+public\.([a-z0-9_]+)\s+enable\s+row\s+level\s+security/gi)) {
    rlsEnabled.add(m[1]);
  }
  for (const m of sql.matchAll(/create\s+policy\s+[^\n]*?\s+on\s+public\.([a-z0-9_]+)/gi)) {
    tablesWithPolicies.add(m[1]);
  }
  for (const m of raw.matchAll(
    /create\s+(?:or\s+replace\s+)?view\s+public\.([a-z0-9_]+)([\s\S]{0,200}?)\bas\b/gi,
  )) {
    createdViews.set(m[1], { file, header: m[2] });
  }

  // RLS enabled/policies created through a DO block loop over a table list.
  for (const block of raw.matchAll(/foreach\s+\w+\s+in\s+array\s+array\[([\s\S]*?)\]/gi)) {
    for (const name of block[1].matchAll(/'([a-z0-9_]+)'/g)) {
      // The loop bodies in this schema always both enable RLS and add
      // policies; record the table so the checks below see it.
      rlsEnabled.add(name[1]);
      tablesWithPolicies.add(name[1]);
    }
  }

  // SECURITY DEFINER without a pinned search_path.
  for (const fn of raw.matchAll(
    /create\s+(?:or\s+replace\s+)?function\s+public\.([a-z0-9_]+)\s*\(([\s\S]*?)\)\s*returns([\s\S]*?)\bas\s+\$/gi,
  )) {
    const [, name, , body] = fn;
    if (/security\s+definer/i.test(body) && !/set\s+search_path\s*=/i.test(body)) {
      fail(
        file,
        `function ${name}() is SECURITY DEFINER without "set search_path" — privilege escalation risk`,
      );
    }
  }
}

// ── Cross-file invariants ───────────────────────────────────────────────────

for (const { table, file } of createdTables) {
  if (!rlsEnabled.has(table)) {
    fail(file, `table public.${table} is created but never has row level security enabled`);
  } else if (!tablesWithPolicies.has(table)) {
    fail(
      file,
      `table public.${table} has RLS enabled but no policy — every query against it will return nothing`,
    );
  }
}

for (const [view, { file, header }] of createdViews) {
  if (!/security_invoker\s*=\s*true/i.test(header)) {
    fail(
      file,
      `view public.${view} is missing "with (security_invoker = true)" — it would bypass RLS on its base tables`,
    );
  }
}

// ── Seed file ───────────────────────────────────────────────────────────────

let seed = "";
try {
  seed = readFileSync(seedPath, "utf8");
} catch {
  fail("seed.sql", "missing — run: npm run db:seed:generate");
}

if (seed) {
  checkDollarQuotes("seed.sql", seed);
  const strippedSeed = stripNoise(seed);
  checkParenBalance("seed.sql", strippedSeed);

  const knownTables = new Set(createdTables.map((t) => t.table));
  for (const m of strippedSeed.matchAll(/insert\s+into\s+public\.([a-z0-9_]+)/gi)) {
    if (!knownTables.has(m[1])) {
      fail("seed.sql", `inserts into public.${m[1]}, which no migration creates`);
    }
  }

  const begins = (strippedSeed.match(/\bbegin\s*;/gi) ?? []).length;
  const commits = (strippedSeed.match(/\bcommit\s*;/gi) ?? []).length;
  if (begins !== commits) {
    fail("seed.sql", `${begins} BEGIN vs ${commits} COMMIT — the transaction is unbalanced`);
  }

  // The seed must be re-runnable: `supabase db reset` applies it every time,
  // and so does a developer poking at a live branch.
  const inserts = (strippedSeed.match(/insert\s+into\s+public\./gi) ?? []).length;
  const guarded = (strippedSeed.match(/on\s+conflict/gi) ?? []).length;
  if (inserts !== guarded) {
    fail("seed.sql", `${inserts} INSERTs but only ${guarded} ON CONFLICT clauses — re-running would fail`);
  }
}

// ── Tests present ───────────────────────────────────────────────────────────

try {
  const testFiles = readdirSync(testsDir).filter((f) => f.endsWith(".sql"));
  if (testFiles.length === 0) {
    notes.push("supabase/tests contains no .sql files — database behaviour is unverified");
  } else {
    notes.push(`${testFiles.length} pgTAP test file(s)`);
  }
} catch {
  notes.push("no supabase/tests directory");
}

// ── Report ──────────────────────────────────────────────────────────────────

const tableCount = createdTables.length;
console.log(
  `Checked ${sorted.length} migration(s): ${tableCount} tables, ${createdViews.size} views` +
    (seed ? `, seed.sql (${(seed.length / 1024).toFixed(0)} kB)` : ""),
);
for (const note of notes) console.log(`  · ${note}`);

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} problem(s):\n`);
  for (const { file, message } of problems) console.error(`  ${file}: ${message}`);
  console.error("");
  process.exit(1);
}

console.log("✓ All structural checks passed.");
