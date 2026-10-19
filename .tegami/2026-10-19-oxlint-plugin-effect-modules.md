---
packages:
  'npm:@2digits/oxlint-plugin': patch
---

### Use Effect modules across rule helpers

- Rule internals now use `effect/Array`, `Option`, `Match`, `Predicate` and `String` instead of hand-written loops, `typeof` checks and if-chains.
- Shared `resolveVariable`, `soleDefinition`, `findAncestor`, `isAnyApi` and `isEqualityOperator` helpers replace copies across rules.
- Fixed hot paths that allocated a new array or matcher on every visited node.
