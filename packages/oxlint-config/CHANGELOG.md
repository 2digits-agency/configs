## @2digits/oxlint-config@1.0.2

### Update `eslint-plugin-zod` to 4.12.0

## @2digits/oxlint-config@1.0.1

### Update `eslint-plugin-zod` to 4.10.0

- Enabled `zod/prefer-string-length-over-min-max` to prefer `.length(n)` over matching `.min(n).max(n)` calls.

### Update `oxlint` to 1.80.0

## @2digits/oxlint-config@1.0.0

### Remove the opt-in Effect oxlint preset

- Dropped the `@2digits/oxlint-config/effect` entrypoint (`effectConfig` and `effectConfigFor`).
- Those rules needed an Oxlint binary patched by `effect-tsgo`; that path is no longer supported. Remove the import and drop `--oxlint` from `effect-tsgo patch`.

### Update `oxlint` to 1.79.0

- Enable all 22 category-specific React Compiler rules with Oxlint's native implementation.
- Projects may now report diagnostics from compiler categories that upstream leaves disabled.

### Turn off `no-redeclare`



### Turn off `prefer-destructuring`



### Enable `node/exports-style` and `node/no-mixed-requires`

- `node/exports-style` now errors with `module.exports`.
- `node/no-mixed-requires` is now an error.

## @2digits/oxlint-config@0.8.2

### Enable additional Effect lint rules

- Added checks for Effect context, generators, floating effects, schema members, and service types.

## @2digits/oxlint-config@0.8.1

### Update `eslint-plugin-zod` to 4.9.1



### Update `oxlint` to 1.78.0

## @2digits/oxlint-config@0.8.0

### Add an opt-in Effect preset for the `effecttsgo` plugin

- New `@2digits/oxlint-config/effect` entrypoint exporting `effectConfig`, which enables the
  `effecttsgo` plugin from `@effect/tsgo` in type-aware mode and configures 82 Effect rules
  (`missing-pipeable-signature`, `strict-boolean-expressions` and `strict-effect-provide` as
  warnings, the rest as errors).
- The preset is deliberately not part of `twoDigits`. Oxlint rejects the entire configuration with
  `Unknown plugin: 'effecttsgo'` when its binary is unpatched, so projects that do not use Effect
  are unaffected and keep linting as before.
- Also exports `effectConfigFor(files)`, which keeps the plugin enabled globally but restricts the
  rules to the given globs. Rules such as `async-function`, `process-env` and `node-builtin-import`
  judge plain TypeScript too, so a repository that mixes Effect and non-Effect packages should name
  its Effect sources rather than reporting unfollowable advice everywhere.
- The installed `oxlint`, `oxlint-tsgolint` and `@effect/tsgo` versions must match each other;
  `effect-tsgo patch` refuses to run otherwise. `@effect/tsgo@0.36.0` supports `oxlint@1.77.0` with
  `oxlint-tsgolint@7.0.2001`, which is what this repository's catalog pins. Set up a consumer with:

  ```sh
  pnpm add -D @effect/tsgo@0.36.0 oxlint@1.77.0 oxlint-tsgolint@7.0.2001
  ```

  then add `"prepare": "effect-tsgo patch --oxlint"` (append `--no-typescript` to leave TypeScript
  alone) and `export default withTwoDigits(effectConfig)`.

- `withTwoDigits` now accepts and returns `TwoDigitsConfig`, an `OxlintConfig` whose `plugins` also
  admits plugins registered by a binary patch, and appends each config's `overrides` in argument
  order. Previously `defu` prepended them, so a later config's override lost to an earlier one even
  though the documented contract is that later configs win.
- Effect rules that `@effect/tsgo` enables by default — `floating-effect`, `missing-effect-context`
  and the other 11 correctness rules — stay off, because this preset disables every Oxlint
  category. Add them to your own `rules` if you want them enforced.

## @2digits/oxlint-config@0.7.0

### Update oxlint to 1.77.0



