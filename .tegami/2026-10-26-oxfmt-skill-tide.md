---
packages:
  'npm:@2digits/oxfmt-config': patch
---

### Ship a formatting agent skill

- The package now ships a `formatting` agent skill. After `pnpm approve`, pnpm links it into the project's agent skill folders as `pnpm-@2digits+oxfmt-config-formatting` (pnpm 12.11 or later).
- The skill explains the preset's import order, the rewrites agents trip over, ignore patterns, the pinned `oxfmt` peer, editor format-on-save and how to fix a failing format check.
