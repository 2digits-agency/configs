---
description: Generate pnpm changesets from code changes
---

Write Changesets-format change intents in `.changeset/` for pnpm's native release flow.

## Gather

Read-only git: `git status --short --branch`, then the staged diff (fall back to unstaged, then `git log main..HEAD`). Read every changed source file, the manifests, and the full `pnpm-workspace.yaml` catalog diff (`-U0`, filtered to `+`/`-` lines). Skim existing `.changeset/*.md` for tone.

Never stage/commit/push. Never run versioning or publishing — only write change intents and preview with `vp run release:status`.

## Entry format

`.changeset/<three-random-words>.md`, e.g. `tidy-ravens-mise.md`:

```
---
'@2digits/eslint-config': patch
---

Allow schema comments in mise TOML files.

- Added a `2digits:toml:mise` config that turns off `toml/spaced-comment` for `mise*.toml`
```

- Quoted package names directly mapped to bump types; `patch` fixes/refactors/bumps, `minor` new features, `major` breaking
- Imperative summary ("Fix X"), past-tense bullets ("Added", "Removed"), backticks for code
- Plain summaries are sufficient; pnpm generates the changelog headings. Add bullets only when the detail is worth reading

## Granularity

Many small, sharply-scoped entries beat few broad ones.

- One entry per dependency bump, usually summary-only: `Update renovate to 43.281.0`
- One entry per behavioural concern, even within a single package
- Multiple packages in one entry only for the identical change (e.g. `eslint` hitting `eslint-config` + `eslint-plugin`)
- Add a bullet when a bump forces a config change (renamed option, dropped rule) or shifts exposed behaviour
- Skip snapshot/test churn and pure reformatting; fold re-sorts into the entry they belong to

## Package targets

Take names from each `packages/*/package.json` (`packages/renovate` is `@2digits/renovate-config`). For catalog bumps, search the manifests for the dependency:

- `dependencies`/`peerDependencies` consumer → that package gets the entry
- `devDependencies`-only consumer → entry only if it is `@effect/language-service` (→ `@2digits/cli` + `@2digits/tlo-mcp`) or `eslint` (→ `@2digits/eslint-config`)
- Root-only dependencies, repo-wide dev tooling, and workflow changes need no package release. For overrides, target packages whose published behavior changes

`vp pm -r ... why` is unsupported by the Vite+ wrapper; use manifest search.

## User Input

<UserRequest>
  $ARGUMENTS
</UserRequest>
