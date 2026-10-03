# @2digits/oxlint-plugin

Custom [Oxlint JavaScript plugin](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) rules used by
`@2digits/oxlint-config`.

The recommended set is enabled by default by `@2digits/oxlint-config`. The opt-in `prefer-effect-filesystem` and
`prefer-effect-path` rules are excluded because the configured `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those imports more broadly. To register the plugin directly:

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

## Opt-in packed layer override diagnostic

`no-ignored-layer-override` is excluded from `recommendedRules` while its precision is established. Enable it explicitly:

```ts
export default {
  rules: {
    ...recommendedRules,
    '2digits/no-ignored-layer-override': 'error',
  },
};
```

The rule proves a same-file graph using immutable local bindings and scope-resolved tag identity, including aliases:

```ts
const Db = Context.Service<{ read: Effect.Effect<string> }>('Db');
const Reader = Context.Service<{ read: Effect.Effect<string> }>('Reader');
const DbProd = Layer.succeed(Db, { read: Effect.succeed('production') });
const DbMock = Layer.succeed(Db, { read: Effect.succeed('mock') });
const ReaderCore = Layer.effect(
  Reader,
  Effect.gen(function* () {
    const db = yield* Db;

    return { read: db.read };
  }),
);
const ReaderPacked = ReaderCore.pipe(Layer.provide(DbProd));

ReaderPacked.pipe(Layer.provide(DbMock)); // Reports: the constructor still receives DbProd.
ReaderCore.pipe(Layer.provide(DbMock)); // Open construction receives DbMock.
```

It recognizes named and namespace Effect imports, local `Context.Service` keys (including empty service classes),
direct unconditional `yield* Tag` statements/initializers in `Effect.gen`, and `Layer.provide` in data-first or `.pipe`
form. It reports once at the ignored outer provider and names the tag and packed/open layers.

Re-provision of the same layer, unused providers, dependencies accessed only by later methods, different tag bindings, mutable bindings or aliases,
cycles, imports of unknown layers/tags, arbitrary factories, arrays, merges, and unknown composition operators are
not inferred. It does not inspect types or other files, or guess dependencies from `.Default`, `.layer`, or `.testLayer`.
Choose the open layer or rebuild the composition yourself: no autofix or suggestion removes/replaces packed resources.

The issue's pinned application audit found zero confirmed violations; the production/mock example is a synthetic,
independently asserted Effect 4.0.0 runtime control, not evidence of an existing application defect.

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
2. Register it in `src/rules/index.ts`. `src/index.ts` automatically includes it in `recommendedRules` unless explicitly
   excluded as opt-in or covered by Effect tsgo.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
