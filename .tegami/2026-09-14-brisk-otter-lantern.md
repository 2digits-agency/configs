---
packages:
  'npm:@2digits/cli': patch
---

## Fix CLI flag construction with current Effect APIs

- Replaced `Flag.boolean` with `Flag.Boolean` while preserving existing flag defaults and behavior.
