---
packages:
  'npm:@2digits/oxlint-plugin': minor
---

### Add Alchemy Domain rules

Five rules check the conventions of the `@alchemy.run/domain` agent skill:

- `alchemy-domain-pure-decide`: no time, randomness or I/O in an aggregate's `decide`.
- `alchemy-domain-total-handlers`: no `throw` or `getOrThrow` in `evolve` and `reply`.
- `alchemy-domain-require-view-version`: every `Domain.View` declares its `version`.
- `alchemy-domain-block-file-name`: one block per file, named `<Noun>.<kind>.ts`.
- `alchemy-domain-pure-imports`: block files import only `@alchemy.run/domain`, `effect` and relative files.

The rules only check code that imports `@alchemy.run/domain` and are part of `recommendedRules`.
