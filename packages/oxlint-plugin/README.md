# @2digits/oxlint-plugin

Custom [Oxlint JavaScript plugin](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) rules used by
`@2digits/oxlint-config`.

The recommended set is enabled by default by `@2digits/oxlint-config`. `config-default-outside-literals` is opt-in because
out-of-set defaults can intentionally widen a config. The opt-in `prefer-effect-filesystem` and
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

## Opt-in literal Config default checks

Enable `2digits/config-default-outside-literals` at warning level:

```ts
export default defineConfig({
  jsPlugins: [{ name: '2digits', specifier: import.meta.resolve('@2digits/oxlint-plugin') }],
  rules: { ...recommendedRules, '2digits/config-default-outside-literals': 'warn' },
});
```

Effect v4 permits `withDefault` to widen the success type, bypassing schema validation when input is absent. This rule
asks you to check a same-kind primitive default outside an explicitly written inline literal contract; it does not
establish that widening is a bug and offers no fix or nearest-value suggestion.

```ts
Config.schema(Schema.Literals(['debug', 'info']), 'LEVEL').pipe(Config.withDefault('inof')); // Check 'inof'.
Config.Literals(['debug', 'info'], 'LEVEL').pipe(Config.withDefault('info')); // Valid member.
// eslint-disable-next-line unicorn/no-null -- Intentional Config sentinel.
Config.Literals(['debug', 'info'], 'LEVEL').pipe(Config.withDefault(null)); // Legitimate sentinel.
```

The matcher resolves Effect root/submodule namespace imports and named aliases with scope-aware shadowing checks.
It supports direct `Config.Literals(array, name?)` or `Config.schema(Schema.Literals(array), name?)` immediately followed
by `.pipe(Config.withDefault(literal))`, and data-first `Config.withDefault(configExpression, literal)`. It requires at
least two inline homogeneous string or number literals and a default of the same kind. Signed numbers and
parentheses/`as const` around arrays are supported. The current spelling is **`Config.Literals`**, not `Config.literals`.

It skips transforms/custom pipe stages, schema/config aliases and imported schemas, brands, spreads, computed or mixed
list entries, nonliteral defaults, different-kind defaults, `null`/`undefined`/Option/object sentinels, and broad
String/Number/Redacted/URL configs. It never infers an enum from a variable name such as `environment`.

Direct broad default assertions (`'legacy' as string`, `3 as number`) and declarations explicitly annotated as
`Config.Config<'debug' | 'info' | 'legacy'>` are excluded when the union includes the source and default values.
Unknown/complex declaration annotations are skipped conservatively, not treated as proven intent. Other intentional
widening can use a scoped suppression:

```ts
// oxlint-disable-next-line 2digits/config-default-outside-literals -- Intentional legacy fallback.
Config.Literals(['debug', 'info'], 'LEVEL').pipe(Config.withDefault('legacy'));
```

The independent [runtime/type control](./test/config-default-runtime.spec.ts) and
[demo fixture](./test/fixtures/config-default-outside-literals/demo.ts) use Effect 4.0.0. Strict typechecking confirms
the typo infers `Config.Config<'debug' | 'info' | 'inof'>` without diagnostics. An empty provider yields `'inof'`; manually
changing it to `'info'` yields `'info'`; `null` and explicit widening remain legitimate. Supplied `'inof'` is still rejected
by the source schema. After building, reproduce with `vp test test/config-default-runtime.spec.ts` and
`vp exec tsc --noEmit` from this package.

### Pinned corpus results

The built opt-in rule was run on 2026-10-03 against authored `apps/**` and `packages/**` TS/TSX/JS/MJS/MTS/CTS/JSX
files, excluding declaration files and `*.gen.*`, `*.generated.*`, and `routeTree.*`. All selected files parsed.

| Snapshot                                                                                                           | Files linted | Actual rule diagnostics | Observed false positives |
| ------------------------------------------------------------------------------------------------------------------ | -----------: | ----------------------: | -----------------------: |
| [Mezaldy](https://github.com/2digits-agency/mezaldy-shopify-ois/commit/a27cccac8966fadc875c2fa17026eaf42154a401)   |          219 |                       0 |                        0 |
| [ByLotte](https://github.com/2digits-agency/bylotte-shopify-exact/commit/90ebd6bb1d6628564fe44edee97e77fabc7ee8b7) |           91 |                       0 |                        0 |
| [BillyBird](https://github.com/2digits-agency/billybird-api/commit/db538e385ef431a3fbbfc9e821d65bb4a9a0b18c)       |          483 |                       0 |                        0 |

These are matcher results, separate from [#2732](https://github.com/2digits-agency/configs/issues/2732)'s historical review:
67 `withDefault` calls, zero vetted violations/candidates, and 794 parsed files using its inventory selection. Usage
counts are not violation counts. The rule is preventive, not a claim of a production typo. Broad environment/dev flags,
URLs, and numeric defaults remain intentionally outside this finite-contract matcher.

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
