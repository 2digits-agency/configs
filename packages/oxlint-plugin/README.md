# @2digits/oxlint-plugin

Custom [Oxlint JavaScript plugin](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) rules used by
`@2digits/oxlint-config`.

The recommended set is enabled by default by `@2digits/oxlint-config`. The opt-in `prefer-effect-filesystem` and
`prefer-effect-path` rules are excluded because the configured `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those imports more broadly. `no-duplicate-fresh-layer-factory` is also opt-in: deliberately isolated layer
instances are valid, and its bounded syntax-only coverage needs precision assessment. To register the plugin directly:

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

## Opt-in fresh layer factory diagnostic

Enable `rules: { '2digits/no-duplicate-fresh-layer-factory': 'error' }` alongside the registered plugin.
The rule reports each repeated construction after the first, including that earlier call's line and column.
It proves freshness from a same-file function's unconditional `Layer.effect` or `Layer.succeed` return, optionally
through local constant bindings, local factory calls, and known composition chains. A Layer return annotation alone
does not establish freshness.

The composition boundary is one visible `Layer.merge`, `mergeAll`, `provide`, or `provideMerge` expression, including
nested compositions, inline provider arrays, data-last application, `.pipe`, and imported `pipe` calls containing only
known composition steps. Imports may be aliased, named, or namespaces; shadowed/type-only/unrelated imports do not match.
Method `.pipe` sources must themselves be locally identifiable layers, so arbitrary objects' methods do not establish
a graph. Separate expressions, tests, builds, and graph owners are not joined; aliases to assembled graphs are not traced.

Arguments must be the same primitive literal values or the same unmodified local `const` bindings. Identifier arguments
currently require literal or plain-data object/array initializers; imported values, unknown initializers, getters,
aliases/escapes of object arguments, visible mutation, fresh object/function arguments, and property accesses are skipped.
Factories returning cached values, conditional returns, unknown transformations, or imported implementations are skipped.
This is intentionally conservative and does not use a separate TypeScript Program or parser services.

When sharing is intended, construct one value **inside the existing graph owner**:

```ts
function makeGraph(config: string) {
  // Before: Layer.merge(makeDb(config), makeDb(config))
  const dbLive = makeDb(config);

  return Layer.merge(Layer.provide(FirstLive, dbLive), Layer.provide(SecondLive, dbLive));
}
```

There is **no automatic fix or fix suggestion**: hoisting changes initialization timing, closures, and resource ownership.
Do not move request-specific resources into module-global caches. For deliberate isolation, use an ordinary suppression
with a reason, such as `// oxlint-disable-next-line 2digits/no-duplicate-fresh-layer-factory -- Independent instances intended`.

### Executed controls and pinned corpus (2026-10-03)

The independent Effect 4.0.0 scoped-resource test builds two dependent services in one graph and closes its scope:

| Construction                        | Acquisitions | Releases | Service resource IDs |
| ----------------------------------- | -----------: | -------: | -------------------- |
| Two fresh factory calls             |            2 |        2 | `[1, 2]`             |
| One shared value in the graph owner |            1 |        1 | `[1, 1]`             |

A second shared graph owner still acquires/releases its own resource. These controls show preventive value, not a
production resource leak or new verification of historical acquisitions.

The built plugin was executed with Oxlint 1.86.0 against the exact GitHub archives pinned in
[#2716](https://github.com/2digits-agency/configs/issues/2716), with only this rule enabled and ignores disabled.
Input selection included authored tests and root infrastructure/config files with `.ts`, `.tsx`, `.mts`, `.cts`, `.js`,
`.jsx`, `.mjs`, or `.cjs` extensions; excluded hidden directories, declarations, and `node_modules`, `dist`, `build`,
`generated`, `opensrc`, and `vendor` directories. These execution counts differ from the issue's historical census;
they are not substituted for its composition-call or confirmed-source-site counts.

| Snapshot                                                                                                                    | Files linted | Matcher diagnostics | Observed false positives |
| --------------------------------------------------------------------------------------------------------------------------- | -----------: | ------------------: | -----------------------: |
| [Mezaldy a27cccac](https://github.com/2digits-agency/mezaldy-shopify-ois/commit/a27cccac8966fadc875c2fa17026eaf42154a401)   |          230 |                   0 |                        0 |
| [ByLotte 90ebd6bb](https://github.com/2digits-agency/bylotte-shopify-exact/commit/90ebd6bb1d6628564fe44edee97e77fabc7ee8b7) |           96 |                   0 |                        0 |
| [BillyBird db538e38](https://github.com/2digits-agency/billybird-api/commit/db538e385ef431a3fbbfc9e821d65bb4a9a0b18c)       |          555 |                   0 |                        0 |

All three executions exited successfully with empty diagnostic arrays. Zero diagnostics are **not** evidence of full
coverage. BillyBird's `PublicHandlers.ts:150,153` pair is skipped: `CacheWarmLive` is imported from `CacheWarm.ts`, outside
same-file freshness proof (and other imported graph sources remain unresolved). Its duplicate identity remains historical
source evidence, not a verified matcher hit or duplicate-pool/leak claim. The three indirect `UserIdentityLive(database)`
sites in `PartnerAdmin.ts:1368`, `PartnerCore.ts:1906`, and `GoogleAi.ts:402` remain unresolved candidates, not confirmed hits.
The RuleTester local equivalent of the CacheWarm pattern, including its provider array, reports one duplicate. Shared
constants and independent builds remain silent. None of these limitations justify automatic recommended enablement.

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
   excluded as opt-in.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
