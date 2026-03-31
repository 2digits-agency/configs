---
'@2digits/constants': patch
'@2digits/oxfmt-config': patch
'@2digits/oxlint-config': patch
---

Extract shared ignore patterns into @2digits/constants

- Moved `ignorePatterns` array from `@2digits/oxlint-config` to `@2digits/constants` for reuse across packages
- Updated `@2digits/oxfmt-config` to import `ignorePatterns` from `@2digits/constants` and added to default config
- Updated `@2digits/oxlint-config` to depend on `@2digits/constants` and import `ignorePatterns` from there
- Added new ignore patterns: `**/.agents/skills/**` and `**/fixtures/**`
- Simplified `vite.config.ts` to use consolidated ignore patterns from shared constants
