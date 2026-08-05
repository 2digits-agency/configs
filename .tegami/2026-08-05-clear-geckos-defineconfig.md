---
packages:
  'npm:@2digits/oxlint-config': patch
---

## Use the native oxlint configuration API

- Replaced `@oxlint-types/define-config` with `defineConfig` and the rule types from `oxlint`
- Registered external JS plugin rules through a `DummyRuleMap` module augmentation
