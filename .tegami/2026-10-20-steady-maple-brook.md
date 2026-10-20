---
packages:
  'npm:@2digits/oxlint-plugin': patch
---

## Make FileState bindings non-optional

- Removed optional-key handling for `bindings` and `hasEffectImport` so they default via constructor defaults instead of nullable access
- Updated rule code to access `state.bindings` directly without optional chaining
- Changed `candidates` from `let` to `const` and use `.clear()` on reset in `preferEffectDurationConstants`
- Rewrote `typeNamePath` identifier case using `Fn.flow(Struct.get('name'), Arr.make)`
