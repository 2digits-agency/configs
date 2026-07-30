---
packages:
  'npm:@2digits/oxlint-config': patch
---

## Leave newly added oxlint rules unset

- Left `node/no-top-level-await` unset, so top-level `await` stays allowed in ESM
- Left `vitest/padding-around-test-blocks` unset, since formatting is handled by Oxfmt
