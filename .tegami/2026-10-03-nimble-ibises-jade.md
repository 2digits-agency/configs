---
packages:
  'npm:@2digits/eslint-config': patch
  'npm:@2digits/eslint-plugin': patch
---

## Update typescript-eslint tooling from 8.70.0 to 8.71.0

Update `typescript-eslint`, `@typescript-eslint/parser`, `@typescript-eslint/scope-manager`, and `@typescript-eslint/utils` in the packages that use them at runtime.

The strict type-checked preset now enables `ts/no-unsafe-enum-assignment`: plain numeric values and unsafe arithmetic assigned to enum-typed locations may produce new errors. Generated configuration types expose the rule; Markdown code blocks keep it disabled with the other type-aware checks.
