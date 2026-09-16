import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";

/**
 * Flat ESLint configuration for ChessProphy.
 *
 * Layered on purpose:
 *   1. Global ignores.
 *   2. Application source (browser globals, React rules).
 *   3. Tests (Vitest globals, relaxed rules).
 *   4. Tooling/config files (Node globals).
 *   5. `eslint-config-prettier` last, so formatting is Prettier's job alone.
 */
export default [
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "legacy/**",
      "**/*.min.js",
      // Nested worktrees created by agent tooling (Kilo, Claude Code) are full
      // checkouts of this repo. Linting them double-counts every file, and the
      // path-anchored blocks below (`scripts/**`, `src/**`) do not match the
      // nested copies, so they fall through with no globals and fail the hook.
      ".kilo/**",
      ".claude/worktrees/**",
    ],
  },

  js.configs.recommended,

  // ── Application source ──────────────────────────────────────────────────────
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.browser,
        // Injected by the artifact host; see src/platform/storageAdapter.js.
        storage: "readonly",
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        node: { extensions: [".js", ".jsx"] },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // ── Correctness ───────────────────────────────────────────────────────
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "warn",
      eqeqeq: ["error", "smart"],
      "no-implicit-coercion": ["warn", { boolean: false }],
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": ["warn", "properties"],

      // ── React ─────────────────────────────────────────────────────────────
      "react/prop-types": "off", // Props are documented via JSDoc, not runtime checks.
      "react/jsx-key": ["error", { checkFragmentShorthand: true }],
      // Off deliberately. Every list this rule flags in this codebase renders a
      // fixed, never-reordered sequence — SVG grid lines and chart points,
      // skeleton placeholders, quiz options, bullet lists from static content —
      // where the index *is* the stable identity. All 39 hits were false
      // positives, and a rule that only ever cries wolf trains people to ignore
      // the linter. The judgement call it encodes is documented for humans in
      // docs/STYLE_GUIDE.md#keys instead; use a real identifier for anything
      // that can be filtered, sorted or reordered.
      "react/no-array-index-key": "off",
      "react/jsx-no-target-blank": ["error", { allowReferrer: false }],
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
      "react/self-closing-comp": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // ── Module graph ──────────────────────────────────────────────────────
      // The dependency direction documented in ARCHITECTURE.md is acyclic; keep it that way.
      "import/no-cycle": ["error", { maxDepth: 8, ignoreExternal: true }],
      "import/no-self-import": "error",
      "import/no-duplicates": "error",
      "import/order": [
        "warn",
        {
          groups: [["builtin", "external"], "internal", ["parent", "sibling", "index"]],
          "newlines-between": "never",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      // ── Accessibility: pragmatic subset ───────────────────────────────────
      // The UI is built from styled <div>/<button> primitives rather than a
      // component library; these two fire constantly on decorative markup.
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/click-events-have-key-events": "off",
    },
  },

  // ── Tests ───────────────────────────────────────────────────────────────────
  {
    files: ["**/*.test.{js,jsx}", "tests/**/*.{js,jsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-console": "off",
      "react/no-array-index-key": "off",
    },
  },

  // ── Tooling / config files ──────────────────────────────────────────────────
  {
    files: ["*.config.{js,mjs}", "scripts/**/*.{js,mjs}", "tests/**/*.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
    },
  },

  prettier,
];
