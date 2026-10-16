---
packages:
  'npm:@2digits/oxlint-plugin': patch
---

## Use Effect helpers in lint rules

- Rewrote rule internals to use Effect collection helpers and `Match`, so the plugin's own code follows the Effect rules it ships
- Replaced duration arithmetic and constant-name parsing with `effect/Number` and `effect/String` helpers
