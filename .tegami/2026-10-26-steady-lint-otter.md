---
packages:
  'npm:@2digits/oxlint-config': patch
---

## Ship an Oxlint agent skill

The package now ships an `oxlint` [pnpm agent skill](https://pnpm.io/agent-skills). It gives AI agents the fixes for the
rules they most often get stuck on with this config: statement padding, `no-unnecessary-condition`, `no-null`, type-only imports, `func-style`, the Vitest rules and the `2digits/*` Effect
rules. It also says when a disable comment is acceptable and where to put it so it does not become unused.

Run `pnpm approve` to approve `@2digits/oxlint-config`. pnpm 12.11 or later then links the skill as
`pnpm-@2digits+oxlint-config-oxlint`.
