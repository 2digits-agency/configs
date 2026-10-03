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
- Native reference-key lookups: `no-fresh-native-collection-lookup-key`.

See each rule's `meta.docs.url` for its upstream rule, issue, or framework documentation. Copied-code attribution is in
[`NOTICE`](./NOTICE).

## Fresh native collection lookup keys

`2digits/no-fresh-native-collection-lookup-key` reports direct object/array literals passed to `Map`/`WeakMap.get`
or native `Map`/`Set`/`WeakMap`/`WeakSet.has` and `.delete`. Equal-looking fields do not make native references equal:

```ts
const key = { id: 7 };
const map = new Map([[key, 'stored']]);

map.get({ id: 7 }); // Reported: undefined, not 'stored'.
map.get(key); // Valid: reuse the stored reference.
```

The receiver must resolve to a same-file variable initialized directly by an unshadowed built-in constructor.
Shadowed constructors/receivers, reassigned bindings and direct member writes are excluded. The rule accepts stable
identifiers and primitive keys, insertion/constructor values, arbitrary constructed keys (including `Data.Class`),
unknown/custom receivers, aliases and wrapper calls. It skips literals containing top-level spreads, computed
properties, methods, accessors or `__proto__`. It does not use parser services or infer Equal/Hash protocols.
Indirect mutation/escape analysis and patched native prototypes are outside this syntax-only matcher.

Effect v4 `HashMap`, `MutableHashMap` and `HashSet` support fresh structural keys and are entirely excluded.
`Cache.get`, `Atom.family` and other loading-on-miss APIs are also excluded. Runtime controls use actual Effect 4.0.0
APIs, including `Data.Class`, not the removed `Data.struct`/`Data.array` exports.
The same structural-hit and native `Data.Class` reference controls were also executed against the published
4.0.0-rc.115 and 4.0.0-rc.117 packages during implementation.

No automatic fix or representation-changing suggestion is offered. Reusing a stable key or choosing a value-key
design is a contract decision for the caller.

### Recommended enablement is backed by the restricted matcher

Recommended enablement follows the binding/literal negative fixtures and an executed Oxlint 1.86.0 matcher scan on
2026-10-03, not the broad upstream Effect proposal. The scan included first-party apps/packages TS/TSX and authored
tests, excluding hidden/generated/dist directories:

| Pinned corpus                                                                                                      | Files scanned | Rule diagnostics / observed false positives |
| ------------------------------------------------------------------------------------------------------------------ | ------------: | ------------------------------------------: |
| [Mezaldy](https://github.com/2digits-agency/mezaldy-shopify-ois/commit/a27cccac8966fadc875c2fa17026eaf42154a401)   |           219 |                                       0 / 0 |
| [ByLotte](https://github.com/2digits-agency/bylotte-shopify-exact/commit/90ebd6bb1d6628564fe44edee97e77fabc7ee8b7) |            91 |                                       0 / 0 |
| [BillyBird](https://github.com/2digits-agency/billybird-api/commit/db538e385ef431a3fbbfc9e821d65bb4a9a0b18c)       |           438 |                                       0 / 0 |

These are actual rule diagnostics, distinct from the ticket's historical zero textual misuse matches. They do not
establish an alias/interprocedural census or a current production defect. Keep broader matchers opt-in until their
own corpus and negative controls establish precision.

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

1. Add one rule file under `src/rules` (or its `alchemy`/`effect` directories) with `defineRule` through `defineSyntaxRule` or
   `defineEffectRule`.
2. Register it in `src/rules/index.ts`. `src/index.ts` automatically includes it in `recommendedRules`.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
