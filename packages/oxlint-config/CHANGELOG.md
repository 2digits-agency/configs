# @2digits/oxlint-config

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
