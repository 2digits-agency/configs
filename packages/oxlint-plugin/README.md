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

## Opt-in TestClock deadlock diagnostic

`2digits/no-testclock-sleep-before-advance` reports a direct positive-duration `Effect.sleep` that blocks the same
generator before a later `TestClock.adjust` or `TestClock.setTime`. It is **not** in `recommendedRules` or the default
`@2digits/oxlint-config` preset. Enable it explicitly:

```ts
import withTwoDigits from '@2digits/oxlint-config';

export default withTwoDigits({
  rules: { '2digits/no-testclock-sleep-before-advance': 'error' },
});
```

The rule resolves runtime imports and aliases from `effect`, `effect/Effect`, `effect/TestClock`,
`effect/testing`, and `effect/testing/TestClock`. It requires an inline `Effect.gen(function* () { ... })` returned
directly by an imported `@effect/vitest` `it.effect` callback, or an inline explicit
`Effect.provide(generator, TestClock.layer())` / `generator.pipe(Effect.provide(TestClock.layer()))`.
Explicit provision is recognized at top level or directly returned by a Vitest `it`/`test` callback.
Block callbacks must contain only the return statement.

```ts
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as TestClock from 'effect/testing/TestClock';
import { it } from '@effect/vitest';

it.effect('blocked', () =>
  Effect.gen(function* () {
    yield* Effect.sleep('1 second'); // Reported: this fiber cannot reach adjust.
    yield* TestClock.adjust('1 second');
  }),
);

it.effect('safe', () =>
  Effect.gen(function* () {
    const fiber = yield* Effect.forkChild(Effect.sleep('1 second'));

    yield* TestClock.adjust('1 second');
    yield* Fiber.join(fiber);
  }),
);
```

This deliberately narrow, checker-free subset accepts only straight-line expression statements delegating directly
to these sleep/advance APIs, each with exactly one literal argument. This excludes clock-driving work nested in
arguments. Sleep durations must be finite positive numeric millisecond literals or decimal strings
with Effect units (`nano` through `week`, singular or plural); values rounding to zero nanoseconds are excluded.
The whole generator is skipped if it contains other statements or calls, including branches, returns, forks,
unknown sleeps, helper effects, or nested generators. It does not follow local effect variables or combine events
across callbacks. `withLive`, live test bodies, wrapping pipelines, and ambiguous concurrent contexts are excluded.
This favors precision over coverage; it does not diagnose all scheduling deadlocks or native fake-timer code.

There is **no autofix**: introducing fork/join changes concurrency and ownership. Review those choices manually.
The runtime regression uses Effect 4.0.0, an independent real-time watchdog, and explicit interruption for cleanup;
a pending poll alone is not proof of an infinite hang.

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
2. Register it in `src/rules/index.ts`. `src/index.ts` includes it in `recommendedRules` unless
   `meta.docs.recommended` is `false` or another diagnostic already covers it.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
