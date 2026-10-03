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
- General correctness: the opt-in `no-unsafe-dynamic-record-key` rule, independent of Effect imports.

See each rule's `meta.docs.url` for its upstream rule, issue, or framework documentation. Copied-code attribution is in
[`NOTICE`](./NOTICE).

## Dynamic string dictionaries (opt-in)

Enable `2digits/no-unsafe-dynamic-record-key` explicitly:

```ts
import withTwoDigits from '@2digits/oxlint-config';

export default withTwoDigits({
  rules: { '2digits/no-unsafe-dynamic-record-key': 'error' },
});
```

This diagnostic catches prototype collisions, not a general preference for Map. It requires a same-file,
non-reassigned ordinary-object initializer and an explicit `Record<string, V>`, `Readonly<Record<string, V>>`,
string index signature, or local alias of those types. Keys must come from string-annotated parameters
(including nullable strings), local copies, `trim`/`trimStart`/`trimEnd`/`toLowerCase`/`normalize` calls, or
destructured `Object.entries` keys in `for…of`, `forEach`, or `map` over explicitly open dictionaries.
Local aliases can carry a value type parameter; generic key substitution and cross-file aliases are not resolved.

It reports at computed assignments (including destructuring and loop targets)/updates and presence/fallback operations:
`in`, comparisons with `undefined` or `void`, and `??`. A read stored in a non-reassigned local variable and then used
in a presence check is also covered.
`Record<string, V>` does not remove inherited `constructor`/`toString` values, and `??` will not reject them.

Literal/finite keys, closed-object entry loops, numeric strings, fixed prefixes, uppercase transformations,
unresolved provenance, Maps, class instances, `Object.create(null)`, `Object.fromEntries`, and `{ __proto__: null }`
initializers are skipped. Safe literal whitelists and matching `Object.hasOwn` or
`Object.prototype.hasOwnProperty.call` guards are recognized in branches, conditional/short-circuit expressions,
and immediately preceding early-exit checks. Local whitelist arrays must have no references that could mutate or
escape their contents. Own-key guards protect **reads**, not assignments: assigning an
unrestricted `__proto__` key to an ordinary object can still invoke its inherited setter.
An intervening explicit deletion of a potentially inherited key invalidates an own-key guard.
An initializer's own `__proto__` method/data/accessor property suppresses write diagnostics, but does not protect
reads from other inherited names. Prototype-setting initializer syntax is excluded from this bounded proof.

There is **no autofix or editor suggestion**. Choose a null-prototype dictionary, Map, `Object.fromEntries`, or
safe define-property/Effect Record APIs after checking consumers. Changing an initializer can break consumers
that expect object methods or a particular prototype. These diagnostics do not establish production incidents,
global `Object.prototype` pollution, or remote exploits. Oxlint has no parser services/typechecker; v1 does not
promise coverage of every historical source hazard.

### Pinned corpus results, 2026-10-03

Ran the built plugin with only this rule enabled against first-party `apps/` and `packages/` TypeScript/TSX.
Excluded `.d.ts`, generated directories, `test`/`tests`/`fixtures` directories, and `.test`/`.spec` files;
dependencies and bundled skill scripts were outside those paths. Used Oxlint 1.86.0 with `--no-ignore --format json`
and a config containing `categories: { correctness: 'off' }`, the built plugin's absolute specifier, and this rule
at `error`. This run counts diagnostics separately from the issue's manually verified hazard inventory.

| Pinned project                                                                                                     | Files | Diagnostics | Verified positives | False positives | Historical hazards skipped | Candidates skipped |
| ------------------------------------------------------------------------------------------------------------------ | ----: | ----------: | -----------------: | --------------: | -------------------------: | -----------------: |
| [Mezaldy](https://github.com/2digits-agency/mezaldy-shopify-ois/commit/a27cccac8966fadc875c2fa17026eaf42154a401)   |   156 |           0 |                  0 |               0 |                          2 |                  2 |
| [ByLotte](https://github.com/2digits-agency/bylotte-shopify-exact/commit/90ebd6bb1d6628564fe44edee97e77fabc7ee8b7) |    66 |           1 |                  1 |               0 |                          0 |                  0 |
| [BillyBird](https://github.com/2digits-agency/billybird-api/commit/db538e385ef431a3fbbfc9e821d65bb4a9a0b18c)       |   353 |           0 |                  0 |               0 |                         10 |                  2 |

The sole diagnostic is ByLotte `packages/domain/src/vatMapping.ts:105:12`, the unrestricted nullable-string
country-code fallback. It matches the issue's independently reproduced inherited-value defect.

Skipped inventory: Mezaldy's two normalized alias lookups use helper-function key flow; its two codegen candidates
need interprocedural initializer/key flow. BillyBird's gift-copy loops use imported schema contracts/destructured
parameters; its merge loop concatenates entries of destructured, imported-alias parameters. Video GUID,
stored-preference, translation, partner-accumulator and device-topic keys use property/helper/schema flow.
Decoded preferences and CMS totals have inferred entry sources rather than explicit open-dictionary source bindings.
The two CMS candidates receive their containers as parameters. Skipping these is not evidence that they are safe.

**Recommendation policy:** v1 remains opt-in. One verified diagnostic with zero observed false positives is too
small a sample to demonstrate default-preset precision. The fixtures cover supported alias/VAT reads and copy/merge
writes without claiming that simplified fixtures are detections of all 13 historical sites.

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

1. Add one rule file under `src/rules` (or its `alchemy`/`effect` subdirectories) with `defineRule` through `defineSyntaxRule` or
   `defineEffectRule`.
2. Register it in `src/rules/index.ts`. `src/index.ts` includes it in `recommendedRules` unless explicitly excluded.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
