# @2digits/oxlint-plugin

Custom [Oxlint JavaScript plugin](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) rules used by
`@2digits/oxlint-config`.

The recommended set is enabled by default by `@2digits/oxlint-config`. The opt-in `prefer-effect-filesystem` and
`prefer-effect-path` rules are excluded because the configured `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those imports more broadly. `no-json-boundary-type-assertion` is also opt-in; it does not change the default
native `no-unsafe-type-assertion: off` policy. To register the plugin directly:

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

## Opt-in JSON boundary assertions

`2digits/no-json-boundary-type-assertion` reports assertions that give decoded JSON a claimed type without establishing
its shape. Enable it explicitly, for example in a Vite+ config:

```ts
import { defineConfig } from 'vite-plus';

import { recommendedRules } from '@2digits/oxlint-plugin';

export default defineConfig({
  lint: {
    jsPlugins: [{ name: '2digits', specifier: import.meta.resolve('@2digits/oxlint-plugin') }],
    rules: { ...recommendedRules, '2digits/no-json-boundary-type-assertion': 'error' },
  },
});
```

It checks `as` and angle-bracket assertions on global `JSON.parse(...)` and `await receiver.json()`. A Web reader's
receiver must be an identifier resolving to a same-file parameter or local explicitly annotated with the unshadowed
built-in `Response` or `Request`. It rejects value-binding shadows, reassigned receivers, and lexical type-name shadows
from imports, classes, interfaces, aliases, namespaces and generic parameters. Inferred receivers, receiver type aliases,
custom clients and cross-file provenance are intentionally skipped.

```ts
interface User {
  id: string;
}

JSON.parse(raw) as User; // reports
JSON.parse(raw) as unknown as User; // reports once at the final claim
async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T; // reports: arbitrary caller-selected T is not validated
}
```

Parentheses, non-null wrappers and intermediate syntactic `any`/`unknown`/`never` assertions preserve JSON provenance.
A concrete assertion or a call stops traversal: the rule never unwraps a schema decoder to its JSON argument. Terminal
`unknown`, `any`, `void`, `as const` and `satisfies` are excluded, as are simple local aliases to excluded targets. Lexical
generic targets and concrete local aliases/interfaces are included; unresolved, imported or ambiguous named targets are
skipped. Declaration and JavaScript files and assertions without known JSON provenance are excluded.

Use a schema decoder from your project's installed Schema version (for example its existing Effect Schema boundary
decoder), or a user-supplied validator/type guard. Keep JSON as `unknown` until validation succeeds. Changing an `any`
expression to `satisfies` is **not** runtime validation. This diagnostic has no automatic fix or edit suggestions and does
not invent a schema.

Oxlint provides no parser services or TypeScript Program to this plugin. This is syntax/provenance analysis, not
assignability, assertion comparability or flow analysis. It deliberately includes lexical `T`, unlike Effect-TS/tsgo
#749; it does not reproduce that proposal's member-access, claims-nothing-object or double-assertion exclusions, nor the
general signature/any-origin analysis in #750. It intentionally misses alias-carried JSON and unannotated fetch results.
Validation elsewhere followed by an assertion directly on the original JSON expression cannot be recognized; for a
reviewed boundary, use `// oxlint-disable-next-line 2digits/no-json-boundary-type-assertion` with a reason identifying the
validation. Prefer asserting the validated decoder result instead.

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

1. Add one rule file under `src/rules` (or its `alchemy`/`effect` folders) with `defineRule` through `defineSyntaxRule` or
   `defineEffectRule`.
2. Register it in `src/rules/index.ts`. `src/index.ts` includes it in `recommendedRules` unless explicitly excluded as
   opt-in or covered by another diagnostic.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
