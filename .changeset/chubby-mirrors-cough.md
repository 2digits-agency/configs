---
'@2digits/oxfmt-config': minor
---

Drop CJS output, add `withTwoDigits()` composer, and expand default config

- **Breaking**: Removed CJS build — package now ships ESM only (`./dist/index.mjs`); dropped `main`, `module`, and `types` legacy fields
- **Breaking**: Changed default export from the config object to `withTwoDigits` — consumers using `import config from '@2digits/oxfmt-config'` must update to call it
- Exported named `twoDigits` config object for direct access
- Added `withTwoDigits(...configs)` function that merges user configs over `twoDigits` using `defu`
- Added `#/` to `internalPattern` for import sorting
- Enabled `newlinesBetween` and explicit `order: 'asc'` for import groups
- Set `embeddedLanguageFormatting: 'auto'` (was `'off'`) and `sortPackageJson: { sortScripts: true }` (was `false`)
- Added explicit defaults for `arrowParens`, `bracketSpacing`, `endOfLine`, `htmlWhitespaceSensitivity`, `insertFinalNewline`, `jsdoc`, `jsxSingleQuote`, `objectWrap`, `proseWrap`, `quoteProps`, `semi`, `singleAttributePerLine`, `tabWidth`, `useTabs`
