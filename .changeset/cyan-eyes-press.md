---
'@2digits/eslint-config': patch
---

Update TOML, JSONC, and Unicorn linting rules

- Added `toml/array-element-newline` rule with `consistent` option for consistent array formatting
- Changed `toml/indent` to use `keyValuePairs: 0` and `subTables: 0` for cleaner TOML output
- Removed custom `package.json` field ordering from `jsonc/sort-keys` rule
- Disabled `unicorn/no-nested-ternary` rule to allow nested ternary expressions
