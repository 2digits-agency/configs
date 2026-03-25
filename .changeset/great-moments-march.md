---
'@2digits/oxlint-config': minor
---

Add generated type definitions for type-safe rule configuration

- Added `scripts/generate-types.ts` that extracts rule metadata from oxlint CLI and generates `src/types.gen.d.ts` with JSDoc-annotated `RuleOptions` and `RuleName` types
- Added `defineTypedConfig` wrapper that uses `RuleOptions` to catch rule name misconfigurations at compile time; replaces all internal `defineConfig` usages
- Exported `TypedOxlintConfig`, `RuleOptions`, and `RuleName` from the package root
- Added `types:generate` script to `package.json`
- Added new `nodeConfig` with `node/no-exports-assign`, `node/no-new-require`, and `node/no-path-concat` rules included in base config
- Updated all rules in `javascript.ts` to use fully-qualified `eslint/` prefixes required by oxlint's plugin-scoped rule names
- Expanded eslint, import, unicorn, and typescript rulesets with ~40 additional rules
- Added vitest globals to the test files override
- Added `browser: true` and `node: true` to `env` in base config
