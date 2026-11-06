---
packages:
  'npm:@2digits/prettier-config': patch
---

## Ship a Prettier agent skill

The package now ships a `prettier` [pnpm agent skill](https://pnpm.io/agent-skills). It tells AI agents how to format
before committing, which rules the config enforces (120-column wrapping, leading operators, import groups, Tailwind
class sorting, Markdown), and how to fix `prettier .` failures on temporary or generated files.

Run `pnpm approve` to approve `@2digits/prettier-config`. pnpm 12.11 or later then links the skill as
`pnpm-@2digits+prettier-config-prettier`.
