---
'@2digits/oxlint-config': minor
---

Add oxc plugin rules and consolidate type-aware configuration

- Added new `oxcConfig` with 20+ rules for catching common bugs and anti-patterns
- New rules include: `approx-constant`, `bad-array-method-on-arguments`, `bad-bitwise-operator`, `bad-char-at-comparison`, `bad-comparison-sequence`, `bad-min-max-func`, `bad-object-literal-comparison`, `bad-replace-all-arg`, `branches-sharing-code`, `const-comparisons`, `double-comparisons`, `erasing-op`, `misrefactored-assign-op`, `missing-throw`, `no-accumulating-spread`, `no-barrel-file`, `no-const-enum`, `no-this-in-exported-function`, `number-arg-out-of-range`, `only-used-in-recursion`, `uninvoked-array-callback`
- Consolidated type-aware rules into `typescriptRulesConfig` by enabling `typeAware: true` option
- Removed separate `typeAwareConfig` file - all TypeScript rules now in one config
- Added `node/handle-callback-err` rule to enforce error handling in callbacks
- Added 20+ new TypeScript rules including `adjacent-overload-signatures`, `await-thenable`, `ban-tslint-comment`, `class-literal-property-style`, `consistent-indexed-object-style`, `consistent-type-assertions`, `no-array-delete`, `no-base-to-string`, `no-deprecated`, `no-duplicate-type-constituents`, `no-floating-promises`, `no-for-in-array`, `no-implied-eval`, `no-meaningless-void-operator`, `no-misused-spread`, `no-redundant-type-constituents`, `no-unnecessary-condition`, `no-unsafe-unary-minus`, `require-array-sort-compare`, `restrict-template-expressions`, `unbound-method`, and `dot-notation`
