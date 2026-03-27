---
'@2digits/oxlint-config': patch
---

Reorganize TypeScript rules between type-aware and non-type-aware configs

- Moved `consistent-type-exports`, `no-array-delete`, `no-deprecated`, and `no-unnecessary-condition` to `typeAwareConfig` (require type information)
- Moved `no-non-null-asserted-optional-chain`, `no-this-alias`, `no-unnecessary-parameter-property-assignment`, `no-unsafe-declaration-merging`, `no-useless-empty-export`, and `triple-slash-reference` to `typescriptRulesConfig` (do not require type information)
- Added `typescript/no-deprecated` and `typescript/no-unnecessary-condition` rules to type-aware config
