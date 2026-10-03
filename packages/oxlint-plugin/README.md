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

### Hashes are bucket hints, not identity

`no-hash-as-identity` reports sole hash equality/inequality, hash-number keys passed to `.get`, `.set`, `.has`, or
`.delete`, and computed dictionary keys. It follows runtime Effect Hash imports and simple, unreassigned local API/value
aliases by lexical binding. Shadowed names, unrelated Hash APIs, type-only imports, destructuring, and reassigned bindings
do not carry that provenance. Method receivers are not type-checked: a known hash key still reports on an unknown receiver.

A narrow full-comparison path is allowed:

```ts
import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';

function equals(a: unknown, b: unknown): boolean {
  if (Hash.hash(a) !== Hash.hash(b)) {
    return false;
  }

  return Equal.equals(a, b);
}

const inBucket = (a: unknown, b: unknown) => Hash.hash(a) === Hash.hash(b) && Equal.equals(a, b);
```

The guard must sit directly in the function body and return `false` (optionally in a single-statement block), followed
immediately by a returned full comparison. The explicit bucket prefilter must use `&&`. Both compare the same two
unreassigned identifier bindings, in either order;
simple hash-value and `Equal.equals` aliases are supported. The unshadowed external `fullEquality(a, b)` helper from the
rule's contract is also recognized as an explicit full comparator; its implementation is the caller's responsibility.
Unknown comparators, intervening statements, other control flow, changed inputs, and property/call inputs do not prove
this exception. Sole hash `!==` is still unsafe: colliding unequal values return `false`.

Effect 4 structurally compares plain objects and arrays. Effect HashMap uses Hash/Equal to distinguish colliding keys;
native Map with numeric hash keys cannot, and native Map with object keys uses reference identity. This rule offers no
autofix or collection/equality substitution because changing those semantics can change cache behavior. It remains in
the recommended error-level set.

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
