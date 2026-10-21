---
packages:
  'npm:@2digits/oxlint-plugin': patch
---

## Use Effect string helpers inside the lint rules

- Replaced native string calls such as `startsWith`, `replaceAll` and `split` with their `effect/String` counterparts in the Effect rules, the padding-line rule and the shared utils
