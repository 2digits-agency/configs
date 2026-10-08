## @2digits/oxlint-plugin@0.1.2

### Update effect to 4.0.2

- Bumped `effect` and `@effect/platform-node` to 4.0.2

## @2digits/oxlint-plugin@0.1.1

### Update @oxlint/plugins to 1.87.0



### Update effect to 4.0.1

## @2digits/oxlint-plugin@0.1.0

### Diagnose uppercase Effect v4 endpoint header schema keys

- Added the recommended `no-uppercase-http-api-header` diagnostic for direct endpoint header field objects with
  import and lexical binding checks. Native headers, v3 schemas, and ambiguous objects remained excluded.
- Kept the rule diagnostic-only: renaming keys can change contracts or introduce lowercase collisions.
- Added preventive guidance backed by pinned rc.117 runtime controls. The historical agency scan found zero bad
  sites and seven valid schemas; no existing outage was claimed.

### Allow defaults for locally proven function-valued Configs

- Fixed `no-function-config-default` false positives for `Config.succeed(functionLiteral)`, immutable local receiver
  aliases, and the first operation in a proven receiver's pipe.
- Preserved diagnostics for value-config thunks and unknown receivers without offering an eager-evaluation autofix.

### Add anti-slop Effect rules

Add recommended rules for manual tagged error handling, tag comparisons, tagged construction, and relative service
constructor imports. Extend `prefer-effect-match` to detect chained literal ternaries. Adapted from Dillon Mulroy's
MIT-licensed anti-slop project; all new diagnostics are syntax-only and have no automatic fixes.

### Improve statement spacing types

Accept readonly non-empty matcher lists and strengthen statement matching types without changing spacing diagnostics or autofixes.

### Migrate statement spacing to effect-oxlint

Use Effect-based visitors and file-local state for statement spacing while preserving configuration, diagnostics, and autofixes.

### Add configurable statement spacing

Add the opt-in `padding-line-between-statements` rule, adapted from anti-slop's ESLint Stylistic vendor.
Supports TypeScript statements, AST selectors, and comment-aware whitespace autofixes.

### Refactor statement spacing effects

- Routed spacing checks through the Effect rule context without changing diagnostics or autofixes.

## @2digits/oxlint-plugin@0.0.7

### Update @oxlint/plugins to 1.86.0

Update the runtime plugin compatibility helpers from 1.84.0 to 1.86.0 alongside Oxlint.

## @2digits/oxlint-plugin@0.0.6

### Update @oxlint/plugins to 1.84.0

## @2digits/oxlint-plugin@0.0.5

### Satisfy the updated lint rules

- Refactored guard clauses and filter expressions across rule implementations and services to comply with the updated linting rules

## @2digits/oxlint-plugin@0.0.4

### Configure declaration generation with the current Vite+ API

- Replaced `dts.tsgo` with `dts.generator: 'tsgo'` in package builds.

### Update `@oxlint/plugins` to `1.83.0`

## @2digits/oxlint-plugin@0.0.3

### Adopt TypeScript 7 while preserving ESLint compatibility

- Migrated non-ESLint package type checks and declaration builds to TypeScript 7.0.2, replacing native-preview and alias dependencies.
- Retained fast `tsgo` type checks for the ESLint config and plugin while keeping their TypeScript compiler API dependencies on TypeScript 6.0.3 through the named `eslint` catalog.
- Expanded the shared tsconfig's TypeScript peer range to support both TypeScript 6 and 7.

## @2digits/oxlint-plugin@0.0.2

### Add automatic fixes for six rules

Add fixes for Effect duration literals, empty Effect callbacks, barrel and namespace imports, Alchemy Worker property names, and Docker placement constraints. Fixes preserve local bindings and skip unsupported or conflicting code.

## @2digits/oxlint-plugin@0.0.1

### Add custom Oxlint rules

Added a JavaScript plugin with default Effect correctness and API-usage rules, including syntax-safe diagnostics proposed
for `@effect/tsgo`.

Effect projects now receive guidance toward the v4 Array, DateTime, Duration, Encoding, FileSystem, Filter, Headers,
Match, Path, and Url APIs. Promise thunks must acknowledge Effect's interruption signal, and Effect/Alchemy imports use
consistent submodule namespaces and aliases while leaving `@effect/vitest` imports unchanged.

The FileSystem and Path rules remain opt-in because the existing `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those migrations without duplicate reports.

The default Oxlint configuration now also catches unsafe Alchemy v2 migrations, runtime configuration, secret, lifecycle,
and deprecated API patterns.
