---
packages:
  'npm:@2digits/oxlint-plugin': patch
---

### Fix `consistent-schema-pipe` autofix on optional chains

- `consistent-schema-pipe` no longer rewrites a `.pipe(...)` that an optional chain can skip, such as `config?.item.pipe(Schema.Array)` or `value.pipe?.(Schema.Array)`. Its fix called the wrapper directly, so the call ran even when the chain short-circuited.
- The rule's internals now use `effect/Array`, `Match`, `Option` and `Predicate` instead of hand-written loops and if-chains.
