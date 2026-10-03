# @2digits/oxlint-plugin

Custom [Oxlint JavaScript plugin](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) rules used by
`@2digits/oxlint-config`.

The recommended set is enabled by default by `@2digits/oxlint-config`. The opt-in `prefer-effect-filesystem` and
`prefer-effect-path` rules are excluded because the configured `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those imports more broadly. `fork-in-layer-constructor-not-scoped` is also opt-in while its precision is
established. To register the plugin directly:

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

## Opt-in construction-time fiber ownership

Enable `2digits/fork-in-layer-constructor-not-scoped` explicitly in your rules config. It is absent from
`recommendedRules` and the default `@2digits/oxlint-config` preset. With Vite+, put the plugin and rule under `lint`:

```ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
  lint: {
    jsPlugins: [{ name: '2digits', specifier: import.meta.resolve('@2digits/oxlint-plugin') }],
    rules: { '2digits/fork-in-layer-constructor-not-scoped': 'error' },
  },
});
```

The rule checks directly yielded child forks in inline `Effect.gen` constructors passed to `Layer.effect` or
`Context.Service<Self>()('Name', { make: Effect.gen(...) })`. It resolves runtime imports and aliases, respects local
shadowing, and recognizes `yield* Effect.forkChild(loop)`, `yield* loop.pipe(Effect.forkChild)`, and pipeline options
such as `yield* loop.pipe(Effect.forkChild({ startImmediately: true }))`.

Pipeline receivers must resolve to imported `Effect.never`/`Effect.void` or an imported `gen`, `forever`, `sync`,
`succeed`, `fail`, or `sleep` call, directly or through local `const` aliases. Unknown receivers and custom `.pipe`
methods are skipped. Curried options may be inline object literals or a local `const` initialized with one.

In Effect v4, use `Effect.forkScoped` for service startup work: `Layer.effect` absorbs its Scope requirement. In v3,
the rule checks `Effect.fork` in `Layer.effect` and `Layer.scoped`; changing to `forkScoped` introduces Scope, so use
`Layer.scoped` to discharge it. It does not claim that v3 `Layer.scoped` or `Effect.Service` exist in v4.

Only the generator's immediate, straight-line yields and single `const child = yield* ...` bindings are checked.
Returned methods, nested functions, per-event handlers, forked bodies, unexecuted fork expressions, scoped forks,
and daemon/detached forks are excluded. Joined children, ownership passed to unknown helpers, returned fibers,
conditional ownership, and other ambiguous uses of a bound child are skipped. A bare `Fiber.join(child)` expression
does not execute the join. A later `Effect.addFinalizer(() => Fiber.interrupt(child))` does not suppress the diagnostic:
it cannot prevent premature child interruption by the construction fiber. Cross-file constructors, arbitrary
`Effect.fn` flow, and dynamic lifecycle inference are outside this rule's scope.

**No autofix or automatic suggestion edit is offered.** Changing fiber ownership can change service requirements and
v3 layer constructors. Review the diagnostic's `forkScoped` guidance rather than automatically replacing APIs.

The [issue's historical pinned audit](https://github.com/2digits-agency/configs/issues/2738) found zero constructor
defects in the three reviewed production corpora; it is preventive evidence, not a current production-failure claim.
The executable test `test/fork-constructor-runtime.spec.ts` independently builds bad/good v4 layers beside the same
sibling, checks open-scope liveness, and asserts interruption and stopped ticks after scope closure. Tick counts are
not a stable contract. The test also typechecks v3 versus v4 Scope requirements against pinned development dependencies.

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
   excluded; opt-in rules must have an exclusion test.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
