# Schema modifiers go in `.pipe`, Schema wrappers are called

Effect v4 lets every single-schema Schema function be written either as a call (`Schema.optionalKey(Schema.String)`) or as a pipe step (`Schema.String.pipe(Schema.optionalKey)`), so codebases drift into mixing both. We enforce one Schema chain style with the recommended `consistent-schema-pipe` Oxlint rule: Schema modifiers and Data-last steps are applied with `.pipe(...)`, while Schema wrappers are called directly, because a wrapper reads as a new structure around its inner schema and a modifier reads as an adjustment of the schema it follows:

```ts
const TurboConfig = Schema.Struct({
  $schema: Schema.String.pipe(Schema.optionalKey),
  globalPassThroughEnv: Schema.Array(Schema.String).pipe(Schema.optional),
});
```

## Considered Options

- **Follow Effect's own grouping.** Effect implements `Array`, `NonEmptyArray`, `NullOr`, `UndefinedOr`, and `NullishOr` the same way as `optionalKey` (as `Struct.lambda`s), so that grouping would pipe `Array` too. Rejected: `Schema.String.pipe(Schema.Array)` hides that the result is a collection, while `NullOr` and friends read naturally as adjustments.
- **Generic rule: every lowercase single-argument Schema function is a modifier.** Rejected for an explicit allowlist, because functions such as `suspend` and `decodeUnknownSync` share that shape without being modifiers.

## Consequences

- The modifier, wrapper, and Data-last step lists are pinned to the Effect version in the workspace catalog and must be revisited when Effect adds Schema functions.
- `pipe(schema, ...)` from `effect` is normalized to `schema.pipe(...)`, but only when the head is recognizably a Schema expression or the first step is a known Schema function, since the rule has no type information.
- Transformations and derived codecs such as `RedactedFromValue`, `OptionFrom*`, `fromJsonString`, and `toCodecJson` count as modifiers, while `Redacted` counts as a wrapper. Calls that pass options, such as `Schema.fromJsonString(S, { space: 2 })`, stay calls because a pipe step cannot carry them.
- `Schema.Opaque<Self>()(schema)` stays a call, because it is the `class X extends Schema.Opaque<X>()(S) {}` idiom.
- Only namespace imports of Schema are recognized; named imports such as `import { optional } from 'effect/Schema'` are out of scope.
