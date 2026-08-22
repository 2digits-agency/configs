---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Run `oxfmt` and `oxlint` from the repo root

- Replaced `vp fmt` / `vp lint` scripts with the `oxfmt` and `oxlint` binaries.
- Moved formatter and linter options into `oxfmt.config.ts` and `oxlint.config.ts`.
