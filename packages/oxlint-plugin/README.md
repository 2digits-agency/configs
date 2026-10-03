# @2digits/oxlint-plugin

Custom [Oxlint JavaScript plugin](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) rules used by
`@2digits/oxlint-config`.

The recommended set is enabled by default by `@2digits/oxlint-config`. The opt-in `prefer-effect-filesystem` and
`prefer-effect-path` rules are excluded because the configured `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those imports more broadly. `no-eager-effect-mutation` is also opt-in: construction-time instrumentation can
be intentional. To register the plugin directly:

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

## Opt-in Effect mutation timing diagnostic

Enable `2digits/no-eager-effect-mutation` explicitly, including when extending `@2digits/oxlint-config`:

```ts
import withTwoDigits from '@2digits/oxlint-config';

export default withTwoDigits({
  rules: { '2digits/no-eager-effect-mutation': 'warn' },
});
```

With the plugin registered directly, add the same rule to your `rules` object. It is absent from `recommendedRules` and
the default preset. It reports once per plain function, at the first supported external mutation before an explicit
Effect return. Calling the function performs that mutation even if the returned Effect never runs; running, repeating,
or retrying that Effect does not repeat the construction work.

The syntax-only subset recognizes binding-proven Effect imports (including aliases), `Effect.void`/`never`, known
constructors such as `succeed`/`fail`/`suspend`, data-first combinators and `.pipe` with known Effect combinators, or a
same-file imported `Effect.Effect` return annotation. It checks same-function branches, not nested callback bodies:
nested functions are analyzed independently. Assignments and increments require a captured binding or parameter-owned
property. Native `copyWithin`, `fill`, `pop`, `push`, `reverse`, `shift`, `sort`, `splice`, and `unshift` require a direct
receiver initialized with an array literal or annotated `Array<T>`/`T[]`. Global `Object.assign` requires an object
literal, inline object type, or global `Record<K, V>` target. Local copy-on-write builders and pure precomputed inputs
remain silent. Reassigned native receivers, arbitrary aliases, nested native receivers, class methods, unknown mutation
helpers and cross-file return inference are outside this subset. This is not control-flow or TypeScript-checker analysis.

Direct `Effect.fn` bodies (plain and generator), `gen`, `sync`, `suspend`, and known runtime callback slots are excluded.
The additional exclusions cover `flatMap`, `andThen`, `tap`, `catch`, `catchCause`, `catchTag`, `onExit`, `forEach`,
`withFiber`, `Stream.runForEach`, and `HttpClient.make` transport callbacks. These contracts were checked against
[published Effect 4.0.0 implementation](https://cdn.jsdelivr.net/npm/effect@4.0.0/src/internal/effect.ts),
[Stream](https://cdn.jsdelivr.net/npm/effect@4.0.0/src/Stream.ts), and
[HttpClient](https://cdn.jsdelivr.net/npm/effect@4.0.0/src/http/HttpClient.ts). `Effect.fn` pipeables and
`HttpClient.makeWith` callbacks are **not** runtime-deferred and are not excluded. Ordinary generator and async functions
do not return Effects directly and are not analyzed.

There is **no autofix or rewrite suggestion**: suspension changes exceptions, resource acquisition, and ownership. If
per-execution mutation is intended, manually consider `Effect.suspend` or plain/generator `Effect.fn` on v4. If a counter,
snapshot, or test fixture intentionally records construction, suppress it at the diagnostic site:

```ts
import * as Effect from 'effect/Effect';

let constructed = 0;

function build() {
  // oxlint-disable-next-line 2digits/no-eager-effect-mutation -- Intentionally record construction, not execution.
  constructed++; // eslint-disable-line unicorn/no-top-level-assignment-in-function -- Deliberate construction mutation.

  return Effect.void;
}
```

### Pinned-corpus validation (2026-10-03)

Oxlint 1.86.0 executed only this rule over authored apps/packages/tests TS/TSX, including tests and excluding generated
directories, `.gen.ts`, and build output. Diagnostics count callbacks, not mutation expressions or production defects.

| Pinned corpus                                                                                                      | Files linted | Actual diagnostics | Reviewed eager test positives | Instrumentation candidates | Confirmed timing false positives |
| ------------------------------------------------------------------------------------------------------------------ | -----------: | -----------------: | ----------------------------: | -------------------------: | -------------------------------: |
| [Mezaldy](https://github.com/2digits-agency/mezaldy-shopify-ois/commit/a27cccac8966fadc875c2fa17026eaf42154a401)   |          219 |                  4 |                             3 |                          1 |                                0 |
| [ByLotte](https://github.com/2digits-agency/bylotte-shopify-exact/commit/90ebd6bb1d6628564fe44edee97e77fabc7ee8b7) |           91 |                  0 |                             0 |                          0 |                                0 |
| [BillyBird](https://github.com/2digits-agency/billybird-api/commit/db538e385ef431a3fbbfc9e821d65bb4a9a0b18c)       |          438 |                  0 |                             0 |                          0 |                                0 |

Mezaldy reports `EmailNotifiers.spec.ts:41,46` and `OisCatalogImporter.spec.ts:101`. The additional diagnostic at
`packages/graphql-codegen-effect/src/runtime.ts:153` sets an error-stage marker inside `Match.when`: it is synchronous
construction instrumentation within a running generator, not a proven production bug. It needs intent review or
suppression, not automatic suspension. A first run also flagged `Stream.runForEach`; its verified runtime exclusion and
regression test removed that false positive before the final run.

The issue's ten historical eager test callbacks are separate evidence: three match v1; BillyBird's other seven use five
nested native receivers and two local aliases from `.find`, outside v1 provenance. Zero diagnostics is not proof that
those constructors are lazy. Independent Effect 4 controls verify eager/suspended construction counts of 1/0, two-run
counts of 1/2, and twice-failing retry counts of 1/3; they do not claim that those corpus callbacks currently retry.

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
2. Register it in `src/rules/index.ts`. `src/index.ts` includes it in `recommendedRules` unless its metadata marks it
   opt-in or the Effect language service already covers it.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
