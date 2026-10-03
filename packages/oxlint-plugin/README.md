# @2digits/oxlint-plugin

Custom [Oxlint JavaScript plugin](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) rules used by
`@2digits/oxlint-config`.

The recommended set is enabled by default by `@2digits/oxlint-config`. The opt-in `prefer-effect-filesystem` and
`prefer-effect-path` rules are excluded because the configured `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those imports more broadly. `no-stale-struct-evolve-keys` is also opt-in while its precision is established.
To register the plugin directly:

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

## Opt-in stale Struct.evolve keys

Enable `2digits/no-stale-struct-evolve-keys` explicitly in your Oxlint rules, or through the config factory:

```ts
import withTwoDigits from '@2digits/oxlint-config';

export default withTwoDigits({ rules: { '2digits/no-stale-struct-evolve-keys': 'error' } });
```

In a Vite+ config, put that configuration in the default export's `lint` field.

The rule reports each updater key absent from a **direct closed target object literal**. Partial transformations are
valid: target keys do not all need an updater. String and numeric keys use exact JavaScript property-key normalization
(`1` and `'1'` match; `'01'` and `1` do not).

```ts
import * as Fn from 'effect/Function';
import * as Struct from 'effect/Struct';

Struct.evolve({ name: 'alice', zip: '00000' }, { name: (s) => s.toUpperCase(), zipCode: () => '12345' });
//                                                                         ^^^^^^^ ignored key
Struct.evolve({ name: (s) => s.toUpperCase(), zipCode: () => '12345' })({ name: 'alice', zip: '00000' });
Fn.pipe({ name: 'alice', zip: '00000' }, Struct.evolve({ name: (s) => s.toUpperCase(), zipCode: () => '12345' }));
```

Both target and updater must be direct literals. V1 deliberately uses the approved **direct-only fallback**: it does
not prove local object immutability and therefore skips **all extracted bindings**, even unannotated `const` objects
or frozen objects. Const alone cannot prove a closed shape after mutations, additions, deletions, escaping aliases or
unknown calls. This also keeps optional/open/union annotations, reusable multi-shape updaters, imported objects and
schema-derived targets silent. The strict compiler/runtime control below demonstrates an extracted-updater failure
mode, not a diagnostic that v1 can emit on that extracted code.

Namespace imports, named imports and import aliases from `effect`, `effect/Struct` and `effect/Function` are resolved
with scope checks. Shadowed and type-only bindings are ignored. Local API aliases, casts, `satisfies`, non-null
assertions, wrappers, optional calls, spreads, computed/symbol keys, getters/setters and prototype-affecting keys
(`__proto__`, `constructor`, `prototype`) are skipped. Only the first transformation in `pipe` is matched; an earlier
step could change the target shape. There is no parser-service, schema or general `keyof` inference.

No fix or rename/deletion suggestion is offered: removing an updater could hide an intended update, and guessing a
renamed field is unsafe.

`test/struct-evolve-control.spec.ts` independently compiles an overlapping extracted updater under a standalone strict
TypeScript configuration and checks the actual npm Effect runtime in data-first, curried and pipe forms. The lockfile
currently pins Effect 4.0.0 and TypeScript 7.0.2; no release-candidate equivalence is claimed. The `name` updater changes
`alice` to `ALICE`, while stale `zipCode` leaves `zip` at `00000`; the correct `zip` updater changes it to `12345`.
This is not a fully disjoint fresh literal rejected by excess-property checking. Run the controls from this package:

```sh
vp test test/rules/effect/no-stale-struct-evolve-keys.spec.ts test/struct-evolve-control.spec.ts test/registration.spec.ts
```

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
   excluded in `optInRules`.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
