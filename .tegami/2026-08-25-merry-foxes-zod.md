---
packages:
  'npm:@2digits/eslint-config': patch
  'npm:@2digits/oxlint-config': patch
---

## Update `eslint-plugin-zod` to 4.10.0

- Enabled `zod/prefer-string-length-over-min-max` to prefer `.length(n)` over matching `.min(n).max(n)` calls.
