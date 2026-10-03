# @2digits/oxlint-plugin

Custom [Oxlint JavaScript plugin](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) rules used by
`@2digits/oxlint-config`.

The recommended set is enabled by default by `@2digits/oxlint-config`. The opt-in `prefer-effect-filesystem` and
`prefer-effect-path` rules are excluded because the configured `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those imports more broadly. `no-ambiguous-template-literal-captures` is also opt-in: it targets locally proven
extraction hazards, not whole-string validation. To register the plugin directly:

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

## Ambiguous template literal captures (opt-in)

Enable `2digits/no-ambiguous-template-literal-captures` explicitly alongside `recommendedRules`:

```ts
import { recommendedRules } from '@2digits/oxlint-plugin';

export default {
  jsPlugins: [{ name: '2digits', specifier: import.meta.resolve('@2digits/oxlint-plugin') }],
  rules: {
    ...recommendedRules,
    '2digits/no-ambiguous-template-literal-captures': 'error',
  },
};
```

Adjacent naked `Schema.String` parts have no boundary. If both extracted values matter, one capture may silently be
empty. For example, on Effect 4.0.0:

```ts
import * as Schema from 'effect/Schema';

const Pair = Schema.TemplateLiteralParser([Schema.String, Schema.String]);

export function parse(input: unknown) {
  return Schema.decodeUnknownSync(Pair)(input); // reports at the second Schema.String above
}
parse('helloworld'); // ['helloworld', '']

// A deliberate domain separator changes both the input and the output contract.
const Delimited = Schema.TemplateLiteralParser([Schema.String, '-', Schema.String]);

Schema.decodeUnknownSync(Delimited)('hello-world'); // ['hello', '-', 'world']
```

Choose a separator, width or character restriction appropriate to the domain. There is **no autofix** or suggested
delimiter: inserting one would change the schema's input and tuple contract.

The rule resolves namespace and named import aliases from `effect` and `effect/Schema`, respecting local shadowing.
It only matches an inline parts array with adjacent naked imported String nodes (parentheses are harmless). A visible
`Schema.decodeUnknownSync(Parser)(input)` must return/pass/store the complete tuple, or destructure both offending
slots into referenced bindings whose names do not start with `_`. Literal parts occupy tuple slots: for
`['prefix', Schema.String, Schema.String]`, the relevant destructuring is `[, first, second]`, not `[first, second]`.
The parser must be directly nested or an immutable, unaliased, unexported local `const`.

Validation-only (`Schema.is`, whole-string `Schema.TemplateLiteral`), encoding-only, discarded decoding, omitted or
unused captures and `_ignored` bindings stay clean. A validation use does not hide a separate supported extraction.
Single String parts, genuine separators, numeric/literal/refined/branded/union parts, imported or mutable schemas,
spreads and unresolved consumers are skipped. Saved decoders, arbitrary aliases and cross-file consumers are not
inferred; no compiler Program, type checker or regex ambiguity analysis is used. An empty literal between two String
parts is **outside the adjacent-node matcher**, not proof of a boundary. Native regex, Zod and Valibot templates are
out of scope; fixed-width numeric captures and deliberate splitting are not equivalent hazards.

### Prevention evidence and recall limits

[Issue #2731](https://github.com/2digits-agency/configs/issues/2731) records a historical pinned review of 794 authored
files: **zero vetted violations, zero unresolved candidates**, and one safe gift-card parser with a literal prefix and
bounded numeric part. That review is prevention evidence, not a production decoding failure. The implemented rule's
pinned-corpus scan and synthetic controls are reported separately in the PR; a zero diagnostic count does not establish
recall for unsupported consumers, aliases, empty separators or arbitrary constrained/regex parts.

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
   excluded for opt-in policy.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
