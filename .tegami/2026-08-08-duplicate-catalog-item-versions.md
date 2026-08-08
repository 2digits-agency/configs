---
packages:
  'npm:@2digits/eslint-config': patch
---

## Only report catalog items duplicated at the same version

`pnpm/yaml-no-duplicate-catalog-item` now runs with `checkDuplicates: 'exact-version'`. A named
catalog exists precisely to pin a _different_ version of a package — for example a
`conflicts_typescript_7_0_2` catalog next to a default catalog on TypeScript 6 — and the previous
name-only comparison flagged that intentional split as a mistake. Two catalogs listing the same
package at the same version are still reported.
