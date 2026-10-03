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

## Opt-in error-contract suggestion

`no-erased-error-annotation` is a suggestion, **not enabled by `recommendedRules`**. Wider public error contracts can be
intentional. Enable it explicitly at warning level, for example in `vite.config.ts`:

```ts
import { defineConfig } from 'vite-plus';

import { recommendedRules } from '@2digits/oxlint-plugin';

export default defineConfig({
  lint: {
    jsPlugins: [{ name: '2digits', specifier: import.meta.resolve('@2digits/oxlint-plugin') }],
    rules: { ...recommendedRules, '2digits/no-erased-error-annotation': 'warn' },
  },
});
```

The rule reports once at `E` in an explicit imported `Effect.Effect<A, E, R>` return annotation when a single-return
function (or expression arrow) directly constructs `Effect.tryPromise`, `Effect.try`, `Effect.fail`, or `Effect.gen`
and ends its `.pipe(...)` with `Effect.orElseSucceed(...)`, `Effect.ignore`, or `Effect.orDie`. Import aliases, namespace
imports, and named imports from `effect` and `effect/Effect` are supported; shadowed bindings are excluded.

The annotation subset is syntax-only: a capitalized type reference without type arguments, a qualified reference such
as `Errors.ProfileError`, or a union entirely of those references. Generic parameters from the function or its enclosing
functions/classes are excluded. Type aliases are not expanded, and no TypeScript checker or body-wide inference is used.
`never`, `any`, `unknown`, other type syntax, declaration-only signatures, casts, arbitrary receivers, complex control
flow, and pipelines with stages after the terminal operator are outside this slice. Stream and Layer are not inspected.

Removing the **typed error channel does not guarantee success**: defects and interruption remain possible.
`orDie` converts typed failures into defects. This rule never fixes annotations or removes callers' error handlers.
Keep a deliberately wider contract with a documented suppression on the annotation line:

```ts
// oxlint-disable-next-line 2digits/no-erased-error-annotation -- Preserve the public error contract for compatibility.
export function compatible(): Effect.Effect<string, ProfileError> {
  return Effect.fail(new ProfileError()).pipe(Effect.orElseSucceed(() => ''));
}
```

The built-plugin smoke fixture in `test/fixtures/erased-error-annotation` contains three synthetic stale annotations,
a narrowed annotation, and a suppressed wider contract. These are test diagnostics, not additional corpus findings.
Issue #2721 records one historical BillyBird annotation pattern and one separate downstream candidate, with no observed
production failure. The tests independently check Effect's inferred error types and the `orDie` defect behavior using
the repository's Effect version.

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
2. Register it in `src/rules/index.ts`. `src/index.ts` automatically includes it in `recommendedRules`, unless
   `meta.docs.recommended` is `false` or it is covered by Effect tsgo.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
