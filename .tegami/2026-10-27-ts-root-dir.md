---
packages:
  'npm:@2digits/eslint-config': patch
---

## Respect `ts.tsconfigRootDir` for TypeScript files

`.ts` files now use the `tsconfigRootDir` passed in the `ts` options instead of always using `process.cwd()`.
