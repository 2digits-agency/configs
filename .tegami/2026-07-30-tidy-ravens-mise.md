---
packages:
  'npm:@2digits/eslint-config': patch
---

## Allow schema comments in mise TOML files

- Added a `2digits:toml:mise` config that turns off `toml/spaced-comment` for `mise*.toml`, so `#:schema` directives lint cleanly
- Added the `GLOB_MISE_TOML` glob
