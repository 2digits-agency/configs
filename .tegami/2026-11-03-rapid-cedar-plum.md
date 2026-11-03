---
packages:
  'npm:@2digits/tsconfig': patch
---

## Update Effect language-service diagnostics

- Added `effectSucceedWithUndefined`, `effectTryWithoutCatch`, `globalJson`, `globalJsonInEffect`, `mapSomeCatchNoSuchElement`, `matchBooleanToIsSuccess`, `provideMergeAllToArray`, `resultMatchToFromResult`, `suspendFailToFailSync`, `typeUnionToSchemaUnion` and `yieldInCallArgument` diagnostics
- Removed `preferSchemaOverJson` diagnostic
- Added `brandedSchemaClasses` for `Class`, `TaggedClass`, `Error`, `TaggedError` and `Opaque`
- Added `taggedClass` naming rule for `default` pattern, skipping the `src/` path prefix
