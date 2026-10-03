# @2digits/oxlint-plugin

Custom [Oxlint JavaScript plugin](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) rules used by
`@2digits/oxlint-config`.

The recommended set is enabled by default by `@2digits/oxlint-config`. The opt-in `prefer-effect-filesystem` and
`prefer-effect-path` rules are excluded because the configured `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those imports more broadly. `no-interruption-unsafe-cleanup-taps` is also opt-in because resource ownership
intent requires author review. To register the plugin directly:

```ts
import { defineConfig } from 'oxlint';

import { recommendedRules } from '@2digits/oxlint-plugin';

export default defineConfig({
  jsPlugins: [{ name: '2digits', specifier: import.meta.resolve('@2digits/oxlint-plugin') }],
  rules: recommendedRules,
});
```

## Rules

The package exports all rules as `rules`, their names as `RuleName`, and the default error-level configuration as
`recommendedRules`.

- Copied and adapted Effect practices: `avoid-data-tagged-error`, `ban-error-string`,
  `effect-promise-vs-trypromise`, `no-logging-in-catch`, and `throw-in-effect-gen`.
- Syntax-safe Effect diagnostics proposed in open `Effect-TS/tsgo` issues: the remaining `cors-*`, `dual-*`,
  `no-*`, `prefer-*`, `preserve-*`, and `require-*` Effect rules.
- Effect v4 API guidance for Array, DateTime, Duration, Encoding, FileSystem, Filter, Headers, Match, Path, and Url,
  plus interruptible `Effect.tryPromise` thunks.
- Effect and Alchemy import policy: namespace imports from PascalCase submodule entrypoints, canonical Effect aliases,
  and no root-barrel module imports. `@effect/vitest` and lowercase unstable barrels are intentionally exempt.
- Alchemy v2 practices: every `alchemy-*` rule.

See each rule's `meta.docs.url` for its upstream rule, issue, or framework documentation. Copied-code attribution is in
[`NOTICE`](./NOTICE).

## Opt-in resource cleanup diagnostic

Enable `2digits/no-interruption-unsafe-cleanup-taps` explicitly:

```ts
import withTwoDigits from '@2digits/oxlint-config';

export default withTwoDigits({
  rules: { '2digits/no-interruption-unsafe-cleanup-taps': 'error' },
});
```

The rule reports once when adjacent `Effect.tap` and `Effect.tapError` or Effect v4 `Effect.tapCause` stages, in either
order within one `.pipe`, return identical proven resource cleanup. These terminal outcome taps do not guarantee cleanup
on interruption. `tapError` also omits defects; `tapCause` is not claimed to omit every defect. Effect v3
`tapErrorCause` is not analyzed.

The syntax-only subset is deliberately small:

- Import-resolved `Deferred.interrupt(resource)` and `Scope.close(scope, exit)`, with stable binding references,
  literals, or imported values as arguments.
- `Effect.sync(() => db.close())`, where a same-file immutable `db` was constructed with the runtime `DatabaseSync`
  import from `node:sqlite`. A single close statement or return is supported; compound bodies are not.
  Visible writes or deletes of `close`, including through immutable local handle aliases, invalidate this proof.
- Concise or single-return, non-async/non-generator callbacks with zero parameters or one unused plain identifier.
  Local immutable `const` cleanup aliases are followed, and comparison uses lexical binding identities, not source text.

Outcome-dependent callbacks, factories, reassigned aliases, custom service cleanup, arbitrary `.close()` methods,
counters/logging/metrics, and cross-file flow are outside the subset. Shadowed or type-only imports do not establish a
runtime primitive. There is no TypeScript checker or general inference of effect error channels.

**There is no autofix or editor code action.** Verify ownership and existing registration before replacing a tap pair
with `ensuring` or an acquire/release API when all-exit cleanup is required:

```ts
// Before: interruption can leave the locally acquired SQLite handle open.
const task = operation.pipe(
  Effect.tap(() => Effect.sync(() => db.close())),
  Effect.tapError(() => Effect.sync(() => db.close())),
);
```

```ts
// After ownership review: replace both taps; do not append a second finalizer.
const task = operation.pipe(Effect.ensuring(Effect.sync(() => db.close())));
```

Preserve lazy construction, keep acquisition under the intended owner, and do not wrap finalization in an interruptible
region. The rule suppresses matching cleanup already visibly registered through `ensuring`, `onExit`, `addFinalizer`,
`acquireRelease`, or `acquireUseRelease` in the same lexical owning region (nearest function/generator or module).
Release callbacks may have two unused plain parameters for resource and exit.
An `ensuring`/`onExit` wrapper directly protecting an `Effect.gen` is also recognized.
This is not a control-flow or cross-file ownership proof: hidden registration still requires author review.

A deliberate handoff that requires cleanup only after success or typed failure may use a justified suppression:

```ts
const task = operation.pipe(
  // oxlint-disable-next-line 2digits/no-interruption-unsafe-cleanup-taps -- The outer owner handles interruption; this pair marks a terminal handoff only.
  Effect.tap(() => cleanup),
  Effect.tapError(() => cleanup),
);
```

## Automatic fixes

Run `vp lint --fix` to apply fixes from `prefer-effect-duration`, `no-empty-effect-callback`,
`no-effect-alchemy-barrel-imports`, `prefer-effect-alchemy-namespace-imports`,
`alchemy-no-v1-worker-properties`, and `alchemy-no-deprecated-docker-constraints`.
Fixes skip ambiguous bindings, conflicting properties, and unsupported import references.

## Adding a rule

Oxlint's JavaScript plugin API is currently alpha and does not expose type information. Keep rules syntax-safe and leave
semantic Effect checks to `@effect/tsgo` / `@effect/language-service`.

Oxfmt formats imports but does not enforce package-specific import architecture. The Effect language service's
`namespaceImportPackages` and `importAliases` settings guide generated auto-imports only, so the plugin enforces the same
policy for handwritten imports.

1. Add one rule file under `src/rules/alchemy` or `src/rules/effect` with `defineRule` through `defineSyntaxRule` or
   `defineEffectRule`.
2. Register it in `src/rules/index.ts`. `src/index.ts` includes it in `recommendedRules` unless explicitly excluded as opt-in.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
