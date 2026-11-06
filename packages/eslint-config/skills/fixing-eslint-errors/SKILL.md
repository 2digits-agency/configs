---
name: fixing-eslint-errors
description: Fixes errors from @2digits/eslint-config, including its @2digits/*, ts/*, unicorn/*, sonar/*, vitest/* and react-extra/* rules. Use when ESLint or a lint task fails, or before writing an eslint-disable comment.
---

# Fixing @2digits/eslint-config errors

The config renames plugin prefixes: `ts/` is typescript-eslint (strict, type-checked), `react-extra/` is @eslint-react, `sonar/` is sonarjs, `comments/` is eslint-comments. `@2digits/` rules come from `@2digits/eslint-plugin`. Projects usually lint with `eslint . --max-warnings 0`, so a warning fails CI like an error.

## Loop

1. Run the project's lint script with `--fix` (often `lint:fix`). Many rules below autofix.
2. Lint again. Autofixes expose follow-up errors, such as `unicorn/prefer-number-is-safe-integer` after `unicorn/no-unnecessary-global-this`.
3. Fix what remains by hand, using the sections below.
4. Run the formatter. Autofix output can leave code the formatter rejects.

Done means the project's full lint command exits 0 with zero warnings. Linting only the changed files is not the same check: root configs, JSON, YAML and `tsconfig.json` are linted too.

## Type-aware rules

**`ts/no-unnecessary-condition`** means the type says the value is always present. This is the most common failure on Payload/CMS projects, because generated types make required and `group` fields non-nullable. Delete the guard:

```diff
- {button && (button.link?.url || button.link?.reference) && <PayloadButton {...button} />}
+ {(button.link?.url || button.link?.reference) && <PayloadButton {...button} />}
```

Same for `items ?? []`, `item.answer && <RichText …/>` and `value?.trim()` on a required field. Keep the generated type. When data can really be missing, change the schema or field config that produces the type; loosening the type locally (`Partial<…>`, `| null`) or disabling the rule gets rejected in review.

**`ts/no-unsafe-*` and `ts/no-redundant-type-constituents`** usually arrive as a cascade of dozens of errors from one value typed `any` or as an error type. Find the source first: most often an import that no longer resolves after a dependency upgrade moved a module. Fix that import and lint again. An Effect `Match` pipeline can also infer `any`; replace it with a plain function that has an explicit return type.

Other `ts/` rules agents hit:

| Rule                                | Fix                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `ts/no-non-null-assertion`          | Narrow with a check or throw. For an env URL, `new URL('', env.CDN)` accepts `string \| undefined`. |
| `ts/no-unnecessary-type-conversion` | Drop `String(x)` / `Number(x)` when `x` already has that type.                                      |
| `ts/await-thenable`                 | Drop `await` on a value that is not a promise.                                                      |
| `ts/no-unnecessary-type-arguments`  | Drop a type argument equal to the parameter's default: `Storage<never>` → `Storage`.                |
| `ts/no-deprecated`                  | Switch to the replacement the message names.                                                        |

A new file outside every `tsconfig.json` fails with `Parsing error: … was not found by the project service`. Add it to a tsconfig `include`, or to the ESLint `ignores` when it should not be linted.

## @2digits rules

**`@2digits/type-param-names`**: a single type parameter named `T` is fine. Every other type parameter name, including a lone `R`, must match `^[T$][A-Z][a-z]+\d*$`. Use descriptive names: `<T, R>` → `<TItem, TResult>`, `<C, I>` → `<TComplete, TIncomplete>`. `TR`, `TID` and `TU` still fail, because a lowercase letter must follow the capital. The rule's rename suggestion can produce such a name, so pick the name yourself.

**`@2digits/prefer-inline-handlers`**: a function declared in a component and passed once as a JSX prop must be written inline in that prop. This fires right after removing `useCallback` for the React Compiler. Autofixable.

```diff
- const handleClick = () => setOpen(true);
-
- return <Button onClick={handleClick} />;
+ return <Button onClick={() => setOpen(true)} />;
```

**`@2digits/prefer-inline-array-callbacks`**: `items.map(format)` → `items.map((element) => format(element))`, so the index and array arguments never reach `format`. Autofixable. `filter(Boolean)` and `map(String)` / `map(Number)` are allowed.

**`@2digits/if-curly`**: every `if` body needs braces. Autofixable.

## unicorn

| Rule                                             | Before → after                                                                                                                                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unicorn/no-null`                                | `null` → `undefined`. See the disable section when an external contract needs `null`.                                                                                         |
| `unicorn/no-array-reduce`                        | `reduce` → a `for…of` loop that pushes into a typed array, or `flatMap`.                                                                                                      |
| `unicorn/no-unreadable-for-of-expression`        | `for (const a of doc.authors \|\| [])` → hoist `const authors = doc.authors \|\| [];` first.                                                                                  |
| `unicorn/prefer-continue`                        | Body wrapped in `if (cond) { … }` → `if (!cond) { continue; }` then the body.                                                                                                 |
| `unicorn/prefer-early-return`                    | Function body wrapped in `if (isX(v)) { … }` → `if (!isX(v)) { return; }` then the body.                                                                                      |
| `unicorn/explicit-length-check`                  | `!items.length` → `items.length === 0`; `if (set.size)` → `if (set.size > 0)`. Autofixable.                                                                                   |
| `unicorn/prefer-split-limit`                     | `date.split('-')` destructured into two values → `date.split('-', 2)`. Autofixable.                                                                                           |
| `unicorn/no-unnecessary-global-this`             | `globalThis.Number(x)`, `globalThis.crypto` → `Number(x)`, `crypto`.                                                                                                          |
| `unicorn/prefer-number-is-safe-integer`          | `Number.isInteger(n)` → `Number.isSafeInteger(n)`.                                                                                                                            |
| `unicorn/prefer-global-number-constants`         | `Number.POSITIVE_INFINITY` → `Infinity`.                                                                                                                                      |
| `unicorn/prefer-iterator-to-array` and `-at-end` | `[...map.values()]` → `map.values().toArray()`. Chain iterator helpers first and call `.toArray()` last: `map.values().filter(isOpen).map(toRow).toArray().toSorted(byDate)`. |
| `unicorn/prefer-url-href`                        | `url.toString()` → `url.href`.                                                                                                                                                |
| `unicorn/no-unnecessary-parameters`              | A parameter that always receives its default → delete it and use the value inside the function.                                                                               |
| `unicorn/no-top-level-assignment-in-function`    | A module-level `let` reassigned in a function → `const state = { last: undefined }` and assign `state.last`.                                                                  |
| `unicorn/no-useless-recursion`                   | Self-recursion → a loop.                                                                                                                                                      |
| `unicorn/no-negated-array-predicate`             | `!items.some(isX)` → `items.every((item) => !isX(item))`.                                                                                                                     |
| `unicorn/prefer-minimal-ternary`                 | `cond ? { code: a } : { code: b }` → `{ code: cond ? a : b }`.                                                                                                                |
| `unicorn/throw-new-error`                        | False positive on Effect's `Schema.TaggedError<E>()('E', {…})` class factory. See the disable section.                                                                        |

## sonar, vitest, react and config files

- **`sonar/no-duplicate-string`**: a string literal used 5 or more times in one file, test files included. Extract a `const` and use it everywhere: `const rewriteHeader = 'x-middleware-rewrite';`.
- **`sonar/cognitive-complexity`**: the limit is 15. Extract named helpers and replace nesting with guard clauses.
- **`vitest/require-mock-type-parameters`**: `vi.fn()` needs a type, for example `vi.fn<typeof s3Storage>()` or `vi.fn<(request: NextRequest) => NextResponse>()`.
- **`vitest/prefer-import-in-mock`**: `vi.mock('./env', …)` → `vi.mock(import('./env'), …)`. Autofixable.
- **`vitest/prefer-each`** and **`vitest/consistent-each-for`**: replace loops around tests and `it.each` with `it.for([...] as const)('handles %s', ([mode, expected]) => { … })`.
- **`react-extra/use-state`**: pass an initializer function, `useState(() => compute())`, instead of calling `compute()` on every render.
- **`jsonc/sort-keys`** in `tsconfig.json` and **`pnpm/yaml-enforce-settings`** in `pnpm-workspace.yaml`: autofixable, but only when `--fix` covers the root files (often a separate `lint:root:fix`).
- **`turbo/no-undeclared-env-vars`**: declare the variable in `env` or `globalEnv` in `turbo.json`.
- **`jsdoc/require-param`** with an inline object type (`inner: { range: … }`) asks for `@param inner.range`. Give the parameter a named type instead.

## Disable comments

A disable comment is the right fix only in these cases:

- **An external contract needs the value.** `null` in a JSON wire format, a nullable GraphQL fixture, or an `http://` URL in a test that checks HTTP is rejected.
- **A known false positive covers a whole pattern.** For `unicorn/throw-new-error` on `Schema.TaggedError`, turn the rule off in that package's `eslint.config.ts` with a comment: ``// `Schema.TaggedError<E>()(...)` is a class factory, not an error construction.``

Fix the code for everything else, including `no-unnecessary-condition`, complexity, duplicate strings and naming.

Write disables like this:

```ts
export const claims = {
  // eslint-disable-next-line unicorn/no-null -- The Laravel JWT contract requires an explicit null.
  refreshToken: null,
};
```

```ts
/* eslint-disable unicorn/no-null -- Shopify Admin GraphQL fixtures use null for nullable fields. */
export const order = { shippingAddress: null, note: null };
```

- Name the rule and give the reason after `--`. A bare `eslint-disable` fails `unicorn/no-abusive-eslint-disable`.
- Use `-next-line` on the line directly above the reported line. Lint again after formatting, because the formatter can move the target line away.
- A block `/* eslint-disable … */` needs a matching `/* eslint-enable … */`, unless it sits at the top of the file, before any code, and covers the whole file.
- Unused directives are reported (`reportUnusedDisableDirectives`), so they fail `--max-warnings 0`. Delete a disable once the code no longer triggers the rule; `--fix` removes them. A disable for a rule the config does not load fails with `Definition for rule … was not found`; delete it.
- `oxlint-disable` comments do not silence ESLint, and `eslint-disable` comments do not silence oxlint. In a repo that runs both, the reported linter decides which directive you need.
