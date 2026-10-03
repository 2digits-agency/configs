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

### `no-discarded-run-promise`

Reports discarded imported `Effect.runPromise(...)` and immediately invoked `Effect.runPromiseWith(context)(effect)`
results, including visible contiguous `.then` / `.finally` / `.catch` chains without explicit rejection handling.
Namespace, barrel and named import aliases are resolved by scope binding; shadowed local values are not Effect APIs.
The outermost Promise is discarded in a bare statement, under `void`, or as a non-final comma operand. Parentheses
and TypeScript expression wrappers do not change that boundary. Awaiting, returning (including implicit arrow
returns), assigning, or passing that Promise to a consumer transfers responsibility and is outside this diagnostic.

```ts
import * as Effect from 'effect/Effect';

// Reported: success callbacks and cleanup propagate rejection to the returned Promise.
void Effect.runPromise(task).then(onSuccess);
void Effect.runPromise(task).finally(cleanup);
void Effect.runPromise(task).then(onSuccess, undefined);

// Explicit rejection handling, or responsibility transferred to a consumer.
// eslint-disable-next-line unicorn/prefer-then-catch -- Both rejection-handling forms are supported by this rule.
void Effect.runPromise(task).then(onSuccess, onFailure);
void Effect.runPromise(task).finally(cleanup).catch(onFailure);
await Effect.runPromise(task).then(onSuccess);
```

Inline callbacks and same-file function handlers in `.catch(handler)` or `.then(onSuccess, handler)` suppress the
diagnostic. Missing callbacks, literal `null`, and unshadowed `undefined` are not handlers, including in `.catch`.
Other rejection-handler expressions are skipped conservatively: an unresolved binding or arbitrary property is not
proven callable. Spread arguments and optional/computed or non-contiguous chains are also skipped. Hoisted runner
aliases, arbitrary Promise APIs, ManagedRuntime receivers, `runPromiseExit*`, and interprocedural flows are not matched.

This detects **absence of explicit failure handling**, not all unhandled rejections. A catch or second-then handler
can throw or return another rejected Promise; later success callbacks or cleanup can also reject. These effects are
not inferred. `test/run-promise-rejections.spec.ts` independently observes exactly two unhandled events for success-only
and finally-only chains, none for its two handling controls, and one each for throwing/rejecting catch controls.

This checker-free rule complements native `typescript/no-floating-promises`. With type-aware linting and default
`ignoreVoid`, the native rule reports bare success-only/finally chains but ignores their `void` variants. Setting
`ignoreVoid: false` also catches the `void` cases; without type-aware linting the native rule reports none. The agency
config retains the native defaults. This plugin checks the narrow imported-Effect boundary without a type checker.

Chain diagnostics have **no autofix**. Await/return the chain, add deliberate rejection handling, or manually redesign
fire-and-forget work with fibers. Renaming the callee to `runFork` breaks Promise chains; deleting callbacks loses
their side effects and comments.

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
2. Register it in `src/rules/index.ts`. `src/index.ts` automatically includes it in `recommendedRules`.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
