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
- Alchemy v2 practices: every other `alchemy-*` rule.
- Alchemy Domain modeling rules from the `@alchemy.run/domain` agent skill: the `alchemy-domain-*` rules. See
  [Alchemy Domain models](#alchemy-domain-models).
- Schema compiler hoisting from t3code: `no-inline-schema-compile` reports `Schema.decode*`, `Schema.encode*`,
  `Schema.is`, and `Schema.asserts` compilers that are built and invoked inside a function body when their schema
  could be hoisted to module scope.
- Log results: `no-effect-as-on-log` reports `Effect.as`, `Effect.asSome` and `Effect.asVoid` applied to an
  `Effect.log*` or `Console.*` log effect (`.pipe(Effect.as(x))`, `pipe(log, Effect.as(x))` or data-first). Write
  `Effect.gen` that `yield*`s the log and returns the value instead.
- Local dates: `no-utc-iso-slicing` reports `.slice`, `.substring`, `.substr`, `.split`, `.replace` and `.replaceAll`
  on `x.toISOString()` or `DateTime.formatIso(x)`, and the matching `effect/String` steps in `pipe`, `flow` and
  `.pipe`. Both strings are UTC, so a sliced date is the previous day just after midnight in Europe/Amsterdam. Format
  in an explicit zone with `DateTime.setZone` and `DateTime.formatIsoDate`/`formatIsoZoned`, or `Intl.DateTimeFormat`
  with `timeZone`. It runs in every file, with or without Effect, and `@2digits/eslint-plugin` ships the same rule.
- React Server Components directives: `valid-directive` reports misspelled directives such as `'use Client'` or
  `'use  server'`, which silently do nothing, and `no-export-all-in-client` reports `export *` in a `'use client'`
  module, which Next.js rejects at build time.
- Schema chain style: `consistent-schema-pipe` applies Schema modifiers and data-last steps with `.pipe(...)`
  (`Schema.String.pipe(Schema.optionalKey)`) and calls Schema wrappers such as `Schema.Array(...)` directly. See
  [ADR 0001](../../docs/adr/0001-schema-modifiers-pipe-wrappers-call.md).
- React hydration: `no-browser-api-in-render` reports reads of `window`, `document`, `navigator`, `localStorage` and
  `sessionStorage` (also through `globalThis`) in a component or hook body, or in a `useState`, `useReducer` or
  `useMemo` callback, even behind a `typeof window` guard. Effects, event handlers, other callbacks and
  `useSyncExternalStore` snapshots are allowed. Components are PascalCase functions that contain JSX; hooks are `use*`
  functions. The same rule is `react-extra/no-browser-api-in-render` in `@2digits/eslint-config`.

See each rule's `meta.docs.url` for its upstream rule, issue, or framework documentation. Copied-code attribution is in
[`NOTICE`](./NOTICE).

## Alchemy Domain models

The `alchemy-domain-*` rules check the conventions that keep an [`@alchemy.run/domain`](https://alchemy.run/domain)
model correct. They only look at calls on a `@alchemy.run/domain` import, so other code is unaffected.

- `alchemy-domain-pure-decide` reports time (`Date()`, `Date.now()`, `new Date()`, `Clock.*`, `DateTime.now`,
  `Jwt.verify`), randomness (`Math.random()`, `crypto.randomUUID()`, `Random.*`, `SecureRandom.*`, and the
  `effect/crypto` and `effect/jose` APIs that generate keys, nonces or signatures, such as `Aead.Aead`, `Jwk.generateKeyPair`
  and `Jws.sign`) and I/O (`fetch`, `Effect.promise`, `Effect.tryPromise`, `Jwks.Jwks`) inside an aggregate's `decide`
  handlers. Deterministic crypto (`Digest`, `Mac`, `Kdf`, `KeyFormat`, `Jws.verify`) is allowed. Read time from `decide`'s `now` argument and call external systems from a policy or saga.
- `alchemy-domain-total-handlers` reports `throw` and `Option`/`Result` `getOrThrow*` inside an aggregate's `evolve` and
  `reply` or a view's `evolve`. Keep any state the event can't follow instead. In `decide` it reports them too: return a
  rejection instead.
- `alchemy-domain-require-view-version` requires `version` on every `Domain.View`, so a change to what the view computes
  sits next to the number that must be bumped for the deploy to rebuild it. `version: 0` keeps the current default.
- `alchemy-domain-block-file-name` requires one block per file, named after its kind (`Account.aggregate.ts`,
  `WithdrawMoney.command.ts`, `FraudCheck.external.ts`, `CurrentActor.context.ts`). Events and rejections may share
  the file of the command, external system or stream that uses them; in their own `.event.ts` or `.rejection.ts` file, one per file. Test and story files are skipped.
- `alchemy-domain-pure-imports` restricts block files (`*.aggregate.ts`, `*.command.ts`, `*.middleware.ts`, ...) that
  import `@alchemy.run/domain` to relative imports, `effect` and `@alchemy.run/domain`.

None of them autofix. The rules are syntax-only, so a helper called from `decide` or `evolve` is not followed.

## Endpoint header schema keys

`no-uppercase-http-api-header` reports each static ASCII-uppercase key in a direct Effect v4 endpoint `headers`
fields object. Incoming headers are lowercase, and schema decoding looks up keys exactly:

```ts
import * as Schema from 'effect/Schema';
import { HttpApiEndpoint } from 'effect/unstable/httpapi';

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
Review the schema and its consumers together. Runtime controls use the workspace's Effect version with `@effect/vitest`.
This is preventive guidance: the historical agency scan found **zero bad sites and seven valid endpoint schemas**,
not seven defects or a runtime outage.

### Tests

Use `@effect/vitest` for tests exercising Effect code. Run effects with `it.effect` (or `it.live` when live runtime
services are required), not manual `Effect.run*` calls. RuleTester and synchronous CLI tests use regular `it`.

### Duration constants

`prefer-effect-duration` wraps number literals and literal arithmetic passed as `Duration.Input` to Effect v4 APIs
(`Effect.sleep`, `Effect.timeout`, `Schedule.spaced`, `Schedule.exponential`, `Stream.debounce`, `TestClock.adjust`, the
`duration` option of `Effect.timeoutOrElse`, and others) with `Duration.millis`.

`prefer-effect-duration-constants` reports `const` declarations that hold a duration as a plain number, in files that
import Effect:

```ts
import * as Effect from 'effect/Effect';

const TIMEOUT_MS = 30_000; // Declare it as Duration.seconds(30)
const CACHE_TTL_SECONDS = 3600; // Declare it as Duration.hours(1)
const ONE_DAY = 24 * 60 * 60 * 1000; // Declare it as Duration.days(1)
const wait = 250; // Declare it as Duration.millis(250)

Effect.sleep(wait);
```

A constant is reported when its name ends in a plural or abbreviated unit (`_MS`, `Seconds`, `_MINS`, `_DAYS`) or a
duration word (`TIMEOUT`, `DELAY`, `INTERVAL`, `TTL`, `ONE_DAY`, `maxAge`, `expiresIn`), when it is hand-written time
arithmetic, or when it is passed to an Effect duration API. Only the last word of the name counts, so
`RETRY_DELAY_FACTOR` is not a duration. Names containing `per`, `at`, `epoch`, or `timestamp` (`MS_PER_SECOND`,
`REQUESTS_PER_SECOND`, `CREATED_AT_MS`), zero or negative sentinels, and constants annotated with a `Duration` type are
skipped unless they are passed to a duration API. The suggested constructor uses the unit from the name; Effect's millisecond
interpretation applies only to constants passed to duration APIs. Without a known unit, the message stays generic.

There is **no autofix**: the constant changes from `number` to `Duration`. Convert at non-Effect boundaries with
`Duration.toMillis` or `Duration.toSeconds`, read configurable durations with `Config.Duration`, and use
`Schema.DurationFromMillis` for schema fields.

### Millisecond parameters, fields, and arithmetic

`prefer-effect-duration-types` reports parameters and fields named `*Ms`, `*Millis`, or `*Milliseconds` that are typed as
`number` (optionally `| undefined` or `| null`, or with a number default) or decoded with `Schema.Number`, `Schema.Int`,
or `Schema.Finite` (also inside `optional`, `optionalKey`, `NullOr` and `.check(...)`, or piped only through modifiers,
checks, brands, annotations and defaults):

```ts
import * as Schema from 'effect/Schema';

function poll(intervalMs: number) {} // Type it as Duration.Input
interface Options {
  readonly timeoutMs: number;
} // Type it as Duration.Duration
const Job = Schema.Struct({ backoffMs: Schema.Number }); // Use Schema.DurationFromMillis or Schema.Duration
```

It only targets code the file owns. Callback parameters of non-Effect APIs (`sdk.on('done', (elapsedMs: number) => ...)`),
ambient declarations (`.d.ts`/`.d.mts`/`.d.cts` files and `declare` modules, globals, classes and variables), overload signatures, and timestamp names (`*AtMs`,
`startMs`, `deadlineMs`, `lastSeenMs`) are skipped. For schemas that decode external data, `Schema.DurationFromMillis`
keeps milliseconds in the encoded data while the decoded field is a `Duration`, so the advice also holds at a boundary.

`no-millis-arithmetic` reports `+ - * /`, `< <= > >=`, and `=== !==` when an operand is a millisecond number:
a `Duration.toMillis(...)` or `DateTime.toEpochMillis(...)` call, a `yield* Clock.currentTimeMillis` result, a local
binding named `*Ms`/`*Millis`/`*_MS`, a `this.*Ms` field, or a `const` that holds one of these. The message names the
replacement, such as `Duration.sum`, `Duration.times`, `Duration.isGreaterThan`, `DateTime.addDuration`,
`DateTime.distance`, or `DateTime.isLessThan`:

```ts
import * as DateTime from 'effect/DateTime';
import * as Duration from 'effect/Duration';

Duration.toMillis(timeout) + Duration.toMillis(delay); // Duration.sum
DateTime.toEpochMillis(now) > expiresAtMs; // DateTime.isGreaterThan
const elapsed = endMs - startMs; // DateTime.distance
```

To keep false positives from code that only relays someone else's milliseconds, it ignores fields of other objects
(`response.durationMs`), bindings destructured from objects (`const { durationMs } = response`), callback parameters of
non-Effect APIs, string concatenation, and `=== undefined`/`=== null` presence checks. A conversion passed straight to a
non-Effect API (`setTimeout(run, Duration.toMillis(delay))`) is the intended boundary and is not reported. A chain such as
`toMillis(a) + toMillis(b) > limitMs` is reported once.

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

## anti-slop Effect rules

Adapted from [`dmmulroy/anti-slop`](https://github.com/dmmulroy/anti-slop/tree/main/src/effect/rules):

- `no-manual-effect-error-tag`: prefer tagged handlers for `_tag` comparisons/switches in broad Effect catches.
- `no-manual-tag-comparison`: prefer Match/Predicate for literal `_tag` comparisons and switches outside those catches.
- `no-manual-tagged-construction`: prefer existing constructors over literal string `_tag` objects; direct
  `Match.when`/`Match.not` pattern objects are exempt.
- `no-service-constructor-imports`: reject relative named `make[A-Z]` imports outside `.test`/`.spec` files.
- `prefer-effect-match`: also reports chained literal ternaries comparing the same source expression, while retaining
  the existing Effect-file switch diagnostic.

All are included in `recommendedRules`, without autofixes. Like upstream, these are syntactic policies: they do not
require Effect imports, infer tagged types, or prove that constructors exist. Catch and pattern exemptions recognize
the literal `Effect`/`Match` identifiers, not aliases or shadowing. Constructor imports are matched by imported name
(including aliases), not return type; package/absolute imports are excluded. The switch rules can overlap with the
existing `prefer-effect-match` diagnostic.

## Wrapper and helper rules

These rules report functions that only add an indirection, so the underlying call or value is used directly:

- `no-trivial-wrapper`: a named function whose body returns one call that receives every parameter unchanged and in
  order, such as `function isUser(input) { return Schema.is(User)(input) }` or
  `const logStep = (message) => Effect.logDebug(message)`. With fixed extra arguments, such as
  `function render(value) { return Match.valueTags(value, cases) }`, it only reports Effect APIs, which have a constant
  to hoist (`Match.typeTags`, `Schema.is(User)`). Method calls that need their `this`, such as `set.has(value)`, are
  exempt. Type predicates are exempt unless they wrap an Effect guard on an untyped or `unknown` parameter.
- `no-forwarding-lambda`: a callback of an Effect API that only forwards its parameters, such as
  `Effect.map((user) => toDto(user))`. Modules and members that pass an index or key as a second argument, such as
  `Array`, `Record` and `forEach`, are exempt.
- `no-single-use-private-function`: a non-exported top-level function, or `Effect.fn` constant, that is referenced
  exactly once and is at most `maxLines` lines long (default `3`). Inline it at its call site. Components, hooks,
  type predicates and recursive functions are exempt.
- `no-constant-thunk`: a top-level function without parameters that always returns the same value, such as
  `function userSchema() { return Schema.Struct({…}) }`. Make it a constant or a static on its class. Fresh object
  and array literals, returned functions and calls outside pure Effect modules are exempt.

`@2digits/oxlint-config` and `@2digits/eslint-config` turn off `unicorn/consistent-function-scoping`, which asks for these helpers to be hoisted.

## Automatic fixes

### Statement spacing (opt-in)

`padding-line-between-statements` adapts anti-slop's vendored ESLint Stylistic rule. It is excluded from
`recommendedRules`: enable it with an explicit policy. Later matching entries override earlier entries.

```ts
export default {
  rules: {
    '2digits/padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'return' },
      { blankLine: 'always', prev: ['const', 'let'], next: '*' },
      { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },
    ],
  },
};
```

Options accept `always`, `never`, or `any`, statement names (including TypeScript declarations and
`singleline-*`/`multiline-*` variants), arrays, or `{ selector: 'ExpressionStatement', lineMode: 'multiline' }` AST selectors.
Selectors must match statement nodes (for example `ExpressionStatement[expression.type="CallExpression"]`), not their
nested expressions. See the [upstream statement names](https://eslint.style/rules/padding-line-between-statements).
Autofixes preserve trailing comments and avoid collapsing multiple blank-line gaps separated by comments.
The exported `PaddingLineOption` type describes each configuration entry. No options means no diagnostics.

### Other fixes

Run `vpr lint:oxlint:fix` from the repository root to apply fixes from `consistent-schema-pipe`, `prefer-effect-duration`, `no-empty-effect-callback`,
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
4. Run `vpr test` and `vpr build` in this package, then `vpr check` from the repository root.

`defineEffectRule` resolves namespace and named imports from `effect`, `@effect/*`, and `alchemy/*` entrypoints, so rules
should match canonical API paths instead of hard-coding local import names.
