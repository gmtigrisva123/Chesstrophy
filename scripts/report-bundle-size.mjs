#!/usr/bin/env node
/**
 * Reports the gzipped size of the production bundle and fails when the initial
 * download crosses an agreed budget.
 *
 * "Initial" means what a first-time visitor must download before the app can
 * paint: the entry chunk, the shared vendor chunk, and the CSS. Lazily-loaded
 * route chunks are reported but not budgeted — they only cost a user who
 * actually visits that route.
 *
 * Run via `npm run analyze`, and in CI on every pull request.
 */
import { gzipSync } from "node:zlib";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = path.join(rootDir, "dist", "assets");

/** Gzipped size budget, in kilobytes, for everything needed on first paint. */
const INITIAL_BUDGET_KB = 220;

const KB = 1024;
const kb = (bytes) => (bytes / KB).toFixed(1);

function gzippedSize(filePath) {
  return gzipSync(readFileSync(filePath), { level: 9 }).length;
}

let entries;
try {
  entries = readdirSync(assetsDir);
} catch {
  console.error(`No build output at ${path.relative(rootDir, assetsDir)}. Run \`npm run build\` first.`);
  process.exit(1);
}

const files = entries
  .filter((name) => /\.(js|css)$/.test(name) && !name.endsWith(".map"))
  .map((name) => {
    const full = path.join(assetsDir, name);
    return { name, raw: statSync(full).size, gzip: gzippedSize(full) };
  })
  .sort((a, b) => b.gzip - a.gzip);

// Vite names the entry chunk `index-<hash>` and our manual vendor chunk
// `react-vendor-<hash>`; everything else is a lazily-loaded route or asset.
const isInitial = (name) => /^(index|react-vendor)-/.test(name);
const initial = files.filter((f) => isInitial(f.name));
const lazy = files.filter((f) => !isInitial(f.name));

const total = (list) => list.reduce((sum, f) => sum + f.gzip, 0);
const initialGzip = total(initial);

const row = (f) => `  ${f.name.padEnd(42)} ${kb(f.raw).padStart(9)} kB  ${kb(f.gzip).padStart(9)} kB gzip`;

console.log("\nInitial download (entry + vendor + CSS)");
initial.forEach((f) => console.log(row(f)));
console.log(`  ${"—".repeat(42)} ${"".padStart(9)}      ${kb(initialGzip).padStart(9)} kB gzip total`);

if (lazy.length) {
  console.log("\nLazily loaded on navigation");
  lazy.forEach((f) => console.log(row(f)));
}

const budgetBytes = INITIAL_BUDGET_KB * KB;
const usedPct = Math.round((initialGzip / budgetBytes) * 100);
console.log(`\nBudget: ${kb(initialGzip)} kB / ${INITIAL_BUDGET_KB} kB gzip (${usedPct}% used)`);

if (initialGzip > budgetBytes) {
  console.error(
    `\n✗ Initial bundle is over budget by ${kb(initialGzip - budgetBytes)} kB gzip.\n` +
      "  Either lazy-load more of the entry chunk, or raise INITIAL_BUDGET_KB in\n" +
      "  scripts/report-bundle-size.mjs with a note explaining why.",
  );
  process.exit(1);
}

console.log("✓ Within budget.\n");
