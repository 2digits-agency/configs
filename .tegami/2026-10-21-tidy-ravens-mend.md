---
packages:
  'npm:@2digits/cli': patch
---

## Use Effect string helpers when categorizing Turborepo tasks

- Rewrote the task-category match to use `Predicate.or` with `String.includes` instead of native `String.prototype.includes`
- Switched the build-time version replacement to `String.replaceAll`
