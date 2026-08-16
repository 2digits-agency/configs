---
packages:
  'npm:@2digits/cli': patch
  'npm:@2digits/tlo-mcp': patch
---

## Adopt Effect's TypeScript tooling

- Switched type checking to the stable TypeScript 7 native compiler, patched once at the workspace root with `effect-tsgo`.
- Enabled the full Effect diagnostic profile, including stricter errors and test-specific overrides.