### Use the native oxlint configuration API

- Replaced `@oxlint-types/define-config` with `defineConfig` and the rule types from `oxlint`
- Registered external JS plugin rules through a `DummyRuleMap` module augmentation

### Align rule settings with @2digits/eslint-config

- Matched the shared JavaScript, TypeScript, React, Node, Unicorn, Vitest, JSDoc, import, Oxc, and Zod rule settings
- Corrected the `react-perf/*` rule namespace and disabled the unsupported `one-var` rule

### Enforce property-style method signatures

- Enabled `method-signature-style` with the `property` option in both presets, so interface members are declared as `readonly foo: (…) => R` and keep parameters contravariant
- Disabled `switch-exhaustiveness-check` in both presets

### Adopt previously unconfigured oxlint rules

- Enabled `oxc/bad-match-all-arg`, `no-promise-executor-return` and `vitest/valid-title` with `ignoreTypeOfDescribeName`
- Enabled the newly available unicorn rules `empty-brace-spaces`, `explicit-timer-delay`, `import-style`, `no-array-fill-with-reference-type`, `no-confusing-array-with`, `prefer-export-from` and `prefer-single-call`
- Explicitly disabled the type-aware rules that stay off: `consistent-return`, `no-unsafe-type-assertion`, `prefer-readonly-parameter-types` and `strict-void-return`
- Turned off `no-shadow`, which is covered by the TypeScript-aware equivalent

## @2digits/oxlint-config@0.6.17

### Update eslint-plugin-zod to 4.9.0

- Added the new `zod/prefer-nullish` rule to the generated rule types

### Update @oxlint-types/define-config to 0.0.13



### Update oxlint to 1.76.0



### Require function declarations for named React components

- Enabled `react/function-component-definition` with `namedComponents: 'function-declaration'`

### Leave newly added oxlint rules unset

- Left `node/no-top-level-await` unset, so top-level `await` stays allowed in ESM
- Left `vitest/padding-around-test-blocks` unset, since formatting is handled by Oxfmt

## @2digits/oxlint-config@0.6.16

### Align rules and add Zod checks

Oxlint's newly supported React, TypeScript, Node.js, and JSDoc rules now match the corresponding ESLint configuration.

Zod schemas now receive the same checks through Oxlint's JavaScript plugin support. Config typings now use `oxlint-types`, and consumer overrides merge without dropping defaults.

### Update Oxlint and Oxfmt

- Updated `oxlint` to 1.75.0
- Updated `oxfmt` to 0.60.0

## @2digits/oxlint-config@0.6.15

### Support Effect Vitest test blocks

- Recognized `it.effect` and `it.scoped` as test blocks for Vitest expectation rules
- Recognized Effect assertion helpers when checking test expectations
- Updated `oxlint-tsgolint` to 0.25.0

# @2digits/oxlint-config

## 0.6.14

### Patch Changes

- bfb16bd: Update oxlint to 1.74.0 and generated rule types

  - Added generated types for new ESLint and Unicorn rules

## 0.6.13

### Patch Changes

- 3103077: Update oxlint to 1.72.0 and tighten destructuring checks

  - Updated `oxlint` to 1.72.0 and `oxlint-tsgolint` to 0.24.0
  - Enabled object and array checks for `eslint/prefer-destructuring` in the JavaScript config

## 0.6.12

### Patch Changes

- e88c38d: Update oxlint to 1.71.0 and generated rule types

  - Updated `typescript/consistent-generic-constructors` option syntax
  - Disabled newly unsupported Unicorn rules in the default config
  - Updated generated rule types for new Node, React, and Unicorn rules

## 0.6.11

### Patch Changes

- 433d415: Update oxlint to 1.69.0

  - Updated generated Oxlint rule types

## 0.6.10

### Patch Changes

