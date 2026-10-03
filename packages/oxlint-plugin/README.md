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

### Ignored response-only retry predicates

`no-ignored-response-only-retry-predicate` reports one diagnostic at `while` when an imported Effect v4
`HttpClient.retryTransient` receives direct options with literal `retryOn: 'response-only'` and a `while` property.
It recognizes named/namespace aliases from `effect/unstable/http`, `effect/unstable/http/HttpClient`,
`effect/http`, and `effect/http/HttpClient`, rejecting shadowed and type-only bindings. Options must be argument 0
in the pipeable form or argument 1 in the data-first form:

```ts
import * as HttpClient from 'effect/http/HttpClient';

client.pipe(HttpClient.retryTransient({ retryOn: 'response-only', while: predicate }));
HttpClient.retryTransient(client, { retryOn: 'response-only', while: predicate });
```

In this mode, response retries use Effect's transient-status check and never invoke `while`. Review the intended
policy manually: changing to `errors-and-responses` still does not apply `while` to response retries. There is no
autofix or suggestion because removing the predicate or changing modes can broaden retries or lose intended policy.

The rule skips variable options, nonliteral modes, any spread/computed/duplicate key, unsupported
arities, older `mode` spelling, and v3 `@effect/platform` imports. Default, `errors-only`, and `errors-and-responses`
remain silent, as do `Effect.retry`, unrelated clients, and manual 401 recovery. Both `while: predicate` and
`'while': predicate`, as well as method-style `while() { ... }`, are supported; `{ while }` shorthand is not legal
JS/TS because `while` is a reserved word.

No-network tests execute the current `effect@4.0.0` barrel/subpath APIs in both arities: a client returning 503 with
two retries and a false predicate makes three attempts and zero predicate calls; a non-transient error client in
`errors-only` makes one attempt and one predicate call. The issue's earlier rc.117 reproduction and zero matches
in pinned agency repositories are historical evidence, not a fresh agency audit or evidence of a current incident.

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
