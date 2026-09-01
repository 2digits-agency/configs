---
packages:
  'npm:@2digits/oxlint-plugin': patch
  'npm:@2digits/oxlint-config': minor
---

## Add custom Oxlint rules

Added a JavaScript plugin with default Effect correctness and API-usage rules, including syntax-safe diagnostics proposed
for `@effect/tsgo`.

The default Oxlint configuration now also catches unsafe Alchemy v2 migrations, runtime configuration, secret, lifecycle,
and deprecated API patterns.
