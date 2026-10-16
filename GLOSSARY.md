# 2digits configs

Shared tooling configs and custom Oxlint rules that encode how 2digits projects write TypeScript and Effect code.

## Language

### Effect Schema composition

**Schema chain**:
A single schema expression built from a head schema followed by an ordered sequence of steps, regardless of whether it is written as nested calls, `.pipe(...)`, or `pipe(...)`.
_Avoid_: Pipeline, schema expression

**Schema modifier**:
A Schema function that takes one schema and adjusts how it is present, typed, or encoded, without nesting it inside a new structure (`optionalKey`, `NullOr`, `mutable`, `RedactedFromValue`).
_Avoid_: Wrapper, combinator

**Schema wrapper**:
A Schema constructor that takes one schema and puts it inside a new structure, such as a collection or option (`Array`, `ReadonlySet`, `Option`, `Redacted`).
_Avoid_: Container, collection constructor, modifier

**Data-last step**:
A configured Schema function that still awaits the schema it applies to, such as `Schema.check(filter)` or `Schema.brand('UserId')`.
_Avoid_: Curried call, operator
