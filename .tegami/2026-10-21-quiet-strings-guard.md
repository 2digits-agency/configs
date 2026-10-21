---
packages:
  'npm:@2digits/tsconfig': patch
---

## Enable the `preferEffectString` rule in the Effect preset

- Added `"preferEffectString": "error"` to `effect.json`, so consumers that extend the preset now get an error when they call native string methods instead of `effect/String` helpers
