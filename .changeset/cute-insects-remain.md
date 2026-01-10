---
'@2digits/cli': patch
'@2digits/constants': patch
'@2digits/eslint-config': patch
'@2digits/eslint-plugin': patch
---

Updated tsdown and remove redundant main/module fields

- Updated tsdown to 0.19.0
- Removed `main` and `module` fields that duplicate the `exports` configuration
- These fields are unnecessary for ESM-only packages with proper `exports` definitions
