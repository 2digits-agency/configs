---
packages:
  'npm:@2digits/eslint-config': minor
---

## Ship a `monorepo-linting` agent skill

The package now ships an agent skill that explains how to set up fast typed linting in pnpm and Turborepo monorepos: one ESLint config per package, Turborepo caching instead of `eslint --cache`, and how to diagnose slow lint runs.

pnpm 12.11 and later links it into your agent skill directories on install once you approve it with `pnpm approve @2digits/eslint-config`, or add this to `pnpm-workspace.yaml`:

```yaml
permissions:
  '@2digits/eslint-config':
    skills: true
```