- 0b1927b: Update oxlint to 1.68.0 and generated rule types

  - Updated `oxlint` to 1.68.0
  - Added `eslint/prefer-named-capture-group` to the disabled rule set
  - Updated generated types for new `eslint`, `jsdoc`, `typescript`, and `vue` rules

## 0.6.9

### Patch Changes

- 626d181: Update oxlint to 1.67.0 and generated rule types

  - Updated `oxlint` to 1.67.0
  - Added `unicorn/import-style` to the disabled rule set
  - Updated generated types for new `node`, `unicorn`, and `vue` rules

## 0.6.8

### Patch Changes

- 158630a: Update oxlint to 1.66.0 and oxlint-tsgolint to 0.23.0

  - Added `eslint/no-implicit-globals`, `eslint/prefer-arrow-callback`, `import/newline-after-import`, `vitest/padding-around-after-all-blocks` rules
  - Updated generated types

## 0.6.7

### Patch Changes

- 1389c83: Update oxlint to 1.64.0 and adjust rule configuration

  - Updated `oxlint` to 1.64.0
  - Added `eslint/prefer-regex-literals` to disabled rules
  - Updated `eslint/no-restricted-properties` configuration
  - Updated generated types with new rule definitions including `jsx_a11y/no-noninteractive-element-to-interactive-role`

## 0.6.6

### Patch Changes

- af1fdf7: Update oxlint to 1.63.0 and enable additional rules

  - Updated `oxlint` to 1.63.0
  - Added `eslint/logical-assignment-operators`, `eslint/no-restricted-properties`, and `eslint/require-unicode-regexp` rules
  - Added `unicorn/no-negated-condition` rule
  - Added 15+ new vitest rules including `vitest/no-standalone-expect`, `vitest/prefer-to-be`, and `vitest/valid-describe-callback`
  - Updated generated types with new rule definitions

## 0.6.5

### Patch Changes

- 943ce66: Enable additional unicorn rules

  - Added `unicorn/consistent-template-literal-escape`
  - Added `unicorn/no-anonymous-default-export`
  - Added `unicorn/no-process-exit`
  - Added `unicorn/no-useless-iterator-to-array`
  - Added `unicorn/no-useless-promise-resolve-reject`
  - Added `unicorn/require-module-specifiers`
  - Added `unicorn/switch-case-break-position`
  - Added `unicorn/throw-new-error`
  - Added type validation for unicorn rules

- 68924a9: Enable additional rules and add type validation

  - Added `eslint/capitalized-comments`
  - Added `eslint/complexity`
  - Added `eslint/curly`
  - Added `eslint/default-param-last`
  - Added `eslint/func-names`
  - Added `eslint/func-style`
  - Added `eslint/getter-return`
  - Added `eslint/grouped-accessor-pairs`
  - Added `eslint/guard-for-in`
  - Added `eslint/no-await-in-loop`
  - Added `eslint/no-negated-condition`
  - Added `eslint/no-return-assign`
  - Added `eslint/no-script-url`
  - Added `eslint/object-shorthand`
  - Added `eslint/prefer-object-spread`
  - Added `eslint/preserve-caught-error`
  - Added `import/no-absolute-path`
  - Added `import/no-empty-named-blocks`
  - Added `import/no-named-default`
  - Added type validation for `eslint`, `import`, and `oxc` rules

- 74e346a: Enable additional vitest rules

  - Added `vitest/consistent-test-it`
  - Added `vitest/expect-expect`
  - Added `vitest/max-expects`
  - Added `vitest/max-nested-describe`
  - Added `vitest/no-alias-methods`
  - Added `vitest/no-commented-out-tests`
  - Added `vitest/no-conditional-expect`
  - Added `vitest/no-conditional-in-test`
  - Added `vitest/no-disabled-tests`
  - Added `vitest/no-duplicate-hooks`
  - Added `vitest/no-focused-tests`
  - Added `vitest/no-identical-title`
  - Added `vitest/no-interpolation-in-snapshots`
  - Added `vitest/no-mocks-import`
  - Added `vitest/prefer-to-contain`
  - Added `vitest/prefer-todo`
  - Added `vitest/require-top-level-describe`
  - Added `vitest/valid-expect`

