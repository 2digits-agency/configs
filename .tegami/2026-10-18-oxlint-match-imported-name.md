---
packages:
  'npm:@2digits/oxlint-plugin': patch
---

## Match imported names with effect Match

- Replaced the manual `importedName` if-chain with an `effect/Match`-based implementation
