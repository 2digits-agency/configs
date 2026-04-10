---
description: Generate changeset(s) from code changes
model: opencode-go/kimi-k2.5
---

Analyze code changes and create changeset entries for this monorepo.

## Context Gathering

First, understand the current state:

1. Check `git status` for staged, unstaged, and untracked files
2. Check `git diff --cached` for staged changes (preferred)
3. If no staged changes, check `git diff` for unstaged changes
4. If no local changes, check `git log main..HEAD` for unpushed commits
5. Review existing `.changeset/*.md` files for style reference
6. Scan all `packages/*/CHANGELOG.md` files for recent entry style/tone

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

```
---
'@2digits/eslint-config': patch
---

Update @eslint-react/eslint-plugin to 2.5.5

- Removed `react-extra/no-implicit-key` rule (dropped upstream)
- Updated generated types with minor doc improvements
```

```
---
'@2digits/renovate-config': patch
---

Update renovate to 42.78.1
```

## Steps

1. Review `.changeset/*.md` for existing style reference
2. Gather changes using git commands (staged → unstaged → commits)
3. Group changes by logical concern (may result in multiple changesets)
4. For each group:
   - Map changed files to package names (`packages/X/` → `@2digits/X`)
   - Determine appropriate bump type per package
   - Generate random filename: `vpx human-id --separator - --case lower` (outputs kebab-case like `ready-cups-dream`)
   - Write changeset to `.changeset/<random>.md`

## Guidelines

- Summary: imperative mood ("Fix X" not "Fixed X" or "Fixes X")
- Bullets: past tense for completed work ("Added", "Fixed", "Removed")
- Multi-package: list each affected package with appropriate bump type
- Skip packages with only test/internal changes unless user-facing
- When in doubt about grouping, prefer fewer changesets with clear scope
- Dependency-only changesets should usually use short, specific summaries like `Update renovate to 43.84.0`
- Use bullets for dependency updates only when grouping multiple related packages or when upstream changes affect exposed behavior/rules

## Package-Specific Reminders

- **renovate updates**: Always create a changeset for `@2digits/renovate-config` when `renovate` version changes in catalog
- **@effect/language-service updates**: Always create a changeset for `@2digits/cli` when `@effect/language-service` version changes in catalog
- **Effect dependency updates**: When `effect`, `@effect/cli`, `@effect/platform`, or `@effect/platform-node` change, create a changeset for `@2digits/cli` and `@2digits/tlo-mcp` (both use Effect)
- **prettier updates**: Always create a changeset for `@2digits/prettier-config` when `prettier` version changes in catalog
- **@opencode-ai/plugin updates**: Always create a changeset for `@2digits/opencode-plugin` when `@opencode-ai/plugin` version changes in catalog
- **ESLint plugin updates**: Create a changeset for `@2digits/eslint-config` when any ESLint-related plugin changes (e.g., `@eslint-react/*`, `@stylistic/*`, `@tanstack/eslint-plugin-*`, `eslint-plugin-*`, `globals`)
- **`ts-api-utils` updates**: Create a changeset for `@2digits/eslint-plugin` when `ts-api-utils` changes in catalog

### Patterns from existing changelogs

- **`@2digits/renovate-config`**: Use a one-line patch summary like `Update renovate to x.y.z`
- **`@2digits/opencode-plugin`**: Use a one-line patch summary like `Update @opencode-ai/plugin to x.y.z`
- **`@2digits/prettier-config`**: Use a one-line patch summary like `Update prettier to x.y.z`
- **`@2digits/eslint-plugin`**: Use a one-line patch summary for isolated dependency bumps like `Update ts-api-utils to x.y.z`
- **`@2digits/cli` and `@2digits/tlo-mcp`**: Group related Effect runtime updates under `Update Effect ecosystem dependencies` and list version bumps in bullets when multiple packages changed together
- **`@2digits/cli` and `@2digits/tlo-mcp`**: `@effect/language-service` still gets a patch changeset even though it is usually a dev-only dependency
- **`@2digits/eslint-config`**: Prefer `Update ESLint plugins` or `Update ESLint core and plugins`; add bullets when upstream rule changes or generated types changed

## Catalog Change Detection

When `pnpm-workspace.yaml` is modified, always run `git diff --cached pnpm-workspace.yaml` (or `git diff` if unstaged) to see the full list of catalog version changes. For each changed dependency, run the catalog consumer helper below, auto-include `runtime` consumers, apply package-specific reminders and changelog patterns, and treat uncovered `devOnly` consumers as candidates that require a follow-up question before generating a changeset.

### Catalog Consumer Helper

Use this helper for each changed catalog dependency:

```bash
DEP='effect'
pnpm -r --filter './packages/*' why "$DEP" --json | jq --arg dep "$DEP" '
  {
    dependency: $dep,
    runtime: [
      .[] | .dependents[]?
      | select(.name | startswith("@2digits/"))
      | select(.depField == "dependencies" or .depField == "peerDependencies")
      | .name
    ] | unique | sort,
    devOnly: [
      .[] | .dependents[]?
      | select(.name | startswith("@2digits/"))
      | select(.depField == "devDependencies")
      | .name
    ] | unique | sort
  }
'
```

Interpretation:

- `runtime`: default changeset targets
- `devOnly`: possible changeset targets; first check package-specific reminders and changelog patterns
- empty `runtime` and `devOnly`: root/tooling only, no package changeset needed

### Catalog Decision Rules

1. Use `runtime` consumers as the default package set for the dependency change.
2. If a dependency matches a package-specific reminder or changelog pattern, follow that guidance even when the consumer is only in `devOnly`.
3. If `devOnly` consumers remain uncovered after applying known guidance, use the question tool to ask whether they should get a changeset.
4. If multiple related catalog dependencies changed together for the same packages, prefer one grouped changeset with a shared why.

## User Input

<UserRequest>
  $ARGUMENTS
</UserRequest>
