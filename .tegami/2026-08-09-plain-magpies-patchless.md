---
packages:
  'npm:@2digits/cli': patch
  'npm:@2digits/tlo-mcp': patch
---

## Drop the `@effect/language-service` patch step

- Removed the `prepare: effect-language-service patch` script and the `@effect/language-service` devDependency
- That patcher rejects TypeScript 7 with `TypeScriptFoundIsNot5Or6`; `@effect/tsgo` supersedes it and is already patched in from the root `prepare`
