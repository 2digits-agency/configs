---
packages:
  'npm:@2digits/eslint-config': minor
  'npm:@2digits/oxlint-config': minor
---

## Enforce property-style method signatures

- Enabled `method-signature-style` with the `property` option in both presets, so interface members are declared as `readonly foo: (…) => R` and keep parameters contravariant
- Disabled `switch-exhaustiveness-check` in both presets
