---
packages:
  'npm:@2digits/eslint-config': patch
---

## Report unused inline configs through ESLint core

- Enabled `reportUnusedInlineConfigs: 'error'` in the JavaScript config
- Removed the now redundant `comments/no-unused-disable` rule
