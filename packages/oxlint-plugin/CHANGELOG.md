## @2digits/oxlint-plugin@0.3.4

### Correct development commands to run repository scripts

- Updated development instructions to use `vpr` so checks, builds and fixes run the intended package scripts instead of Vite+ built-in tasks

## @2digits/oxlint-plugin@0.3.3

### Use Effect string helpers inside the lint rules

- Replaced native string calls such as `startsWith`, `replaceAll` and `split` with their `effect/String` counterparts in the Effect rules, the padding-line rule and the shared utils

## @2digits/oxlint-plugin@0.3.2

### Use Effect helpers in rule internals

- Rewrote rule helpers and `utils.ts` to use Effect modules
- Fixed `consistent-schema-pipe` handling

### Make FileState bindings non-optional

- Removed optional-key handling for `bindings` and `hasEffectImport` so they default via constructor defaults instead of nullable access
- Updated rule code to access `state.bindings` directly without optional chaining
- Changed `candidates` from `let` to `const` and use `.clear()` on reset in `preferEffectDurationConstants`
- Rewrote `typeNamePath` identifier case using `Fn.flow(Struct.get('name'), Arr.make)`

## @2digits/oxlint-plugin@0.3.1

### Keep generic Schema calls in `consistent-schema-pipe`

`consistent-schema-pipe` no longer reports or rewrites calls such as `Schema.toCodecJson(schema)` when `schema` is declared as `Schema.Constraint` or as a type parameter that is not bounded by a pipeable Schema type. Those values have no `.pipe`, so the old autofix produced code that failed to type-check.

### Match imported names with effect Match

- Replaced the manual `importedName` if-chain with an `effect/Match`-based implementation

### Use Effect Array helpers directly

- Replaced `effect/Function` pipe wrappers with direct `effect/Array` calls across rules and fixes

### Use Effect modules across rule helpers

- Rule internals now use `effect/Array`, `Option`, `Match`, `Predicate` and `String` instead of hand-written loops, `typeof` checks and if-chains.
- Shared `resolveVariable`, `soleDefinition`, `findAncestor`, `isAnyApi` and `isEqualityOperator` helpers replace copies across rules.
- Fixed hot paths that allocated a new array or matcher on every visited node.

### Express AST helpers with effect Match and Predicate

- Rewrote `staticPropertyName`, `propertyName`, `isFunctionNode` and `isErrorConstructor` with `effect/Match` and `effect/Predicate`
- Replaced four copies of the imported-name lookup with one shared `moduleExportName` helper, and the repeated string-literal checks with a shared `isStringLiteral`
- Fixed `importedName` so string-literal import names (`import { 'foo-bar' as x }`) are recognized again

## @2digits/oxlint-plugin@0.3.0

### Add `no-inline-schema-compile`

- Reported Schema decoders, encoders, and guards such as `Schema.decodeUnknownSync(User)(input)` that are compiled and invoked inside a function body, so the compiled function is rebuilt on every call
- Skipped schemas that depend on function parameters, local bindings, or `this`, because those cannot be hoisted to module scope
- Enabled the rule by default in `recommendedRules` and the 2digits Oxlint config, in files that import Effect

### Add `consistent-schema-pipe`

- Reported Schema modifiers such as `Schema.optionalKey(Schema.String)` and `Schema.fromJsonString(User)` that are called instead of applied with `.pipe(...)`, and fixed them to `Schema.String.pipe(Schema.optionalKey)`; calls that pass options are left alone
- Reported Schema wrappers such as `Array` piped into, fixing `Schema.String.pipe(Schema.Array, Schema.optional)` to `Schema.Array(Schema.String).pipe(Schema.optional)`
- Rewrote inline data-last calls such as `Schema.brand('UserId')(Schema.String)` and `pipe(schema, ...)` from `effect` to `schema.pipe(...)`, merging into existing pipes instead of nesting
- Enabled the rule by default in `recommendedRules` and the 2digits Oxlint config, in files that import Effect

## @2digits/oxlint-plugin@0.2.0

### Add `prefer-effect-duration-constants`

- Reported `const` numbers that hold a duration, such as `TIMEOUT_MS = 30_000`, `ONE_DAY = 24 * 60 * 60 * 1000`, or any numeric constant passed to an Effect duration API, and suggested the matching `Duration` constructor
- Enabled the rule by default in `recommendedRules` and the 2digits Oxlint config, in files that import Effect
- Extended `prefer-effect-duration` to number arithmetic and more Effect v4 APIs: `Schedule.exponential`, `Schedule.during`, `Stream.debounce`, `Stream.timeout`, `TestClock.adjust`, `Effect.cachedWithTTL`, and the `duration` option of `Effect.timeoutOrElse` and `Stream.throttle`

### Use Effect helpers in lint rules

- Rewrote rule internals to use Effect collection helpers and `Match`, so the plugin's own code follows the Effect rules it ships
- Replaced duration arithmetic and constant-name parsing with `effect/Number` and `effect/String` helpers

### Update `@oxlint/plugins` to 1.88.0



### Update `effect` to 4.0.5

## @2digits/oxlint-plugin@0.1.4

### Update effect to 4.0.4

## @2digits/oxlint-plugin@0.1.3

### Update effect to 4.0.3

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
