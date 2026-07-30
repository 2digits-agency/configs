---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Manage toolchain versions through idiomatic version files

- Dropped the pinned `[tools]` versions from `mise.toml` in favour of `idiomatic_version_file_enable_tools` for `node` and `pnpm`
- Added a `mise i -q` enter hook and the mise schema comment
- Declared `devEngines.packageManager` (pnpm 11.18.0, `onFail: download`) in the root manifest
