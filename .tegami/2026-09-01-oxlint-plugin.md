---
packages:
  'npm:@2digits/oxlint-plugin': patch
  'npm:@2digits/oxlint-config': minor
---

## Add custom Oxlint rules

Added a JavaScript plugin with default Effect correctness and API-usage rules, including syntax-safe diagnostics proposed
for `@effect/tsgo`.

Effect projects now receive guidance toward the v4 Array, DateTime, Duration, Encoding, FileSystem, Filter, Headers,
Match, Path, and Url APIs. Promise thunks must acknowledge Effect's interruption signal, and Effect/Alchemy imports use
consistent submodule namespaces and aliases while leaving `@effect/vitest` imports unchanged.

The FileSystem and Path rules remain opt-in because the existing `@effect/tsgo/nodeBuiltinImport` diagnostic already
enforces those migrations without duplicate reports.

The default Oxlint configuration now also catches unsafe Alchemy v2 migrations, runtime configuration, secret, lifecycle,
and deprecated API patterns.
