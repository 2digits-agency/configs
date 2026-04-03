# @2digits/oxfmt-config

## 0.3.1

### Patch Changes

- 3a61988: Update defu to 6.1.6

## 0.3.0

### Minor Changes

- 2d85163: Drop CJS output, add `withTwoDigits()` composer, and expand default config

  - **Breaking**: Removed CJS build — package now ships ESM only (`./dist/index.mjs`); dropped `main`, `module`, and `types` legacy fields
  - **Breaking**: Changed default export from the config object to `withTwoDigits` — consumers using `import config from '@2digits/oxfmt-config'` must update to call it
  - Exported named `twoDigits` config object for direct access
  - Added `withTwoDigits(...configs)` function that merges user configs over `twoDigits` using `defu`
  - Added `#/` to `internalPattern` for import sorting
  - Enabled `newlinesBetween` and explicit `order: 'asc'` for import groups
  - Set `embeddedLanguageFormatting: 'auto'` (was `'off'`) and `sortPackageJson: { sortScripts: true }` (was `false`)
  - Added explicit defaults for `arrowParens`, `bracketSpacing`, `endOfLine`, `htmlWhitespaceSensitivity`, `insertFinalNewline`, `jsdoc`, `jsxSingleQuote`, `objectWrap`, `proseWrap`, `quoteProps`, `semi`, `singleAttributePerLine`, `tabWidth`, `useTabs`

### Patch Changes

- 2d85163: Extract shared ignore patterns into @2digits/constants

  - Moved `ignorePatterns` array from `@2digits/oxlint-config` to `@2digits/constants` for reuse across packages
  - Updated `@2digits/oxfmt-config` to import `ignorePatterns` from `@2digits/constants` and added to default config
  - Updated `@2digits/oxlint-config` to depend on `@2digits/constants` and import `ignorePatterns` from there
  - Added new ignore patterns: `**/.agents/skills/**` and `**/fixtures/**`
  - Simplified `vite.config.ts` to use consolidated ignore patterns from shared constants

- Updated dependencies [2d85163]
  - @2digits/constants@1.1.18

## 0.2.0

### Minor Changes

- b90f65b: Add `@2digits/oxfmt-config` package
  - Introduces `@2digits/oxfmt-config` with an opinionated `oxfmt` configuration for 2digits projects
  - Configures import sorting with custom groups for `react`, `react-native`, `next`, `expo`, `@2digits`, and internal aliases
  - Sets shared formatting defaults: `printWidth: 120`, `singleQuote`, `trailingComma: 'all'`, `bracketSameLine`
  - Integrates Tailwind CSS class sorting via `sortTailwindcss` using `tailwindFunctions` from `@2digits/constants`
  - Exports `twoDigits` config as default and re-exports `OxfmtConfig` type
  - Added Prettier-parity fixture test suite verifying oxfmt output matches prettier across TypeScript, JSX, import ordering, Tailwind, and JSDoc fixtures
  - Documents known differences (embedded language formatting, import attribute spacing, operator position) with `reason` snapshots

## 0.1.0

### Minor Changes

- Add `@2digits/oxfmt-config` package
