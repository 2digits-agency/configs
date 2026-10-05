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

## Endpoint header schema keys

`no-uppercase-http-api-header` reports each static ASCII-uppercase key in a direct Effect v4 endpoint `headers`
fields object. Incoming headers are lowercase, and schema decoding looks up keys exactly:

```ts
import { HttpApiEndpoint } from 'effect/unstable/httpapi';
import * as Schema from 'effect/Schema';

// Diagnosed: the required header is missing to the decoder even when it arrived.
HttpApiEndpoint.get('me', '/me', { headers: { 'X-Api-Key': Schema.String } });
// Valid: the schema matches the lowercase incoming key.
HttpApiEndpoint.get('me', '/me', { headers: { 'x-api-key': Schema.String } });
```

The rule checks options at argument 2 of `get`, `post`, `put`, `patch`, `delete`, `head`, and `options`.
It resolves lexical import bindings from `effect/unstable/httpapi` and its `HttpApiEndpoint` submodule, including
named aliases and namespace imports, and ignores shadowed bindings. Referenced schemas, computed keys, spreads,
duplicate keys, accessors, and ambiguous options objects are outside this initial slice. Curried `make(method)`,
v3 `setHeaders`, native Request/Response/fetch headers, outgoing setters, and native `Headers.get`/`has` are not checked.
Only ASCII uppercase letters are diagnosed; the rule does not normalize non-ASCII names.

There is **no autofix**: renaming a header schema key changes typed contracts and may collide with a lowercase key.
Review the schema and its consumers together. Runtime controls are pinned to Effect 4.0.0-rc.117 through a test-only
dependency alias; this does not change the workspace's Effect version. This is preventive guidance: the historical
agency scan found **zero bad sites and seven valid endpoint schemas**, not seven defects or a runtime outage.

### Function-valued Config defaults

`no-function-config-default` reports inline zero-parameter functions passed to Effect's eager `Config.withDefault` API,
except when the receiving config is locally proven to hold a function:

```ts
import * as Config from 'effect/Config';

Config.withDefault(
  Config.succeed(() => 1),
  () => 2,
);
const config = Config.succeed(() => {
  return 1;
});

config.pipe(Config.withDefault(() => 2));
```

The proof follows same-file `const` receiver aliases with no reassignment and recognizes runtime Config imports from
`effect` and `effect/Config`, including aliases and lexical shadowing. The `succeed` argument must be a function literal;
a nonfunction object containing a function does not qualify. In `.pipe(...)`, only the first operation can use the proof.
Imported, mutable, or otherwise composed configs remain unknown and retain the diagnostic. This is syntax proof, not
general inference of `Config<A>`. Parameterized function defaults remain excluded. There is no autofix: eagerly evaluating
or unwrapping a thunk could change side effects or an intentional function value.

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
