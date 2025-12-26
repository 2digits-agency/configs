---
'@2digits/eslint-config': patch
---

Fix TypeScript linting in markdown code blocks

- Add `markdownDisables()` config that properly disables type-checked rules for markdown code blocks
- Set `project: false` and `projectService: false` to prevent TypeScript project resolution errors
- Move markdown-specific disables from individual TypeScript configs to dedicated markdown disables config
- Add test fixtures for TypeScript code in markdown
