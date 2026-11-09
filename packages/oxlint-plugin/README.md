# @2digits/oxlint-plugin

Custom [Oxlint JavaScript plugin](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) rules used by
`@2digits/oxlint-config`.

The recommended set is enabled by default by `@2digits/oxlint-config`. The opt-in `prefer-effect-filesystem` and
`prefer-effect-path` rules are excluded because the configured `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those imports more broadly. `prefer-effect-http-status` is recommended at `warn`, because it only names
well-known numbers (see [Effect HTTP modules](#effect-http-modules)); every other recommended rule is an error. To
register the plugin directly:

```ts
import { defineConfig } from 'oxlint';

import { recommendedRules } from '@2digits/oxlint-plugin';

export default defineConfig({
  jsPlugins: [{ name: '2digits', specifier: import.meta.resolve('@2digits/oxlint-plugin') }],
  rules: recommendedRules,
});
```

## Rules

The package exports all rules as `rules`, their names as `RuleName`, and the default configuration as
`recommendedRules`.

- Copied and adapted Effect practices: `avoid-data-tagged-error`, `ban-error-string`,
  `effect-promise-vs-trypromise`, `no-logging-in-catch`, and `throw-in-effect-gen`.
- Effect modules over native or hand-written logic: `prefer-effect-predicate`, `prefer-effect-array-ops`,
  `prefer-equal`, and `prefer-struct-assign`. See [Effect modules over native logic](#effect-modules-over-native-logic).
- Syntax-safe Effect diagnostics proposed in open `Effect-TS/tsgo` issues: the remaining `cors-*`, `dual-*`,
  `no-*`, `prefer-*`, `preserve-*`, and `require-*` Effect rules.
- Effect v4 API guidance for Array, DateTime, Duration, Encoding, FileSystem, Filter, Headers, Match, Path, and Url,
  plus interruptible `Effect.tryPromise` thunks. HttpMethod, HttpStatus, UrlParams and status range checks are covered
  in [Effect HTTP modules](#effect-http-modules).
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

## Effect modules over native logic

These rules only run in files that import Effect, report without autofixes, and complement the `preferEffectArray`,
`preferEffectRecord`, and `preferEffectString` diagnostics from `@effect/tsgo`.

- `prefer-effect-predicate` reports `typeof x === '…'`, comparisons with `undefined` or `null`, and `instanceof` on
  built-ins such as `String`, `Date`, or `Array`, and names the guard to use: `P.isString`, `P.not(P.isNumber)`,
  `P.isNotUndefined`, `P.isNotNullish`, `P.isDate`, or `Arr.isArray`. Two suggestions are not one-to-one rewrites, and
  their messages say so: `instanceof String` (and `Number`, `Boolean`, `BigInt`, `Symbol`) only matches boxed objects
  while `P.isString` matches primitives, and `P.isObjectOrArray` rejects `null`, which `typeof x === 'object'` accepts.
  Checks inside type guards (`(u): u is Foo =>`) and `typeof` on undeclared globals such as `typeof window` are allowed.
  `Array.isArray` is left to `preferEffectArray`.
- `prefer-effect-array-ops` reports `[...new Set(xs)]` and `Array.from(new Set(xs))` (use `Arr.dedupe`), `xs[0]` (use
  `Arr.head`), `.length` compared with `0` (use `Arr.isReadonlyArrayEmpty` or `Arr.isReadonlyArrayNonEmpty`, or
  `Str.isEmpty`/`Str.isNonEmpty` for strings), and `(x) => x.field` passed to any `map` (use `Struct.get('field')`).
  `xs[0]` is skipped when the same function also reads `xs[1]` or another index, because that is tuple access;
  use `Tuple.get` for other tuple reads.
  `.find(…)` is left to `preferEffectArray`, which already suggests `Arr.findFirst` for every native `find`.
- `prefer-equal` reports `&&` chains with two or more same-field comparisons of the same two values (`a.x === b.x &&
  a.y === b.y`, or the `!==`/`||` form). Use `Equal.equals`, which Data and Schema classes implement, or an
  `Equivalence`. Comparisons inside `Equivalence.make` are allowed.
- `prefer-struct-assign` reports object literals that only merge spreads (`{ ...a, ...b }`) or copy one spread with
  overrides (`{ ...user, name }`). Use `Struct.assign`. Literals that mix spreads and properties in another order are
  treated as object building and allowed, as are conditional or inline-object spreads, Schema `.fields` composition,
  and literals with getters or methods. Copies are also allowed when `Struct.assign` would change the result's type:
  overrides with literal values (`{ ...meta, fixable: 'code' }` would widen `'code'` to `string`) and overrides that
  are callbacks with untyped parameters (`{ ...server, addTool: Effect.fn(function* (registration) {}) }`), which
  lose their contextual type. `Struct.assign` also drops a class instance's prototype, so rebuild Schema and Data class
  instances with their constructor.

## Effect HTTP modules

These rules point hand-written HTTP logic at the `effect/http` modules. They only run in files that import Effect and
have no autofixes.

- `prefer-effect-match-status` reports a hand-written 2xx range check on a response, such as
  `response.status < 200 || response.status >= 300` or `res.status >= 200 && res.status <= 299` (also on
  `statusCode`). Use `HttpClientResponse.filterStatusOk`, or `HttpClientResponse.matchStatus` with a `'2xx'` case; on a
  native fetch `Response`, read `response.ok`. A bare `status` variable is skipped, because it is usually a fixture or
  protocol field, and other ranges such as retryable `>= 500` checks are left alone: `HttpStatus` has no range
  predicates.
- `prefer-effect-url-params` reports query strings built by hand, where a value is interpolated or concatenated
  straight after `?key=` or `&key=` (`` `${base}/tags?search=${encodeURIComponent(q)}` ``, `'/users?page=' + page`), and
  `new URLSearchParams()` built from nothing or from an object or array literal. Use `HttpClientRequest.setUrlParam(s)`,
  the `urlParams` request option, or `UrlParams.fromInput` with `UrlParams.toString`. `new URLSearchParams(text)` parses
  a string, which `UrlParams` cannot, so it is allowed, as are tagged templates such as `` sql`…` ``. `.test` and `.spec`
  files are skipped, because tests write raw wire URLs and form bodies on purpose.
- `prefer-effect-http-method` reports an array literal or union type of six or more different HTTP method strings,
  such as `Schema.Literals(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])`. Use the
  `HttpMethod.HttpMethod` type, `HttpMethod.all` or `HttpMethod.isHttpMethod`, which also include `TRACE` and `QUERY`.
  Shorter lists are usually deliberate subsets, such as the safe methods or the methods of one route, and method
  comparisons are left alone: `HttpMethod` has no constants to compare with, and `HttpMethod.hasBody` treats
  `OPTIONS` and `TRACE` as bodyless, so it is not a drop-in for `method === 'GET' || method === 'HEAD'`.
- `prefer-effect-http-status` (warning) reports known status code numbers passed to Effect HTTP APIs:
  `HttpApiSchema.status(404)`, which accepts `'NotFound'` directly, plus `HttpApiSchema.Empty(204)`,
  `{ httpApiStatus: 401 }` annotations, `HttpServerResponse.setStatus(429)` and the `status` option of
  `HttpServerResponse` constructors, which take `HttpStatus.fromLiteral('Unauthorized')`. Plain objects, comparisons and
  test fakes are not checked. It is recommended at `warn` rather than `error`, because it only names numbers every
  reader knows.

- `prefer-effect-cookies` reports cookie logic written by hand: reading or writing `document.cookie`; splitting or
  matching raw cookie text (`request.headers.cookie.split('; ')`, `headers.get('cookie')?.split(';')`,
  `/token=([^;]*)/.exec(cookieHeader)`); building a cookie with interpolated attributes
  (`` `${name}=${value}; Path=/; HttpOnly` `` or `token + '; Max-Age=3600'`); and searching a Set-Cookie string for an
  attribute (`cookie.includes('; Secure')`, `Str.includes('HttpOnly')`). Use `HttpServerRequest` cookies or
  `schemaCookies`, `Cookies.parseHeader`, `Cookies.fromSetCookie` with `Cookies.get(…).options`, `Cookies.makeCookie`
  with `Cookies.serializeCookie`, or `HttpServerResponse.setCookie`. Raw text counts as cookie text when it comes from
  a `get('cookie')` or `get('set-cookie')` header read or a binding or member whose name contains `cookie`. Plain
  Set-Cookie strings are fixtures or expected wire values and are allowed, as are header names in lists and sets and
  Set-Cookie values forwarded unchanged, which `Cookies` would normalize.

## anti-slop Effect rules

Adapted from [`dmmulroy/anti-slop`](https://github.com/dmmulroy/anti-slop/tree/main/src/effect/rules):

- `no-manual-effect-error-tag`: prefer tagged handlers for `_tag` comparisons/switches in broad Effect catches.
- `no-manual-tag-comparison`: prefer Match/Predicate for literal `_tag` comparisons and switches outside those catches,
  plus `kind`, `status` or the discriminants configured with the `discriminants` option. See
  [Effect Match](#effect-match).
- `no-manual-tagged-construction`: prefer existing constructors over literal string `_tag` objects; direct
  `Match.when`/`Match.not` pattern objects are exempt.
- `no-service-constructor-imports`: reject relative named `make[A-Z]` imports outside `.test`/`.spec` files.
- `prefer-effect-match`: also reports chained literal ternaries comparing the same source expression, while retaining
  the existing Effect-file switch diagnostic. In Effect files it also reports `else if` chains; see
  [Effect Match](#effect-match).

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
  `Effect.map((user) => toDto(user))`. APIs whose callbacks receive more than one argument, such as the index of `Array`, `Record`,
  `Effect.forEach` and `Stream.map` or the `Exit` of `Effect.acquireRelease`, are exempt, and so are factory calls other than Effect APIs.
- `no-single-use-private-function`: a non-exported top-level function, or `Effect.fn` constant, that is referenced
  exactly once and is at most `maxLines` lines long (default `3`). Inline it at its call site. Components, hooks,
  type predicates and recursive functions are exempt.
- `no-constant-thunk`: a top-level function without parameters that always returns the same value, such as
  `function userSchema() { return Schema.Struct({…}) }`. Make it a constant or a static on its class. Fresh object
  and array literals, returned functions, mutable object properties, calls outside pure Effect modules, and eager
  calls such as `pipe` or `Option.map` with a local callback are exempt.

`@2digits/oxlint-config` and `@2digits/eslint-config` turn off `unicorn/consistent-function-scoping`, which asks for these helpers to be hoisted.

## Effect Match

These rules push branching on discriminants and Effect data types into `Match` and the data types' own `match`. None
have autofixes.

- `prefer-effect-match` reports, in files that import Effect, an `if`/`else if` chain of two or more tests that each
  compare the same expression against a literal, such as `order.disposition === 'ship'` followed by
  `else if (order.disposition === 'hold')`. Any other test in the chain, or a nested `if` inside a plain `else` block,
  ends the match.
- `no-manual-tag-comparison` always checks `_tag`, plus the `kind` and `status` discriminants by default. Configured
  discriminants replace that default list, so a project can add its own names or drop `kind`/`status` where they are
  plain fields, such as ESTree's `VariableDeclaration.kind`. Comparisons and switches on them are reported everywhere,
  including broad Effect catch handlers, because `Effect.catchTag` only covers `_tag`. The exported
  `NoManualTagComparisonOptions` type describes the option:

  ```ts
  export default {
    rules: {
      '2digits/no-manual-tag-comparison': [
        'error',
        { discriminants: ['kind', 'status', 'disposition', 'productKind'] },
      ],
    },
  };
  ```

- `prefer-hoisted-match` reports a function with one parameter whose whole body builds a value matcher for that
  parameter: `Match.value(x).pipe(…)`, `pipe(Match.value(x), …)`, `Match.valueTags(x, cases)` or
  `Match.valueTags(cases)(x)`. Hoist a `Match.type<…>().pipe(…)` or `Match.typeTags<…>()({…})` constant instead; case
  handlers already receive the narrowed value. For `Match.valueTags`, a named function whose cases do not reference the
  parameter is left to `no-trivial-wrapper`, so only callbacks, anonymous functions and cases that read the parameter are
  reported here. Functions with more parameters, type parameters, `this`, `async` or generator bodies are skipped.
- `prefer-data-match` reports a ternary on `Exit.isSuccess`/`isFailure`, `Result.isSuccess`/`isFailure` or
  `Option.isSome`/`isNone` (also negated), and an `if` on them whose branch and `else` (or the `return` right after it)
  both return a value. Use `Exit.match`, `Result.match` or `Option.match`. Branches that `yield` or `await` are skipped,
  because a match handler cannot hold them.

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
