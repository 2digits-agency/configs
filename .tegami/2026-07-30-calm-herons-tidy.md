---
packages:
  'npm:@2digits/eslint-config': patch
---

## Remove obsolete rule overrides

- Removed `unicorn/prevent-abbreviations`, which is no longer part of the upstream recommended set
- Removed `sonar/confidential-information-logging` and `ts/no-var-requires`
- Removed the `spaced-comment` override from the YAML config
- Sorted the remaining `unicorn` overrides alphabetically
