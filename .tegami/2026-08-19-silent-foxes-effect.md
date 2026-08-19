---
packages:
  'npm:@2digits/oxlint-config': major
---

## Remove the opt-in Effect oxlint preset

- Dropped the `@2digits/oxlint-config/effect` entrypoint (`effectConfig` and `effectConfigFor`).
- Those rules needed an Oxlint binary patched by `effect-tsgo`; that path is no longer supported. Remove the import and drop `--oxlint` from `effect-tsgo patch`.
