---
packages:
  'npm:@2digits/oxlint-plugin': patch
---

## Express AST helpers with effect Match and Predicate

- Rewrote `staticPropertyName`, `propertyName`, `isFunctionNode` and `isErrorConstructor` with `effect/Match` and `effect/Predicate`
- Replaced four copies of the imported-name lookup with one shared `moduleExportName` helper, and the repeated string-literal checks with a shared `isStringLiteral`
- Fixed `importedName` so string-literal import names (`import { 'foo-bar' as x }`) are recognized again
