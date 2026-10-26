---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Migrate dependency build approvals to permissions

- Replaced `allowBuilds` with per-package `permissions` in `pnpm-workspace.yaml`.
- Disabled builds for `core-js-pure`, `protobufjs`, and `re2`, and removed explicit approvals for `@parcel/watcher` and `better-sqlite3`.