## 0.6.4

### Patch Changes

- e1f712a: Update oxlint to 1.62.0

  - Updated generated rule types with new rules from `eslint`, `jest`, `react`, `vitest`, and `vue` plugins

## 0.6.3

### Patch Changes

- 8837219: Update oxlint to 1.61.0

  - Added `typescript/explicit-member-accessibility` rule to generated types

## 0.6.2

### Patch Changes

- 9e37180: Update oxlint to 1.60.0

## 0.6.1

### Patch Changes

- 692a9b0: Update defu to 6.1.7

  - Updated `defu` to 6.1.7 in `@2digits/oxfmt-config` and `@2digits/oxlint-config`

## 0.6.0

### Minor Changes

- 00e6c97: Update oxlint to 1.59.0

  - Removed `import/no-unassigned-import` rule
  - Removed `import/unambiguous` rule
  - Removed `eslint/no-empty-function` rule
  - Removed `eslint/no-undef` rule
  - Removed `react_perf/jsx-no-new-array-as-prop` rule
  - Removed `react_perf/jsx-no-new-function-as-prop` rule
  - Removed `react_perf/jsx-no-new-object-as-prop` rule
  - Removed `typescript/unbound-method` rule
  - Changed `typescript/consistent-type-imports` to allow type annotations
  - Changed `typescript/no-confusing-void-expression` to ignore void operator
  - Changed `typescript/no-misused-promises` to disable void return checks
  - Updated generated types with new rules from oxlint 1.59.0

## 0.5.0

### Minor Changes

- 64ca9d5: Add React configuration support

  - Added new `reactConfig` with comprehensive React linting rules
  - Integrated React Perf plugin rules for performance optimization
  - Added React Compiler plugin support via `eslint-plugin-react-compiler`
  - Added Stylistic plugin support via `@stylistic/eslint-plugin` for JSX formatting
  - Exported React configuration in TypeScript preset

### Patch Changes

- 3a61988: Update defu to 6.1.6

## 0.4.0

### Minor Changes

- 43d3071: Enhance TypeScript linting rules

  - Change `consistent-type-assertions` from `angle-bracket` to `as` style
  - Add `interface` option to `consistent-type-definitions`
  - Add `fixMixedExportsWithInlineTypeSpecifier` option to `consistent-type-exports`
  - Add `prefer`, `disallowTypeAnnotations` options to `consistent-type-imports`
  - Add `fixToUnknown` and `ignoreRestArgs` options to `no-explicit-any`
  - Add `allowSingleExtends` option to `no-empty-interface`
  - Add `allowStaticOnly` option to `no-extraneous-class`
  - Add `ignoreArrowShorthand` option to `no-confusing-void-expression`
  - Add new rules: `no-confusing-non-null-assertion`, `no-dynamic-delete`, `no-extra-non-null-assertion`, `no-inferrable-types`, `no-invalid-void-type`, `no-misused-promises`, `no-mixed-enums`, `no-namespace`, `no-non-null-asserted-nullish-coalescing`, `no-unnecessary-boolean-literal-compare`, `no-unnecessary-qualifier`, `no-unnecessary-template-expression`, `no-unnecessary-type-arguments`, `no-unnecessary-type-assertion`, `no-unnecessary-type-constraint`, `no-unnecessary-type-conversion`, `no-unnecessary-type-parameters`, `no-unsafe-argument`

