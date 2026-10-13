---
packages:
  'npm:@2digits/eslint-config': patch
  'npm:@2digits/oxlint-config': patch
---

## Update eslint-plugin-zod to 5.0.1

- Enabled the `zod/prefer-nullish` and `zod/require-error-message` rules
- Dropped the Oxlint override for the removed `zod/no-string-schema-with-uuid` rule
