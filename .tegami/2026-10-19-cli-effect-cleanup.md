---
packages:
  'npm:@2digits/cli': patch
---

### Fix `--prettier` and `--no-prettier`

`--prettier` now sets up Prettier and `--no-prettier` skips it, as documented. Before, the two flags did the opposite.

### Check ESLint dependencies at the workspace root

When run from a workspace subdirectory, `2d --eslint` now checks the root `package.json` for `eslint` and `@2digits/eslint-config`, where it installs them, instead of reinstalling them and warning that dependencies may be missing.

### Use Effect modules across services

- `turbo.json` reads and writes now go through one `TurboConfigService` instead of copies in the ESLint and Turborepo setup.
- Shared `hasDependency` and `ensureScript` helpers replace repeated dependency and script checks.
- Task categories and flag handling use `effect/Match`, `Option` and `String` instead of if-chains, and service layers follow the Effect v4 `layer` naming.
