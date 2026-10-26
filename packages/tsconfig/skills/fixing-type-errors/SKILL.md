---
name: fixing-type-errors
description: Fixes type errors raised by the strict @2digits/tsconfig compiler options and the effect.json Effect diagnostics (`effect(ruleName)`, TS3771xx). Use when `tsc`, `tsgo` or a `types` script fails in a project that extends @2digits/tsconfig.
---

Fix each error by giving the checker a proof: narrow the value, construct it with the right type, or change the import. The fix must keep runtime behavior unless the error exposed a real bug. Escape hatches only move the error into runtime, so they are out: `as` casts, non-null `!`, `any`, `@ts-ignore` / `@ts-expect-error`, widening a type until it compiles, or turning a compiler option off.

Errors ending in `effect(ruleName)` come from the Effect language service enabled by `@2digits/tsconfig/effect.json`. For those, read [effect-diagnostics.md](effect-diagnostics.md).

## Compiler options

### `noUncheckedIndexedAccess`

`arr[i]`, `record[key]`, destructured array elements and `.split()` results are `T | undefined`.

- `TS18048: 'first' is possibly 'undefined'.`
- `TS2345: Argument of type 'User | undefined' is not assignable to parameter of type 'User'.`
- `TS2322: Type 'number | undefined' is not assignable to type 'number'.`

Fix, in order of preference:

1. Use an API that already proves non-emptiness. A `NonEmptyArray` (from `Arr.groupBy`, `Str.split`, a `[T, ...Array<T>]` tuple) indexes at `[0]` without `undefined`. Use `Arr.headNonEmpty` and `Arr.lastNonEmpty`, or split with `const [head, tail] = Arr.unprepend(xs)`.
2. Make absence a value: `Arr.head(xs)`, `Arr.get(xs, i)` and `Arr.findFirst(xs, p)` return `Option`. Without Effect, use `xs.find(...)` and branch on `undefined`.
3. Guard and handle the missing case: `const user = users[0]; if (user === undefined) { return ...; }`. Optional chaining (`map.get(k)?.name`) is fine when `undefined` is a valid result.
4. Iterate instead of indexing: `for (const [i, u] of users.entries())`.

Use `?? fallback` only when the fallback is the correct domain value. A `''` or `0` that just silences the error is a hidden bug.

### `verbatimModuleSyntax`

`TS1484: 'User' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.`

Write `import { type User, make } from './types'`, or `import type { User } from './types'` when every name is a type. A type-only namespace is `import type * as KeyValueStore from 'effect/persistence/KeyValueStore'`, used as `KeyValueStore.KeyValueStoreError`.

### `erasableSyntaxOnly`

`TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.` It flags syntax that emits JavaScript: `enum`, `namespace` with values, constructor parameter properties (`constructor(private readonly url: string)`) and `import x = require()`.

- `enum`: use a `const` object with `as const` plus `type Color = (typeof Color)[keyof typeof Color]`, or a union of string literals. In Effect code, use `Schema.Literals([...])`.
- Parameter properties: declare the field and assign it in the constructor.
- Value `namespace`: use a module with top-level exports.

### `allowImportingTsExtensions` is not enabled

`TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.`

`moduleResolution: "Bundler"` resolves extensionless paths, so `import { helper } from './helper'` works. Projects that write `.ts` imports turn `allowImportingTsExtensions` on in their own base tsconfig. A package whose tsconfig extends `@2digits/tsconfig` directly misses that setting; extend the project's base tsconfig instead (for example `"extends": "../../tsconfig.base.json"`).

### `noUnusedLocals` and `noUnusedParameters`

`TS6133: 'x' is declared but its value is never read.`

Delete the dead variable or import. For a parameter a signature requires, prefix it with `_` (`_event`). TS6133 on a namespace import that is used only as a bare type (`Effect.context<RuntimeContext>()`) comes with `TS2709: Cannot use namespace 'RuntimeContext' as a type`. The fix is to reference the member, `RuntimeContext.RuntimeContext`, not to delete the import.

### `noImplicitReturns`

`TS7030: Not all code paths return a value.` Return in every branch, including the fall-through after the last `if`. Give the function an explicit return type so a missing case shows up as a type error.

### `noFallthroughCasesInSwitch`

`TS7029: Fallthrough case in switch.` End each non-empty `case` with `return`, `break` or `throw`. To share a body, stack empty `case` labels.

### `noImplicitOverride`

`TS4114: This member must have an 'override' modifier because it overrides a member in the base class 'Base'.` Add `override` (`override greet()`). If the method was not meant to override anything, rename it.

## Recurring traps

- **Readonly types used as accumulators.** `TS2542: Index signature in type 'JsonObject' only permits reading` and `TS2540: Cannot assign to 'x' because it is a read-only property`. Build the value in one expression, or accumulate into a mutable type (`const fields: Record<string, Json> = {}`, `Types.Mutable<Shape>`) and return it as the readonly type.
- **Annotating a value to make an error go away.** Annotating an inferred `defineConfig(...)` result as its wide config type loses the precise inferred keys and causes more errors (TS18048, TS7053). Index the source you control (the typed `rules` object), or narrow with a guard.
- **Literal types widened by removing an annotation.** Without a return type, `{ status: 'OK' }` becomes `status: string` (TS2322 at the caller). Keep or add the named return type.
- **Header or option objects that gain keys conditionally** (TS2339/TS7053). Pick between two fully typed shapes: `etag === null ? base : { ...base, 'If-None-Match': etag }`.
