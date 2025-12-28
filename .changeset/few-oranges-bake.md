---
'@2digits/eslint-config': patch
---

Add factory tests and expand fixture tests for multiple presets

- Added factory snapshot tests for `default`, `minimal`, `full`, `react-only`, and `next-stack` presets
- Expanded fixtures tests to cover multiple preset configurations
- Added CSS and YAML input fixtures for broader test coverage
- Exported `enabled()` and `extractConfig()` helper functions from factory
- Refactored `serializeConfigs()` in tests to reduce cognitive complexity
