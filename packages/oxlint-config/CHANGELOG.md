# @2digits/oxlint-config

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