- 2cef142: Add oxc plugin rules and consolidate type-aware configuration

  - Added new `oxcConfig` with 20+ rules for catching common bugs and anti-patterns
  - New rules include: `approx-constant`, `bad-array-method-on-arguments`, `bad-bitwise-operator`, `bad-char-at-comparison`, `bad-comparison-sequence`, `bad-min-max-func`, `bad-object-literal-comparison`, `bad-replace-all-arg`, `branches-sharing-code`, `const-comparisons`, `double-comparisons`, `erasing-op`, `misrefactored-assign-op`, `missing-throw`, `no-accumulating-spread`, `no-barrel-file`, `no-const-enum`, `no-this-in-exported-function`, `number-arg-out-of-range`, `only-used-in-recursion`, `uninvoked-array-callback`
  - Consolidated type-aware rules into `typescriptRulesConfig` by enabling `typeAware: true` option
  - Removed separate `typeAwareConfig` file - all TypeScript rules now in one config
  - Added `node/handle-callback-err` rule to enforce error handling in callbacks
  - Added 20+ new TypeScript rules including `adjacent-overload-signatures`, `await-thenable`, `ban-tslint-comment`, `class-literal-property-style`, `consistent-indexed-object-style`, `consistent-type-assertions`, `no-array-delete`, `no-base-to-string`, `no-deprecated`, `no-duplicate-type-constituents`, `no-floating-promises`, `no-for-in-array`, `no-implied-eval`, `no-meaningless-void-operator`, `no-misused-spread`, `no-redundant-type-constituents`, `no-unnecessary-condition`, `no-unsafe-unary-minus`, `require-array-sort-compare`, `restrict-template-expressions`, `unbound-method`, and `dot-notation`

- b826d9d: Add more TypeScript linting rules

  - Added `typescript/prefer-reduce-type-parameter` rule
  - Added `typescript/prefer-regexp-exec` rule
  - Added `typescript/prefer-return-this-type` rule
  - Added `typescript/prefer-string-starts-ends-with` rule
  - Added `typescript/related-getter-setter-pairs` rule
  - Added `typescript/require-await` rule
  - Added `typescript/restrict-plus-operands` rule
  - Added `typescript/return-await` rule with `error-handling-correctness-only` option
  - Added `typescript/unified-signatures` rule
  - Added `typescript/use-unknown-in-catch-callback-variable` rule

### Patch Changes

- 64d6ea1: Add JSDoc linting rules and configuration

  - Added `jsdoc/check-tag-names` rule with typed option enabled
  - Added `jsdoc/require-param` rule to enforce parameter documentation
  - Added `jsdoc/require-yields` rule to enforce yield documentation
  - Added new JSDoc configuration to oxlint-config with equivalent rules

## 0.3.0

### Minor Changes

- 957e534: Expand lint rules and update oxlint to 1.58.0

  - Added 80+ new unicorn plugin rules for comprehensive code quality enforcement
  - Includes rules for: array methods (no-array-for-each, no-array-reduce, prefer-array-flat), best practices (consistent-assert, prefer-modern-dom-apis, prefer-node-protocol), and code style (consistent-function-scoping, prefer-ternary)
  - Updated prefer-ternary configuration to only-single-line for better readability
  - Disabled checkArguments and checkArrowFunctionBody in no-useless-undefined rule
  - Set checkAllIndexAccess: false in prefer-at rule for practical array indexing patterns
  - Updated vitest rules: changed `consistent-each-for` to use 'for' style, enabled `prefer-called-exactly-once-with`, `prefer-called-once`, `require-awaited-expect-poll`, and `require-mock-type-parameters`
  - Updated generated types with new rule definitions from oxlint 1.58.0

## 0.2.0

### Minor Changes

- 2d85163: Add new import rules

  - Added `import/no-amd` rule to disallow AMD `define` and `require` syntax
  - Added `import/no-anonymous-default-export` rule to require named default exports
  - Added `import/no-named-as-default` rule to prevent using exported name as local identifier
  - Added `import/no-named-as-default-member` rule to prevent using exported name as property of default
  - Added `import/unambiguous` rule to require unambiguous module dependencies
  - Updated `import/first` rule with `disable-absolute-first` option for more flexible import ordering
  - Disabled `import/unambiguous` for test files to allow ES module mocking

### Patch Changes

