# Contributing to ChessProphy

Thanks for being here. This document covers everything from a first clone to a
merged pull request. If something in it is wrong or unclear, that is a bug —
please open an issue.

## Table of contents

- [Code of Conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Project layout](#project-layout)
- [Making a change](#making-a-change)
- [Commit messages](#commit-messages)
- [Testing](#testing)
- [Opening a pull request](#opening-a-pull-request)
- [Review](#review)
- [Release process](#release-process)
- [Getting help](#getting-help)

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Taking part
means agreeing to uphold it.

## Ways to contribute

You do not need to write code to help.

- **Report a bug.** Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml).
  Reproduction steps are the single most valuable part.
- **Report an accessibility barrier.** There is a
  [dedicated template](.github/ISSUE_TEMPLATE/accessibility.yml). These are
  treated as bugs, not enhancements.
- **Suggest a feature.** Describe the problem before the solution.
- **Improve the docs.** If something confused you, it will confuse the next person.
- **Fix a bug.** Issues labelled `good first issue` are scoped to be self-contained.

For anything larger than a bug fix, open an issue first. It is much cheaper to
agree on the approach before the code exists.

## Development setup

**Prerequisites:** Node.js ≥ 20.19 (see [`.nvmrc`](.nvmrc)) and npm ≥ 10.

```bash
git clone https://github.com/gmtigrisva123/Chesstrophy.git
cd Chesstrophy
npm install
npm run dev
```

`npm install` also installs the Git hooks:

| Hook         | What it runs                                    |
| ------------ | ----------------------------------------------- |
| `pre-commit` | ESLint and Prettier on staged files only. Fast. |
| `pre-push`   | Lint, type check and the full test suite.       |

If a hook blocks you mid-investigation, `--no-verify` skips it. CI runs the same
checks, so anything you skip locally will surface there instead.

### Editor setup

VS Code users get the recommended extensions and workspace settings from
[`.vscode/`](.vscode/) automatically — format-on-save and ESLint auto-fix are
already configured. For other editors,
[`.editorconfig`](.editorconfig) covers indentation, line endings and final
newlines.

## Project layout

Read [`ARCHITECTURE.md`](ARCHITECTURE.md) before your first change. The one rule
that matters most:

```
features → components → hooks → services → data → lib → theme/assets
```

Imports flow **down** this stack only. `import/no-cycle` fails CI if you create a
loop, and a cross-feature import needs a justification in the pull request.

Where does new code go?

| If it is…                                    | It belongs in…         |
| -------------------------------------------- | ---------------------- |
| A whole screen                               | `src/features/<name>/` |
| UI reused by more than one feature           | `src/components/`      |
| A pure function with no React and no storage | `src/lib/`             |
| Reading or writing persistent state          | `src/services/`        |
| Fixed content that never changes at runtime  | `src/data/`            |
| Shared stateful React logic                  | `src/hooks/`           |

## Making a change

### 1. Branch

Branch from `main`, named `<type>/<short-description>`:

```bash
git switch -c fix/puzzle-board-stale-position
```

Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`, `ci`.

### 2. Write the code

House rules that reviewers will check, and why each one exists:

**Never define a component inside another component's render.**

```jsx
// ✗ New component type on every render — React destroys and rebuilds the
//   subtree, losing DOM state. This is what made an input lose focus after
//   every keystroke.
function Page({ dark }) {
  const Card = ({ children }) => <div style={{ background: dark ? "#111" : "#fff" }}>{children}</div>;
  return <Card>…</Card>;
}

// ✓ Module scope. Stable type, subtree survives re-renders.
function Card({ children, background }) {
  return <div style={{ background }}>{children}</div>;
}
```

**Call every hook before any early return.**

```jsx
// ✗ The hook count changes when `canPost` flips — React throws
//   "Rendered more hooks than during the previous render".
function Form({ canPost }) {
  if (!canPost) return <Denied />;
  const [title, setTitle] = useState("");
}

// ✓ Split the gate from the thing being gated.
function Form({ canPost }) {
  return canPost ? <Editor /> : <Denied />;
}
```

**Use stable keys.** Array indices are fine for a list that never reorders or
filters. Anywhere else they cause React to reuse the wrong DOM node.

**Keep `lib/` pure.** No React, no storage, no `window` beyond feature detection.
This is what makes it testable without a DOM.

**Document exported functions with JSDoc.** Once a module's annotations are
complete, add `// @ts-check` at the top so `npm run typecheck` starts enforcing
them. That ratchet only tightens.

**Write the comment that explains _why_.** The code already says what it does. A
comment earns its place by recording the constraint, the trade-off, or the bug
that made the code look the way it does.

### 3. Verify

```bash
npm run verify
```

That is lint → types → tests → build, the same sequence CI runs. Individually:

```bash
npm run lint          # ESLint
npm run format:check  # Prettier on docs, configs and CSS
npm run typecheck     # TypeScript over the JSDoc
npm test              # Vitest
npm run analyze       # Build and check the bundle budget
```

**ESLint warnings are not noise.** CI runs with `--max-warnings=0`. If a rule is
genuinely wrong for a specific line, disable it inline **with a reason**:

```jsx
/* eslint-disable-next-line jsx-a11y/no-autofocus --
   Sole interactive element of this wizard step; focusing it is expected
   behaviour rather than a focus steal. */
```

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <subject>

<optional body>

<optional footer>
```

| Type       | Use it for                                      |
| ---------- | ----------------------------------------------- |
| `feat`     | A new capability.                               |
| `fix`      | A bug fix.                                      |
| `docs`     | Documentation only.                             |
| `refactor` | A change that alters neither behaviour nor API. |
| `perf`     | A change made for speed or size.                |
| `test`     | Adding or fixing tests.                         |
| `chore`    | Tooling, dependencies, housekeeping.            |
| `ci`       | Workflow and pipeline changes.                  |

The subject line is imperative and under 72 characters — "add", not "added".
The body explains **why**; the diff already shows what.

```
fix(puzzles): render the live position instead of the starting FEN

PuzzleBoard derived its own board from the `fen` prop and ignored the
`board` prop it was given. PuzzleSolver kept the live position in `board`
and never updated `fen`, so pieces never visibly moved even though the
puzzle was correctly scored as solved.

Closes #142
```

## Testing

Tests live next to the code they cover, as `*.test.js` / `*.test.jsx`.

```bash
npm test                     # once
npm run test:watch           # re-run on change
npm run test:coverage        # with a coverage report
npm test -- src/lib/chess    # a single directory
```

What to write, by layer:

| Layer         | Test                                                                                   |
| ------------- | -------------------------------------------------------------------------------------- |
| `lib/`        | Pure unit tests. Cover the edge cases — these functions are used everywhere.           |
| `services/`   | Behaviour through the public `loadX` / `saveX` API, never the storage internals.       |
| `components/` | Render and assert what a **user** perceives — text, roles, labels. Not internal state. |
| Bug fixes     | A test that fails before the fix and passes after it. Name what the bug was.           |

Use accessible queries (`getByRole`, `getByLabelText`) over test IDs. If a query
is hard to write, that is usually the component telling you it is hard to use.

[`docs/TESTING.md`](docs/TESTING.md) has more detail, including the storage stub.

## Opening a pull request

1. Rebase onto the latest `main`.
2. Run `npm run verify`.
3. Push and open the PR; the [template](.github/pull_request_template.md) will fill in.
4. Fill in **how to verify** — the exact steps a reviewer should follow.
5. Attach before/after screenshots for any visible change, in both themes.
6. Link the issue: `Closes #123`.

Keep pull requests focused. A 200-line PR doing one thing gets a careful review;
a 2,000-line PR doing five things gets a rubber stamp, which helps nobody. If you
notice unrelated problems while working, file them separately.

Draft PRs are welcome for early feedback — mark them as drafts so reviewers know
what kind of feedback you want.

## Review

What reviewers look for, roughly in order:

1. **Correctness.** Does it do what it says, including at the edges?
2. **Blast radius.** What else could this affect?
3. **Tests.** Would a regression be caught?
4. **Fit.** Does it respect the layer boundaries and the conventions above?
5. **Clarity.** Will this be readable in a year, by someone who was not here?
6. **Accessibility.** Keyboard reachable, sensible focus order, meaningful labels.

Every comment is about the code, never the person. If a review comment does not
make sense, say so — a comment you cannot act on is a failed comment.

Requesting changes is normal and is not a judgement. So is disagreeing with a
review comment, as long as the disagreement is reasoned.

## Release process

`main` is always releasable. Releases are cut by tagging:

```bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

The [release workflow](.github/workflows/release.yml) runs `npm run verify`,
packages `dist/`, and publishes a GitHub release with generated notes. Update
[`CHANGELOG.md`](CHANGELOG.md) in the same commit as the version bump.

Versions follow [Semantic Versioning](https://semver.org/).

## Getting help

- **How does X work?** → [GitHub Discussions](https://github.com/gmtigrisva123/Chesstrophy/discussions)
- **Something is broken** → [open an issue](https://github.com/gmtigrisva123/Chesstrophy/issues/new/choose)
- **Setup will not work** → [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **Security vulnerability** → [SECURITY.md](SECURITY.md), privately

Thanks for contributing.
