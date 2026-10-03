# @2digits/oxlint-plugin

Custom [Oxlint JavaScript plugin](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) rules used by
`@2digits/oxlint-config`.

The recommended set is enabled by default by `@2digits/oxlint-config`. The opt-in `prefer-effect-filesystem` and
`prefer-effect-path` rules are excluded because the configured `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those imports more broadly. `require-managed-runtime-disposal` is also opt-in because runtime lifetime policy
is project-specific. To register the plugin directly:

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

## Opt-in ManagedRuntime ownership check

Enable `2digits/require-managed-runtime-disposal` explicitly in your rules (or pass this override to
`@2digits/oxlint-config`):

```ts
export default {
  rules: {
    '2digits/require-managed-runtime-disposal': 'error',
  },
};
```

The rule reports at `ManagedRuntime.make(...)` for private `const` identifiers directly initialized by that call and
used through `runPromise`, `runPromiseExit`, `runSync`, `runSyncExit`, `runFork`, or `runCallback`. It resolves actual
`effect` / `effect/ManagedRuntime` imports, aliases, and lexical shadowing. Exported runner closures and factories
returning a runner closure can qualify when the runtime itself stays private.

A visible `.dispose` or `.disposeEffect` reference is enough to establish release ownership evidence. Direct calls,
Promise `finally`, SIGTERM/SIGINT callbacks, `Effect.ensuring` / `onExit`, acquire/release cleanup, and simple release
aliases/destructuring remain silent. Async disposal (`[Symbol.asyncDispose]` and `await using`) also remains silent.
The rule does **not** prove that a release reference executes, is awaited, or runs on every exit.

Exporting or returning the runtime or its scope, storing it in a property, passing it to an unknown owner, mutable
bindings/assignments, detached methods, and unresolved aliases are excluded. Other unrecognized references also
suppress the diagnostic rather than guessing who owns the runtime. Unused runtimes and scoped entrypoints such as
`NodeRuntime.runMain` are not diagnosed. Analysis stays within the file using binding references; it does not create a
TypeScript checker or scan other files.

**Missing ownership evidence is not a proven resource leak.** `make` creates scopes but builds the layer lazily.
Completed work does not close the retained managed scope. A resource-bearing layer can therefore retain resources
until disposal, but intentional process/module lifetime may be appropriate. Document that policy with an ordinary
suppression when no shutdown teardown is intended:

```ts
// oxlint-disable-next-line 2digits/require-managed-runtime-disposal -- Intentional process lifetime, no shutdown teardown.
const runtime = ManagedRuntime.make(AppLive);
```

There is **no automatic fix or suggestion**: disposing after one run can break subsequent runs; shutdown or test hooks
depend on the actual owner and execution environment. Provide a visible owner/release hook, use a scoped entrypoint,
or document intentional lifetime.

### Validation on the pinned issue corpus

The built plugin was run with only this rule enabled against first-party TS/JS from the snapshots in
[#2717](https://github.com/2digits-agency/configs/issues/2717), including authored tests, extensions, and root config and
infrastructure source. Hidden tooling, declarations, generated-file headers/directories, vendored code, build output,
and docs were excluded. Fresh eligible/parsed counts differ slightly from the issue's historical scan filters.

| Snapshot                                                                                                           | Parsed files | Diagnostics / missing-release source patterns | Disposed controls |
| ------------------------------------------------------------------------------------------------------------------ | -----------: | --------------------------------------------: | ----------------: |
| [Mezaldy](https://github.com/2digits-agency/mezaldy-shopify-ois/commit/a27cccac8966fadc875c2fa17026eaf42154a401)   |          229 |                                             0 |                 1 |
| [ByLotte](https://github.com/2digits-agency/bylotte-shopify-exact/commit/90ebd6bb1d6628564fe44edee97e77fabc7ee8b7) |           94 |                                             0 |                 1 |
| [BillyBird](https://github.com/2digits-agency/billybird-api/commit/db538e385ef431a3fbbfc9e821d65bb4a9a0b18c)       |          554 |                                             1 |                 1 |

The diagnostic is at BillyBird `apps/api/tests/differential/DifferentialHarness.ts:16:33`, the private
`differentialLiveRuntime` used by `runPromise` at line 835. This is **test tooling**, with no visible release reference;
`NodeFileSystem.layer` alone does not establish a pool/socket leak. All three `scripts/tegami.mts` constructions have
visible disposal and produce no diagnostic. No documented intentional-lifetime suppression or unresolved ownership
escape occurs at these four constructions; intent for the harness is not established by syntax.

Separately, one synthetic resource-bearing reproduction runs against installed Effect 4.0.0 in
`test/managed-runtime-resources.spec.ts`. Independent acquisition/release counters assert `(0, 0)` after make,
`(1, 0)` after each of two completed runs, and `(1, 1)` after awaited disposal. This is not an observed production leak.
RuleTester covers unresolved ownership exclusions; built-plugin smoke tests cover explicit opt-in and one deliberate
process-lifetime suppression.

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
2. Register it in `src/rules/index.ts`. `src/index.ts` automatically includes it in `recommendedRules` unless it is
   explicitly listed as opt-in.
3. Add a matching test file under `test/rules` with valid and invalid `RuleTester` cases.
4. Run `vp test`, `vp check`, and `vp run build`.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
