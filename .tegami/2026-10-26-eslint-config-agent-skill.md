---
packages:
  'npm:@2digits/eslint-config': minor
---

## Ship a `fixing-eslint-errors` agent skill

- Added the `fixing-eslint-errors` agent skill. pnpm 12.11+ links it into your project's agent skill directories once you approve it with `pnpm approve`.
- The skill lists the rules AI agents most often get stuck on, including `ts/no-unnecessary-condition`, `@2digits/type-param-names`, `@2digits/prefer-inline-handlers` and the unicorn, sonar and vitest rules. For each one it gives the fix, and it says when an `eslint-disable` comment is acceptable.
