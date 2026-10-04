# padding-line-between-statements

Adapted from [anti-slop](https://github.com/dmmulroy/anti-slop/blob/main/src/vendor/eslint-stylistic/padding-line-between-statements.ts),
retrieved 2026-10-04. Its source is ESLint Stylistic commit `435c3ea0fd26a5fef9042c4b36b6e165fbbf8d08`.
The OpenJS Foundation, ESLint Stylistic and anti-slop MIT notices are retained in the published `NOTICE`.

Local changes: inline the small Oxlint AST helpers, parse user options instead of accepting a caller-owned policy,
remove non-null assertions, use repository formatting, compose selector listeners that collide with scope listeners,
skip token scanning for `any` policies, and preserve CRLF terminators when removing blank lines. Statement matchers,
scope tracking, comment-aware fixes and messages follow
the linked implementation. The rule remains opt-in and introduces no parser/runtime dependencies.

Focused RuleTester and native Oxlint CLI tests cover options, selectors, JavaScript/TypeScript scopes, comments,
semicolon-free code, exact fixes, multiple files and fix stability. These are not the full upstream compatibility suite.
