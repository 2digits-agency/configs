---
'@2digits/eslint-config': minor
---

Add TOML linting support

- Added `eslint-plugin-toml` with standard rules plus custom indent/spacing config
- Created `toml()` config and `GLOB_TOML` pattern for `**/*.toml` files
- Added TOML test fixtures for all config scenarios
- Fixed `zod-x` → `zod` in PluginNameMap
