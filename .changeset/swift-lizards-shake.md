---
'@2digits/eslint-config': patch
---

Update eslint-plugin-zod to 3.11.0

- Added `zod/consistent-schema-var-name` rule to enforce consistent naming for Zod schema variables
- Removed `zod/require-schema-suffix` rule (deprecated upstream, replaced by `consistent-schema-var-name`)
- Updated generated types for new and deprecated rules
