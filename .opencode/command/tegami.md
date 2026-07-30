---
description: Generate Tegami changelog(s) from code changes
---

Write Tegami changelog entries in `.tegami/` for the current change set.

## Gather

Read-only git: `git status --short --branch`, then the staged diff (fall back to unstaged, then `git log main..HEAD`). Read every changed source file, the manifests, and the full `pnpm-workspace.yaml` catalog diff (`-U0`, filtered to `+`/`-` lines). Skim existing `.tegami/*.md` for tone.

Never stage/commit/push. Never run `tegami version` — it writes the publish lock.

## Entry format

`.tegami/<YYYY-MM-DD>-<three-random-words>.md`, e.g. `2026-07-30-tidy-ravens-mise.md`:

```
---
packages:
  'npm:@2digits/eslint-config': patch
---

## Allow schema comments in mise TOML files

- Added a `2digits:toml:mise` config that turns off `toml/spaced-comment` for `mise*.toml`
```

- Quoted `npm:`-prefixed package ids; `patch` fixes/refactors/bumps, `minor` new features, `major` breaking
- Imperative heading ("Fix X"), past-tense bullets ("Added", "Removed"), backticks for code
- At least one heading; bullets only when the detail is worth reading

## Granularity

Many small, sharply-scoped entries beat few broad ones.

- One entry per dependency bump, usually heading-only: `## Update renovate to 43.281.0`
- One entry per behavioural concern, even within a single package
- Multiple packages in one entry only for the identical change (e.g. `eslint` hitting `eslint-config` + `eslint-plugin`)
- Add a bullet when a bump forces a config change (renamed option, dropped rule) or shifts exposed behaviour
- Skip snapshot/test churn and pure reformatting; fold re-sorts into the entry they belong to

## Package targets

Take names from each `packages/*/package.json` (`packages/renovate` is `@2digits/renovate-config`). For catalog bumps, search the manifests for the dependency:

- `dependencies`/`peerDependencies` consumer → that package gets the entry
- `devDependencies`-only consumer → entry only if it is `@effect/language-service` (→ `@2digits/cli` + `@2digits/tlo-mcp`) or `eslint` (→ `@2digits/eslint-config`)
- Root-manifest-only deps, repo-wide dev tooling (`vite-plus`, `publint`, `knip`, `turbo`, `pkg-pr-new`), `overrides`, and root workflow files (`mise.toml`, `devEngines`, `scripts/*`) → one entry for `npm:@2digits/config-monorepo`

`vp pm -r ... why` is unsupported by the Vite+ wrapper; use manifest search.

## User Input

<UserRequest>
  $ARGUMENTS
</UserRequest>
