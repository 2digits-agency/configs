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

## Duplicate Effect HTTP API endpoints

`no-duplicate-http-api-endpoints` reports duplicate literal endpoint names and exact HTTP method/path pairs in one
`HttpApiGroup.make(...).add(...)` builder chain. The later registration receives the diagnostic, with the earlier
registration's line and column in its message. A registration duplicating both identities receives two diagnostics.

The rule resolves runtime namespace/named imports and aliases by lexical binding from `effect/http-api`,
`effect/unstable/httpapi`, and `@effect/platform`, including their `HttpApiGroup` and `HttpApiEndpoint` submodules.
It follows same-file `const` endpoint bindings and transparent `.middleware(...)` / `.annotate(...)` chains. V4 supports
variadic `.add(a, b)`; platform v3 uses successive `.add(a).add(b)` calls. Constructors use `(name, path)` or curried
`make(method)(name, path)`, with `delete` in v4 and `del` in platform v3.

```ts
import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api';

const Users = HttpApiGroup.make('users').add(
  HttpApiEndpoint.get('list', '/users'),
  HttpApiEndpoint.get('copy', '/users'), // Duplicate GET /users.
);
```

Groups remain independent, even when their names or endpoints are identical. GET and POST on the same path are valid.
Root and trailing-slash routes, including GET + POST `/auth/login/`, are preserved. Paths are compared literally: no
slash, case, parameter-name, or prefix normalization. Group `.prefix(...)` ends comparisons with earlier route paths
but preserves name comparisons; the rule does not infer effective prefixed paths or cross-group API composition.

Dynamic names/paths, factories, cross-file endpoints, mutable/reassigned bindings, spread contents, tagged platform
paths, unknown transformations, and builder chains reached through group bindings are outside this bounded matcher.
Express handlers and repeated `.handle(...)` registrations are not matched. No autofix is offered because choosing a
public name/path requires intent.

The pinned agency review in [#2733](https://github.com/2digits-agency/configs/issues/2733) found **zero duplicate defects**;
it is historical preventive evidence, not a claim about current applications. The independent Effect 4.0.0 runtime
tests reproduce duplicate-router build failure and successful distinct-method, intentional login-slash, and independent
router controls. They do not establish broader matcher coverage or route equivalence.

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
