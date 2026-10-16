---
packages:
  'npm:@2digits/oxlint-plugin': patch
---

## Use Effect collection helpers and `Match` in rule code

- Rewrote rule internals to use `effect/Array`, `effect/Record`, `effect/Option`, and `effect/Function` instead of native array, object, and `switch` calls, so the plugin's own code follows the Effect rules it ships
- Rule behavior is unchanged; the existing test suite passes without changes
