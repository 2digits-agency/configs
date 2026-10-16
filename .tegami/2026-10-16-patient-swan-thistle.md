---
packages:
  'npm:@2digits/tsconfig': major
---

## Enforce Effect import conventions

- Enabled `preferBarrelImport` and `preferNamespaceImport` as errors in `effect.json`
- Configured barrel imports for `@effect/vitest` and namespace imports for Effect platform packages, `@yielded/oauth`, `@yielded/jose`, `@yielded/crypto`, and `alchemy`; existing imports may need migration
