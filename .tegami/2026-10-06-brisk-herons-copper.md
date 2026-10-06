---
packages:
  'npm:@2digits/oxlint-config': major
---

## Replace TwoDigitsConfig with OxlintConfig

- Removed the exported `TwoDigitsConfig` type; use `OxlintConfig` instead.
- Changed `withTwoDigits` to accept and return `OxlintConfig`, removing the custom allowance for binary-patched `effecttsgo` plugins.