- 2d85163: Extract shared ignore patterns into @2digits/constants

  - Moved `ignorePatterns` array from `@2digits/oxlint-config` to `@2digits/constants` for reuse across packages
  - Updated `@2digits/oxfmt-config` to import `ignorePatterns` from `@2digits/constants` and added to default config
  - Updated `@2digits/oxlint-config` to depend on `@2digits/constants` and import `ignorePatterns` from there
  - Added new ignore patterns: `**/.agents/skills/**` and `**/fixtures/**`
  - Simplified `vite.config.ts` to use consolidated ignore patterns from shared constants

- 2d85163: Add additional JavaScript lint rules

  - Added `no-useless-concat`, `no-useless-return`, `operator-assignment`, `prefer-destructuring`, `prefer-numeric-literals`, `prefer-object-has-own`, `preserve-caught-error`, `radix`, and `require-yield` rules to the JavaScript config

- 2d85163: Add `arrow-body-style` and `sort-vars` JavaScript lint rules

  - Added `arrow-body-style` rule with `as-needed` option to enforce concise arrow function bodies
  - Added `sort-vars` rule to enforce alphabetical sorting of variable declarations within the same block
  - Reordered rules alphabetically (no functional change)

- Updated dependencies [2d85163]
  - @2digits/constants@1.1.18

## 0.1.1

### Patch Changes

- cd7f884: Reorganize TypeScript rules between type-aware and non-type-aware configs

  - Moved `consistent-type-exports`, `no-array-delete`, `no-deprecated`, and `no-unnecessary-condition` to `typeAwareConfig` (require type information)
  - Moved `no-non-null-asserted-optional-chain`, `no-this-alias`, `no-unnecessary-parameter-property-assignment`, `no-unsafe-declaration-merging`, `no-useless-empty-export`, and `triple-slash-reference` to `typescriptRulesConfig` (do not require type information)
  - Added `typescript/no-deprecated` and `typescript/no-unnecessary-condition` rules to type-aware config

- 1b758b7: Update oxlint-tsgolint to 0.18.1
- 841c323: Update oxlint-tsgolint to 0.17.4

## 0.1.0

### Minor Changes

- c0528d4: Add generated type definitions for type-safe rule configuration

  - Added `scripts/generate-types.ts` that extracts rule metadata from oxlint CLI and generates `src/types.gen.d.ts` with JSDoc-annotated `RuleOptions` and `RuleName` types
  - Added `defineTypedConfig` wrapper that uses `RuleOptions` to catch rule name misconfigurations at compile time; replaces all internal `defineConfig` usages
  - Exported `TypedOxlintConfig`, `RuleOptions`, and `RuleName` from the package root
  - Added `types:generate` script to `package.json`
  - Added new `nodeConfig` with `node/no-exports-assign`, `node/no-new-require`, and `node/no-path-concat` rules included in base config
  - Updated all rules in `javascript.ts` to use fully-qualified `eslint/` prefixes required by oxlint's plugin-scoped rule names
  - Expanded eslint, import, unicorn, and typescript rulesets with ~40 additional rules
  - Added vitest globals to the test files override
  - Added `browser: true` and `node: true` to `env` in base config

- c5af9ba: Add `@2digits/oxlint-config` package
  - Added new `@2digits/oxlint-config` package providing an opinionated Oxlint configuration for 2digits projects
  - Exported `twoDigits` config (base + TypeScript rules + type-aware rules + vitest rules) and `withTwoDigits()` for project-level extension via `extends`
  - Included curated rule sets for `javascript`, `typescript`, `unicorn`, `import`, `vitest`, and `type-aware` categories
  - Added `defu`-based deep merge so consumer configs override 2digits defaults without losing unconfigured rules
  - Added a `rules:check` script to verify all enabled rules still exist in the installed oxlint version
  - Wired `lint:oxlint` Turborepo task that depends on a fresh `@2digits/oxlint-config#build` before running
