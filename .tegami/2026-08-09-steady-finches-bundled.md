---
packages:
  'npm:@2digits/eslint-config': patch
  'npm:@2digits/eslint-plugin': patch
---

## Bundle TypeScript 6 for typescript-eslint

- Added `typescript@6.0.3` as a regular dependency, satisfying the `typescript-eslint` peer range from inside the package instead of from the consuming project
- No `typescript` peer dependency is declared, so a project on TypeScript 7 installs nothing extra and keeps its own version everywhere else
- Verified with packed tarballs in a TypeScript 7 only project under both pnpm and npm: `typescript-eslint`, `@typescript-eslint/parser` and `@typescript-eslint/utils` load 6.0.3 while the project root stays on 7.0.2
