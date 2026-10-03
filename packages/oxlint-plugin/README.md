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

## JSON parsing in Effect callbacks

`no-throw-in-effect-callback` reports unguarded global `JSON.parse` in `Effect.andThen`, `map`, `mapError`, `tap`,
`tapError`, and `tapErrorCause` callbacks. It covers inline execution and direct mappers such as
`Effect.map(source, JSON.parse)` and `source.pipe(Effect.map(JSON.parse))`, including Effect import aliases.
The diagnostic points at the parse call or direct mapper reference. Shadowed `JSON` and Effect APIs are excluded.
Exact local `const parse = JSON.parse` aliases are supported when their lexical binding has no subsequent writes;
mutable, destructured, chained, and imported parser aliases are not followed.

Malformed JSON in a mapping callback creates a defect, not a typed failure recovered by `Effect.catch`. Put parsing
inside `Effect.try` and compose the resulting Effect, choosing the application's error contract explicitly:

```ts
const parsed = source.pipe(
  Effect.flatMap((raw) =>
    Effect.try({
      try: () => JSON.parse(raw),
      catch: toParseError,
    }),
  ),
);
```

Here `toParseError` is an application-supplied mapper to the chosen error type. Parsing alone does not validate a domain
schema. The rule offers **no autofix**: selecting an error type or changing composition changes the program's contract.

The parser check stops at nested/deferred functions and attributes nested combinator callbacks to their own combinator;
it does not inspect arbitrary helper bodies. An inner `Effect.try` parser is therefore excluded. Within the mapper,
try bodies with a catch are conservatively skipped, even when the catch rethrows. This parser-only policy does not
change explicit-throw diagnostics. Parses after that try, in its catch/finally, or in a try with only finally still
report unless another local catch guards them. A try around Effect construction does not guard its eventual callback.
The one-argument `JSON.parse(JSON.stringify(value))` clone idiom is also excluded; this is not a guarantee that
stringification cannot throw. Ordinary Promise callbacks and unknown custom parsers are outside this check.

Intentional parser defects require an explicit suppression, including in tests:

```ts
// oxlint-disable-next-line 2digits/no-throw-in-effect-callback -- Intentionally exercise defect handling.
const defective = source.pipe(Effect.map(JSON.parse));
```

The [historical audit in #2741](https://github.com/2digits-agency/configs/issues/2741) found zero mapping defects among
28 reviewed parse calls at pinned application snapshots. This is preventive coverage, not evidence of a current
malformed-request incident.

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
