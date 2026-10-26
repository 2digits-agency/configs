# Effect diagnostics

`@2digits/tsconfig/effect.json` enables the Effect language service (`@effect/tsgo`) and sets most rules to `error`, so they fail `tsc`. Each one prints as `error TS3771xx: <message> effect(ruleName)`. The message names the replacement API; the rule docs are at `https://github.com/Effect-TS/tsgo/blob/main/docs/rules/<kebab-case-rule>.md`.

Suggestions (`missingPipeableSignature`) and messages (`strictEffectProvide`) do not fail the type check; leave them alone unless asked.

Module aliases come from `importAliases`: `Arr` (Array), `Bool`, `Eq` (Equal), `Fn` (Function), `Num`, `Opt` (Option), `P` (Predicate), `R` (Record), `Str` (String).

## `schemaClassMissingBrand`

Add the brand as the second type argument:

```ts
export class Payment extends Schema.Class<Payment, { readonly brand: unique symbol }>('Payment')({
  amount: Schema.Finite,
}) {}

export class NotFound extends Schema.TaggedError<NotFound, { readonly brand: unique symbol }>()('NotFound', {
  id: Schema.String,
}) {}
```

`Schema.Class<…>('Id')` takes no extra `()`; `Schema.TaggedError` and `Schema.TaggedClass` do. Branding makes plain object literals stop matching, which shows up as `TS2741` / `TS2322: Property 'brand' is missing in type '{…}' but required in type 'Payment'` everywhere a literal stood in for the class. Fix every site by constructing with `Payment.make({ ... })`, including nested values (`lines: Arr.map(input.lines, (line) => Line.make(line))`). In tests, type the raw input as `satisfies typeof Payment.Encoded` and pass it to `make`. `Schema.decodeUnknownSync(Payment)({...})` throws the type away and trips `schemaSync`.

## `newSchemaClass`

`new Payment({...})` → `Payment.make({...})`.

## `preferSchemaTaggedError` and `extendsNativeError`

`Data.TaggedError` or `class X extends Error` → a branded `Schema.TaggedError` with schema fields, for example `cause: Schema.Defect()`.

## `preferNamespaceImport`

Packages listed in `namespaceImportPackages` (`effect`, `@effect/*`, `alchemy`, …) are imported one module at a time as namespaces:

```ts
// before
import { HttpClient, HttpRouter } from 'effect/http';
// after
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpRouter from 'effect/http/HttpRouter';
```

After the import change, update every use that relied on the named binding:

- A type: `RuntimeContext` → `RuntimeContext.RuntimeContext`. Otherwise you get `TS2709: Cannot use namespace as a type` plus `TS6133`.
- A service tag: `yield* HttpServerRequest` → `yield* HttpServerRequest.HttpServerRequest`.
- A function: `constant(x)` → `Fn.constant(x)`.

`barrelImportPackages` (`@effect/vitest`) is the exception: import those from the package root.

## `preferEffectArray`, `preferEffectRecord`, `preferEffectString`

Replace native methods with the Effect module function. Read the caveat in each message, because the signatures differ:

- `Arr` and `R` are data-first: `xs.map(f)` → `Arr.map(xs, f)`, `xs.reduce(f, init)` → `Arr.reduce(xs, init, f)`, `Object.entries(o)` → `R.toEntries(o)`.
- `xs.find(p)` → `Arr.findFirst(xs, p)` returns `Option`. Adapt the caller instead of unwrapping with `getOrThrow`.
- `Arr.flatMap` needs the callback to return an array; native `flatMap` silently accepted a bare value.
- `Str` functions are **curried only**: `s.includes('x')` → `Str.includes('x')(s)`, or pass `Str.includes('x')` as a predicate. In `Str.includes(a, b)` the second argument is the start position, so it compiles to the wrong check.
- `Str.indexOf` returns `Option<number>`; `Str.split` returns a `NonEmptyArray`.
- `R.toEntries` / `R.keys` keep literal key types. When a later `Map.get(someString)` stops compiling (TS2345), widen the container (`new Map<string, string>(R.toEntries(x))`). For objects that are not records (unions of object literals), use `Struct.keys`.

## `nodeBuiltinImport`

Use the Effect service: `node:fs` → `FileSystem`, `node:path` → `Path`, `node:child_process` → `ChildProcess` (`effect/process`), `node:crypto` → `Crypto`. Provide the platform layer (for example `NodeServices.layer` from `@effect/platform-node`) at the entry point. A service the code now needs changes the handler's requirements; resolve it once while building the layer (`Layer.unwrap(Effect.gen(...))`), not per request.

When there is no Effect counterpart (`timingSafeEqual`, `node:http` `createServer` for `NodeHttpServer`), keep the import with a scoped directive and a reason:

```ts
// Effect has no constant-time equality.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { timingSafeEqual } from 'node:crypto';
```

## `preferSchemaOverJson`, `schemaSync`, `schemaSyncInEffect`, `preferTypedSchemaDecoder`

- `JSON.stringify` / `JSON.parse` → a schema codec hoisted to module level: `const encodeOption = Schema.encodeEffect(Schema.Unknown.pipe(Schema.fromJsonString))`, then `yield* encodeOption(value)`.
- `*Sync` decoders inside Effect code → the `*Effect` variants (`Schema.decodeEffect`, `Schema.encodeEffect`).
- `decodeUnknown*` on input that already has the schema's `Encoded` type → `decodeEffect` / `decodeSync`.

## `schemaNumber`

Use `Schema.Finite` (or `Schema.FiniteFromString`) in schema fields. Runtime `typeof x === 'number'` checks become `Predicate.isNumber`, not `Schema.is(Schema.Number)`.

## `effectFnOpportunity`

A function that returns `Effect.gen(...)` → `const run = Effect.fn('Module.run')(function* (input: Input) { ... })`.

## `processEnvInEffect`, `globalDate`, `globalConsole`, `globalFetch`, `globalRandom`, `globalTimers`

Use the Effect service: `Config.String('NAME')` for env vars, `Clock` / `DateTime` for dates, `Effect.log` for console output, `HttpClient` for fetch, `Random`, and `Effect.sleep` / `Schedule` for timers.

## Suppressing a rule

Suppress only when no Effect API exists for the job, and always on the narrowest scope with a reason:

- one line: `// @effect-diagnostics-next-line ruleName:off`
- a whole file (for example a fake HTTP client in tests): `/** @effect-diagnostics ruleName:skip-file */`
