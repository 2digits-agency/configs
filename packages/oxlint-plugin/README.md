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

## Automatic fixes

Run `vp lint --fix` to apply fixes from `prefer-effect-duration`, `no-empty-effect-callback`,
`no-effect-alchemy-barrel-imports`, `prefer-effect-alchemy-namespace-imports`,
`alchemy-no-v1-worker-properties`, and `alchemy-no-deprecated-docker-constraints`.
Fixes skip ambiguous bindings, conflicting properties, and unsupported import references.

## Effect callback completion

`2digits/no-empty-effect-callback` keeps its existing empty-body diagnostic and safe `Effect.never` fix. It also reports
inline, nonempty `Effect.callback` registrations (and the existing v3 `Effect.async` spelling) whose first Identifier
parameter has **zero references to its binding**. Namespace and named-import aliases are supported; shadowed imports
are excluded from the new diagnostic. An underscore-prefixed completion parameter is still checked.

```ts
import * as Effect from 'effect/Effect';

const blocked = Effect.callback((_resume) => {
  server.listen(port);

  return Effect.sync(cleanup);
});
```

Invoking, capturing, forwarding, aliasing, returning, or exporting the completion binding counts as use, including
inside nested functions. Same-spelled shadowing does not. Even an error-only reference is outside this check: a report
is **not proof that every branch hangs**, and absence of a report does not prove completion on every path. The rule
does not perform typechecking, cross-file analysis, or success-path inference.

The new diagnostic skips omitted/destructured/default first parameters, async/generator registrations, `arguments`
capture, direct `eval` (including nested capture), and direct unconditional throws after straight-line statements.
It offers **no fix**: replacing the registration with `Effect.never` could delete side effects and interrupt cleanup.

For deliberate completion-free adapters, prefer `Effect.never` when no registration is needed, or manage the resource
with `Effect.acquireRelease` and a scope. When a callback adapter is intentional, preserve its registration and cleanup
and document a suppression:

```ts
// oxlint-disable-next-line 2digits/no-empty-effect-callback -- Scope-managed listener intentionally never completes.
const listener = Effect.callback((_resume) => {
  server.listen(port);

  return Effect.sync(cleanup);
});
```

The independent runtime controls in `test/effect-callback-runtime.spec.ts` use Effect 4.0.0: unused completion reaches a
timeout and runs its interrupt cleanup; a microtask-resumed control returns `done` and runs resource cleanup. Run them
from this package with `vp test test/effect-callback-runtime.spec.ts`.

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
