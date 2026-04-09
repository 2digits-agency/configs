---
'@2digits/eslint-config': minor
---

Add Vitest ESLint plugin configuration

- Added `@vitest/eslint-plugin` integration with 30+ test-specific rules
- Auto-detects Vitest projects and applies rules to `**/*.{test,spec}.ts?(x)` files
- Added `OptionsWithVitest` interface with `typecheck` and `vitestImports` options
- Configures Vitest globals for test files automatically
