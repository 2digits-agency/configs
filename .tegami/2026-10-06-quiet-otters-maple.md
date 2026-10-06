---
packages:
  'npm:@2digits/eslint-config': patch
  'npm:@2digits/oxlint-config': patch
---

## Allow custom messages in Vitest assertions

- Allowed a second argument to `expect` by setting `vitest/valid-expect` to `maxArgs: 2`.
