# Effect rules (`2digits/*`)

These rules come from `@2digits/oxlint-plugin` and fire only in files that import `effect` or `alchemy`. That is why
adding an Effect import to a file can surface `2digits/*` errors on code that was clean before: they are caused by the
change, fix them in the same change.

## Autofixed

`--fix` handles these; let it rename instead of editing by hand.

- `2digits/prefer-effect-alchemy-namespace-imports`: namespace imports with fixed aliases: `Arr` (Array), `Bool`, `Eq`,
  `Fn` (Function), `Num` (Number), `Opt` (Option), `P` (Predicate), `R` (Record), `Str` (String). Value imports such as
  `import { constant } from 'effect/Function'` become `Fn.constant`.
- `2digits/no-effect-alchemy-barrel-imports`: import modules from their subpath
  (`import * as RuntimeContext from 'alchemy/RuntimeContext'`), then qualify uses (`RuntimeContext.RuntimeContext`).
  Type-only imports and `SCREAMING_SNAKE` values such as `ALCHEMY_DEV` may stay on the barrel. To import
  `ALCHEMY_DEV` from a subpath, it lives in `alchemy/Phase` (`Phase.ALCHEMY_DEV`); there is no `alchemy/ALCHEMY_DEV`.
- `2digits/consistent-schema-pipe`, `2digits/prefer-effect-duration`, `2digits/no-empty-effect-callback`.

## By hand

### `2digits/effect-promise-vs-trypromise` and `2digits/require-try-promise-abort-signal`

`Effect.promise` becomes `Effect.tryPromise`, and the thunk takes the `AbortSignal` and passes it on:

```ts
Effect.tryPromise({
  try: (signal) => fetch(url, { signal }),
  catch: (cause) => RequestFailed.make({ cause }),
});
```

Name it `_signal` only when the API cannot be cancelled (WebCrypto `crypto.subtle`, D1, a JWT verify). Keep `async`
when the body awaits: `Effect.tryPromise(async (_signal) => { ... })`.

### `2digits/ban-error-string`

`String(error)`, `` `${error}` `` and `error.toString()` lose the error. Keep it: pass it as a field (`{ error }`,
`{ cause }`), print an Effect cause with `Cause.pretty(cause)`, or wrap it with `new Error('message', { cause })`.
`JSON.stringify(error)` is not a fix.

### `2digits/preserve-caught-error`

A `catch`/`mapError` handler builds a new error and drops the caught one. Take the parameter and attach it:
`Effect.mapError((cause) => DecodeFailed.make({ cause }))`. When the error is not needed at all, drop it instead of
inventing one (`Effect.option`, then branch on `Opt.isNone`).

### `2digits/throw-in-effect-gen`

Inside `Effect.gen`, `return yield* Effect.fail(new MyError(...))` with a tagged error, or `Effect.die(...)` for a
defect. In tests, `expect.unreachable('...')`.

### `2digits/avoid-data-tagged-error`

Use `Schema.TaggedError` (there is no `Schema.TaggedErrorClass` in Effect 4.0):

```ts
class CacheWarmFailed extends Schema.TaggedError<CacheWarmFailed>()('CacheWarmFailed', {
  status: Schema.Finite,
  message: Schema.String,
}) {}
```

The body takes schema fields, not `readonly x: T` declarations; construct with `CacheWarmFailed.make({...})`.

### `2digits/require-schema-class-brand`

`Schema.Class<Foo, { readonly brand: unique symbol }>('Foo')({...})`. Plain object literals then no longer type as `Foo`:
build them with `Foo.make(...)` or decode them.

### `2digits/prefer-effect-match`

Applies to `switch` and chained literal ternaries. Use `Match.value(x).pipe(Match.when(...), Match.exhaustive)`,
`Match.whenOr('SALE', 'CAPTURE')` for grouped cases, `Match.tags` for tagged unions, `Match.orElse` for a default.

### `2digits/no-manual-tag-comparison` and `2digits/no-manual-tagged-construction`

`x._tag === 'Foo'` becomes `P.isTagged(x, 'Foo')`, `Opt.isNone(x)`, `Exit.isSuccess(exit)` or a `Match.tag` branch. A
literal `{ _tag: 'Foo', ... }` becomes the existing constructor (`Foo.make(...)`, a `Data.taggedEnum` variant).

### `2digits/no-logging-in-catch`

Log in `Effect.tapError(...)`, then recover in `Effect.catch(...)`. To log and swallow: `Effect.tapError(...)` followed
by `Effect.ignore`.

### `2digits/no-inline-schema-compile`

Hoist `Schema.decodeUnknownEffect(X)`, `Schema.is(X)` and friends to a module-level `const` and call that in the body.

### `2digits/prefer-effect-datetime`

`date.toISOString()` becomes `DateTime.makeUnsafe(date).pipe(DateTime.formatIso)`.

### `2digits/no-service-constructor-imports`

It matches by name: a named relative import of `make[A-Z]...` outside `*.spec`/`*.test` files. Import the owning Layer
or yield the service. If the factory has no owning service, give it a name that says what it builds and import it as a
namespace (`TokenDurableObject.define(...)`); renaming only to dodge the rule was rejected in review.
