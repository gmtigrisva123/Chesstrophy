# Roadmap

What is planned, what is deliberately not, and where the known gaps are. This is
a statement of intent rather than a commitment to dates.

## Now — correctness and foundations

The current focus is making the existing surface solid rather than adding to it.

|                                                  | Why it matters                                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Keyboard-operable boards**                     | The largest accessibility gap in the app: boards respond to click and drag only, so a keyboard-only user cannot play a puzzle or a variation. |
| **Accessible board summaries**                   | A screen reader currently hears 64 images, not a position.                                                                                    |
| **Test coverage for the large feature screens**  | `LearningTreePage` and `DailyQuestionsSection` carry real logic with no tests.                                                                |
| **Contrast audit in light mode**                 | Some muted text likely falls below 4.5:1.                                                                                                     |
| **Skip link and focus management on navigation** | Keyboard users tab through the whole sidebar on every route change.                                                                           |

## Next — structure

|                                       | Why it matters                                                                                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **URL routing**                       | Navigation state is in memory today: the back button does not move between screens and no page can be linked to or bookmarked.                                                                      |
| **CSS custom properties for theming** | Every component computes colours from a `dark` prop. Moving to tokens removes prop drilling, moves style weight out of the JavaScript payload, and drops the need for `'unsafe-inline'` in the CSP. |
| **Lazy-load `src/data/`**             | ~140 kB of source ships eagerly; `openingRepertoire.js` and `studies.js` alone are 65 kB.                                                                                                           |
| **Wider `// @ts-check` adoption**     | Two modules are opted in. Each additional one is a permanent ratchet against a class of bug.                                                                                                        |
| **End-to-end tests**                  | Full journeys — onboarding through to a solved puzzle — are verified by hand. Playwright is the intended tool.                                                                                      |

## Later — product

|                                                    | Notes                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Adopt the Supabase backend, feature by feature** | The schema and client layer are built (see [supabase/README.md](../supabase/README.md) and [ADR 006](adr/006-optional-supabase-backend.md)); no feature screen reads from it yet. Each migration is a one-line import change through `services/contentSource.js`, with the bundled path as the fallback until it is proven. |
| **Engine analysis**                                | A real evaluation, rather than the heuristics currently used for hints.                                                                                                                                                                                                                                                     |
| **Import your games**                              | Pull games from Chess.com or Lichess and route them into the analysis and DNA features.                                                                                                                                                                                                                                     |
| **Caption upload for ChessFlix**                   | Creator-uploaded video has no caption track today; the accessibility lint rule is suppressed with that reason.                                                                                                                                                                                                              |
| **Modern image formats**                           | WebP or AVIF with a JPEG fallback; the mascot alone is 97 kB.                                                                                                                                                                                                                                                               |
| **Lighthouse CI**                                  | The bundle budget catches size regressions but not runtime ones.                                                                                                                                                                                                                                                            |

## Deliberately not planned

Saying no is part of a roadmap.

|                                | Why not                                                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A component library**        | The inline-style approach is consistent and works. Swapping it wholesale would touch every file for no user-visible gain. Theming is being addressed through CSS custom properties instead. |
| **A state management library** | State is genuinely local, and services own persistence. Redux or Zustand would add a layer with nothing to put in it.                                                                       |
| **Server-side rendering**      | This is an authenticated-feeling learning tool, not a content site. There is no SEO or first-paint case that justifies the operational cost.                                                |
| **Real-money purchases**       | ProphyCoins are a learning incentive. Making them purchasable changes what the product is.                                                                                                  |
| **A native mobile app**        | The web app is responsive from 320 px. A wrapper would double the maintenance for a marginal gain.                                                                                          |

## Contributing to this

Any of these is open. The ones in **Now** are the most valuable and the most
likely to be reviewed quickly. Anything marked as an accessibility gap is
treated as a bug, not an enhancement.

Open an issue before starting on something in **Next** or **Later** — the
approach is worth agreeing on before the code exists. See
[CONTRIBUTING.md](../CONTRIBUTING.md).
