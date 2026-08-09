---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Pin typescript-eslint to a `typescript6` catalog

- Added a `typescript6` catalog holding `typescript@6.0.3`, because `typescript-eslint` 8.x peers on `typescript >=4.8.4 <6.1.0`
- Retargeted the `eslint-plugin-sonarjs>typescript` override at that catalog
- Added a `packageExtensions` entry giving `eslint-plugin-zod` its own `typescript@6.0.3`, so the `@typescript-eslint/utils` it drags into `@2digits/oxlint-config` stops resolving the importer's TypeScript 7
- Constrained the catalog to `<6.1.0` in `.github/renovate.json` so an update cannot recreate an unsupported peer binding
