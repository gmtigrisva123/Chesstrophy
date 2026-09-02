# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅ Yes    |
| < 1.0   | ❌ No     |

Security fixes land on `main` and are released as a patch version.

## Reporting a vulnerability

**Please do not open a public issue for a security vulnerability.**

Report it privately through GitHub's
[private vulnerability reporting](https://github.com/gmtigrisva123/Chesstrophy/security/advisories/new).
That creates a draft advisory only the maintainers can see.

A useful report includes:

- What the vulnerability is, and where in the code
- Steps to reproduce it, or a proof of concept
- What an attacker could achieve with it
- Any suggested fix, if you have one in mind

### What to expect

| Stage                            | Target                 |
| -------------------------------- | ---------------------- |
| Acknowledgement of your report   | Within 3 business days |
| Initial assessment and severity  | Within 7 business days |
| Fix for a high or critical issue | Within 30 days         |
| Fix for a low or medium issue    | Next scheduled release |

We will keep you updated as the fix progresses, credit you in the advisory unless
you would rather stay anonymous, and let you know before the advisory is
published.

## Scope

ChessProphy is a fully client-side application. It has no backend, no
authentication server, and makes no network calls at runtime. That shapes what a
vulnerability means here.

**In scope:**

- Cross-site scripting through user-supplied content — ChessFlix posts, community
  game PGNs, wiki article bodies, profile fields
- Prototype pollution or injection through parsed data (FEN, PGN, stored JSON)
- Vulnerable dependencies with a realistic path to exploitation in this app
- Supply-chain issues in the build or release pipeline
- Anything that lets stored data escape the origin it belongs to

**Out of scope:**

- The absence of server-side authentication. There is no server; the ChessFlix
  permission checks are client-side by design, and
  [`ARCHITECTURE.md`](ARCHITECTURE.md) documents this as a known limitation.
- A user modifying their own `localStorage` to grant themselves ProphyCoins,
  progress or unlocks. The data is local and belongs to that user; there is no
  trust boundary to cross.
- Missing security headers on a deployment you control — configure them in your
  own hosting.
- Findings from automated scanners with no demonstrated exploit path.
- Denial of service against the user's own browser tab.

## Security practices in this repository

| Control                                      | Where                                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| Static analysis for security and quality     | [CodeQL workflow](.github/workflows/codeql.yml), weekly and on every PR            |
| Dependency advisory gate on new dependencies | [Dependency review](.github/workflows/dependency-review.yml), blocks high severity |
| Automated dependency updates                 | [Dependabot](.github/dependabot.yml), weekly, grouped                              |
| Reproducible installs                        | `npm ci` with a committed lockfile                                                 |
| Least-privilege CI                           | Every workflow declares explicit, minimal `permissions`                            |
| Secrets kept out of the repository           | Enforced by [`.gitignore`](.gitignore)                                             |
| Release gating                               | Tags run the full `verify` pipeline before publishing                              |

## Disclosure

We follow coordinated disclosure. Please give us a reasonable window to ship a
fix before publishing details. We will not take legal action against anyone who
reports in good faith and follows this policy.
