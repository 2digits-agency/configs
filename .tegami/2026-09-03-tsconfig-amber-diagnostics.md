---
packages:
  'npm:@2digits/config-monorepo': minor
---

## Enforce stricter Effect diagnostics and import aliases

- Enabled the `allOfMapToForEach`, `catchConditionalRefailToCatchIf`, `catchDieToOrDie`, `flatMapConditionalToFilterOrFail`, `mapSomeToAsSome`, and `unsupportedServiceAccessors` diagnostics
- Added `Equal`, `Predicate`, and `Record` import aliases and disabled the `importFromBarrel` diagnostic
- Updated the CLI and TLO MCP packages to comply with the new rules
