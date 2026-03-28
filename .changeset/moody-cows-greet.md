---
'@2digits/oxlint-config': minor
---

Add new import rules

- Added `import/no-amd` rule to disallow AMD `define` and `require` syntax
- Added `import/no-anonymous-default-export` rule to require named default exports
- Added `import/no-named-as-default` rule to prevent using exported name as local identifier
- Added `import/no-named-as-default-member` rule to prevent using exported name as property of default
- Added `import/unambiguous` rule to require unambiguous module dependencies
- Updated `import/first` rule with `disable-absolute-first` option for more flexible import ordering
- Disabled `import/unambiguous` for test files to allow ES module mocking
