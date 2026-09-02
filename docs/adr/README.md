# Architecture Decision Records

An ADR captures a decision that was hard to make and would be expensive to
reverse, together with the context that made it the right call at the time.

The point is not the decision — that is visible in the code. The point is the
**reasoning**, so that whoever revisits it in a year knows what was considered,
what was rejected, and what would have to change for the answer to be different.

## When to write one

Write an ADR when a choice:

- Constrains how future code has to be written, or
- Was contested, or genuinely close, or
- Would be expensive to undo, or
- Will look wrong to a newcomer without the context.

Do **not** write one for a decision that is obvious from the code, or one you
would happily reverse in an afternoon.

## Format

Copy [`000-template.md`](000-template.md), number it sequentially, and open it in
the same pull request as the change it describes.

Status is one of:

| Status         | Meaning                                              |
| -------------- | ---------------------------------------------------- |
| **Proposed**   | Under discussion.                                    |
| **Accepted**   | In force.                                            |
| **Superseded** | Replaced — link forward to the ADR that replaced it. |
| **Deprecated** | No longer applies, and nothing replaced it.          |

Accepted ADRs are **not edited** when the decision changes. Write a new one that
supersedes the old one; the history is the value.

## Index

| #                                        | Title                                                     | Status   |
| ---------------------------------------- | --------------------------------------------------------- | -------- |
| [001](001-layered-module-structure.md)   | Layered module structure with a one-way dependency rule   | Accepted |
| [002](002-synchronous-storage-bridge.md) | Synchronous storage facade over an async host API         | Accepted |
| [003](003-no-router-library.md)          | Switch-based navigation instead of a router library       | Accepted |
| [004](004-inline-styles.md)              | Keep inline styles, add CSS custom properties for theming | Accepted |
| [005](005-opt-in-type-checking.md)       | Opt-in type checking with `// @ts-check`                  | Accepted |
| [006](006-optional-supabase-backend.md)  | Supabase as an optional, additive backend                 | Accepted |
