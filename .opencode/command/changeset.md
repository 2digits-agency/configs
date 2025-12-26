---
description: Generate changeset(s) from code changes
---

Analyze code changes and create changeset entries for this monorepo.

## Context Gathering

First, understand the current state:

1. Check `git status` for staged, unstaged, and untracked files
2. Check `git diff --cached` for staged changes (preferred)
3. If no staged changes, check `git diff` for unstaged changes
4. If no local changes, check `git log main..HEAD` for unpushed commits
5. Review existing `.changeset/*.md` files for style reference

## Analysis

Determine:

1. **Affected packages** - which packages in `packages/` are modified
2. **Bump type** per package:
   - `patch`: bug fixes, internal refactors, dependency updates
   - `minor`: new features (backward compatible)
   - `major`: breaking changes (API changes, removed features)
3. **Logical grouping** - are these related changes or separate concerns?

## Single vs Multiple Changesets

Create **separate changesets** when:

- Changes serve different purposes (e.g., bug fix + new feature)
- Changes are to unrelated packages with no shared context
- A commit message would naturally be split into multiple

Create **one changeset** when:

- Changes are part of the same feature/fix across multiple packages
- Changes have a shared "why" (e.g., "update TypeScript config" touching multiple packages)

## Output Format

Generate `.changeset/<random-name>.md` for each logical change:

```
---
'@2digits/eslint-config': patch
'@2digits/prettier-config': minor
---

Brief summary line (imperative mood, ~80 chars max)

- Bullet point for each distinct change
- Use backticks for code references like `functionName()`
- Focus on user-facing impact, not implementation details
```

## Example Output

```
---
'@2digits/eslint-config': patch
---

Fix TypeScript linting in markdown code blocks

- Add `markdownDisables()` config that properly disables type-checked rules for markdown code blocks
- Set `project: false` and `projectService: false` to prevent TypeScript project resolution errors
- Move markdown-specific disables from individual TypeScript configs to dedicated markdown disables config
- Add test fixtures for TypeScript code in markdown
```

## Steps

1. Review `.changeset/*.md` for existing style reference
2. Gather changes using git commands (staged → unstaged → commits)
3. Group changes by logical concern (may result in multiple changesets)
4. For each group:
   - Map changed files to package names (`packages/X/` → `@2digits/X`)
   - Determine appropriate bump type per package
   - Generate random filename: `node -e "console.log(require('crypto').randomBytes(3).toString('hex'))"`
   - Write changeset to `.changeset/<random>.md`

## Guidelines

- Summary: imperative mood ("Fix X" not "Fixed X" or "Fixes X")
- Bullets: past tense for completed work ("Added", "Fixed", "Removed")
- Multi-package: list each affected package with appropriate bump type
- Skip packages with only test/internal changes unless user-facing
- When in doubt about grouping, prefer fewer changesets with clear scope
