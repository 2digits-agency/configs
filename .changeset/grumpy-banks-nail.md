---
'@2digits/eslint-config': patch
---

Update ESLint plugins

- Added `zod/consistent-schema-output-type-style` rule to enforce consistent use of `z.infer` for schema type inference
- Disabled `ts/no-unnecessary-type-assertion` rule to prevent false positives in config files
- Updated `eslint-plugin-zod` to 3.8.0
