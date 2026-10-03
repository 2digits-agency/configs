# @2digits/oxlint-plugin

Custom [Oxlint JavaScript plugin](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) rules used by
`@2digits/oxlint-config`.

The recommended set is enabled by default by `@2digits/oxlint-config`. The opt-in `prefer-effect-filesystem` and
`prefer-effect-path` rules are excluded because the configured `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those imports more broadly. `no-async-constructor-in-run-sync` is also opt-in; see its precision policy below.
To register the plugin directly:

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

## `no-async-constructor-in-run-sync` (opt-in)

Enable `2digits/no-async-constructor-in-run-sync: 'error'` in your config's `rules` to reject directly visible
Promise-backed effects and finite positive numeric-millisecond sleep/delay under `Effect.runSync`:

```ts
Effect.runSync(Effect.promise(() => Promise.resolve(42))); // Cannot await this Promise-backed effect
Effect.runSync(Effect.tryPromise(() => Promise.resolve(42)));
Effect.runSync(Effect.sleep(1));
Effect.succeed(42).pipe(Effect.delay(1), Effect.runSync);
Effect.runSync(Effect.delay(Effect.succeed(42), 1));
```

The diagnostic points to the constructor or positive delay. It offers no autofix: switching to `runPromise` changes
the return value to a Promise and may require redesigning the caller. A Promise thunk may throw before returning a
Promise, so the diagnostic does not claim every execution throws `AsyncFiberError`.

Only runtime imports from `effect` and `effect/Effect` qualify, including root namespace imports, named module/member
aliases and harmless TypeScript wrappers. Import bindings are scope-checked; shadowed, type-only and unrelated imports
are silent. The rule follows the direct head of instance `.pipe` chains and data-first `Effect.delay`. Its complete
effect-preserving pipe whitelist is `Effect.map`, `Effect.as`, and bare `Effect.asVoid`, plus positive literal
`Effect.delay(n)`. A delay requires a directly visible `promise`, `tryPromise`, `sleep`, `succeed`, `sync`, or `try` head.
It never inspects callbacks, generators, variables or helper implementations.

Unknown operators, provision/service replacement (including custom Clock providers), and timeout operators stop
matching. `callback` and v3 `async` are not inherently asynchronous and are not triggers. All timeout APIs,
zero/negative/dynamic/string/non-finite durations, ordinary `Effect.try`, async runners, and Runtime/curried runtime
runners are outside this slice. For example, these are silent:

```ts
Effect.runSync(Effect.callback((resume) => resume(Effect.succeed(42))));
Effect.runSync(Effect.succeed(42).pipe(Effect.timeout(100)));
Effect.runSync(Effect.sleep(0));
Effect.runSync(Effect.sleep(1).pipe(Effect.provideService(Clock.Clock, customClock)));
```

Runtime/type controls cover Effect **4.0.0, 4.0.0-rc.115 and 4.0.0-rc.117**, not a blanket guarantee across releases.
On those versions, strict TypeScript accepts the Promise example as `number`, `runSync` throws `AsyncFiberError`, and
`runPromise` resolves to 42. Immediate callback and timeout controls both return 42; zero sleep/delay are synchronous.
The matcher does not read the installed Effect version or infer general async behavior.

### Precision policy

The implemented matcher was run on the issue's pinned snapshots on 2026-10-03 with only this rule enabled, using the
built plugin and Oxlint CLI. Inputs were authored `apps/**` and `packages/**` TS/TSX/JS/MJS/MTS/CTS/JSX, including hidden
files, excluding declarations, `payload-types.ts` and `shopifyAppConfigData.ts` generated sources:

| Snapshot                                                                                                           | Files linted | Actual diagnostics | False positives |
| ------------------------------------------------------------------------------------------------------------------ | -----------: | -----------------: | --------------: |
| [Mezaldy](https://github.com/2digits-agency/mezaldy-shopify-ois/commit/a27cccac8966fadc875c2fa17026eaf42154a401)   |          219 |                  0 |               0 |
| [ByLotte](https://github.com/2digits-agency/bylotte-shopify-exact/commit/90ebd6bb1d6628564fe44edee97e77fabc7ee8b7) |           90 |                  0 |               0 |
| [BillyBird](https://github.com/2digits-agency/billybird-api/commit/db538e385ef431a3fbbfc9e821d65bb4a9a0b18c)       |          484 |                  0 |               0 |

These 793 executed files are distinct from the issue's historical 794-file manual inventory and zero confirmed
violations/candidates. They contain no real positive matches, so the corpus alone does not establish enough precision
to enable the rule by default. Keep it opt-in pending broader real-world positive/negative review. RuleTester and
production-config smoke tests cover synthetic positives and the callback/timeout/custom-Clock counterexamples.

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
2. Register it in `src/rules/index.ts`. `src/index.ts` includes it in `recommendedRules` unless explicitly excluded.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
