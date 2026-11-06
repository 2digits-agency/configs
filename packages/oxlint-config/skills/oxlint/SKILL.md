---
name: oxlint
description: Fixes for the Oxlint rules agents most often get stuck on in projects linted with @2digits/oxlint-config, including the `2digits/*` Effect rules and when a disable comment is acceptable. Use when Oxlint reports errors, before adding an `oxlint-disable` comment, and when writing Effect or Vitest code in such a project.
---

# Oxlint with `@2digits/oxlint-config`

The project's `oxlint.config.ts` calls `withTwoDigits(...)` (the package's default export). The preset turns every
rule on as `error`, fails on warnings (`denyWarnings`), fails on unused disable comments
(`reportUnusedDisableDirectives: 'deny'`) and runs type-aware rules through `oxlint-tsgolint`.

Diagnostics print the rule as `plugin(rule)`, for example `typescript(no-unnecessary-condition)`. Disable comments and
config use `plugin/rule`: `typescript/no-unnecessary-condition`, `2digits/ban-error-string`. Core ESLint rules have no
prefix in config (`func-style`, `complexity`).

## Loop

1. Run Oxlint with `--fix` through the project's fix script, or `oxlint --fix <files>`. One pass does not apply every
   fix: run it again until the problem count stops falling.
2. Run Oxlint with `-f unix` to get one line per diagnostic, and fix the rest by hand with the patterns below.
3. Re-run lint after each fix. Fixes here often trip a neighbouring rule (a new `describe` title trips
   `vitest/prefer-lowercase-title`, a removed `return;` trips TS7030, a moved `null` trips an unused directive).

Done means Oxlint reports `Found 0 warnings and 0 errors` and the project's type check still passes.

Fix the code, not the lint: leave the shared rules, their severities and the generated or declared types as they
are, and keep `any`, `!` and new `as` casts out of a fix. Rewrites with `sed` or regex hit comments and globals
(`\bNumber\.` turned `globalThis.Number` into `globalThis.Num`); prefer `--fix` and re-read the diff.

## Disable comments

A disable is acceptable only when the code must break the rule for a contract outside the code: a SQL or JSON `null`,
a third-party signature, a tool limitation. It is not a fix for a type mismatch, a long function or an awkward test.

```ts
// oxlint-disable-next-line unicorn/no-null -- D1 `.bind()` has no `undefined`; SQL NULL needs `null`.
```

- Put it directly above the line that holds the reported column. `-next-line` covers one physical line: when a refactor
  or the formatter splits the statement, move the comment to the line that now holds the node, or lint reports both the
  rule and `Unused oxlint-disable directive`.
- Name the full rule with its plugin and give a `-- reason`. Prefer `-next-line` over a file-level `/* oxlint-disable */`.
- When you delete the code that needed a disable, delete the comment too, including its entry in a file-level list.
- `eslint-disable` comments work the same way; leave existing ones as they are.
- To check a disable is still needed, remove it and re-lint: the rule must fire.

## Rules

### `2digits/padding-line-between-statements`

Every statement needs a blank line before it, including consecutive `const`s, `expect`s and `yield*`s; only consecutive
imports and consecutive `case` clauses may stay grouped. `--fix` adds them and keeps grouped empty `case`s adjacent.

A project override of this rule replaces the default entry as a whole. Keep
`{ blankLine: 'any', prev: 'case', next: 'case' }` in it, or `--fix` separates grouped empty `case`s and
`no-fallthrough` fails.

### `typescript/no-unnecessary-condition`

The types say the value is never nullish or always truthy. Remove the `?.`, `??` or guard. Making generated or declared
types optional (`Partial<...>`, `| null`) or disabling the rule to "tolerate missing data" was rejected in review: if
runtime data can break the type, decode it at the boundary (Schema, zod) and keep the type strict.

### `unicorn/no-null`

Use `undefined`. Where a wire format needs `null` (SQL NULL, JSON `null`, a `RuleTester` `output: null`), disable on that
exact line with the reason, or produce it without a literal (`Opt.getOrNull(value)`).

### `typescript/no-import-type-side-effects`

When every specifier is a type, use `import type { X }`; `import { type X }` leaves a runtime side-effect import. Inline
`type` is only for imports that mix values and types. `--fix` rewrites it.

### `func-style`

Top-level functions are declarations. Generic arrows become generic declarations
(`function post<const Name extends string>(...)`). Inline callbacks and `const f: Handler = () => ...` with a type
annotation are allowed.

### `typescript/no-unsafe-argument`, `-assignment`, `-member-access`, `-call`, `-return`

Something upstream is `any`: an untyped `JSON.parse`, an accumulator declared as `{}`, `Array.isArray` on `unknown`, a
curried call that lost inference. Type the source (decode it, annotate the empty accumulator
`const totals: Record<string, Json> = {}`, annotate callback parameters); do not cast at the use site.

Exception: tsgolint runs no TypeScript content mappers or plugins, so an import that only `tsc` can type (a `.toml` or
other non-TS module) is an error type. Disable on that line and say so:
`// oxlint-disable-next-line typescript/no-unsafe-argument -- tsgolint runs no content mappers; tsc types this import.`

### `typescript/no-base-to-string`, `typescript/restrict-template-expressions`

`String(value)` or `${value}` on an object. Read the field you mean, or for errors keep the error as data (see
`2digits/ban-error-string` in [`effect.md`](effect.md)), and check the output stays the same for nested values.

### `complexity` (max 20)

Extract a named helper for one branch group. Splitting is the fix; a file-level disable is not.

### `no-await-in-loop`

Run independent work in parallel (`Promise.all`, `Effect.forEach(..., { concurrency })`). When order is the contract
(a parent row before its child, sequential retries), disable on that line with the reason.

### `unicorn/no-array-for-each`

Use `for...of` for arrays. The rule also flags `Effect.forEach` and `Arr.forEach`, which are correct: keep them and
disable on that line (`-- Effect.forEach, not Array#forEach`), or turn the rule off for Effect files in the project
config.

### Array rules

- `unicorn/no-array-sort` (and `2digits/prefer-effect-array-sort` in Effect files): `xs.toSorted(compare)`, or
  `Arr.sort(xs, order)` with an `Order` in Effect code. `typescript/require-array-sort-compare` needs the comparator.
- `unicorn/no-array-reduce`: a `for...of` loop with an accumulator; swapping in another `reduce` keeps failing.
- `unicorn/explicit-length-check`: `items.length === 0`, not `!items.length`. `--fix` rewrites it.

## More rules

- Effect code (files importing `effect` or `alchemy`, checked by `@2digits/oxlint-plugin`): read
  [`effect.md`](effect.md).
- Test files: read [`vitest.md`](vitest.md).
