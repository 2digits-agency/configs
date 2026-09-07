# Releases

We use [Changesets v3](https://changesets.dev/guide/migration) with pnpm and Vite+.
Changesets plans versions and generates changelogs; its pnpm adapter packs and publishes packages.
Configuration lives in `.changeset/config.json`, not pnpm's native `versioning` settings.

## Record and preview changes

Run `vp run changeset` and commit the generated `.changeset/*.md` alongside the code change.
Changesets v3 also supports non-interactive entries:

```sh
vp run changeset --patch @2digits/eslint-config --message 'Fix configuration behavior.'
vp run release:status
```

Use `--minor` for features or `--major` for breaking changes. For a manual entry, map package names directly to bump types:

```md
---
'@2digits/eslint-config': patch
'@2digits/oxlint-config': patch
---

Describe the shared user-facing fix.
```

Private packages are explicitly opted into versioning, but not tagging or publishing. Repository-only tooling changes
do not require package bumps; `vp run changeset --empty` can record that decision. Keep unrelated release notes separate.

## Official CI actions

The release workflow uses the [Changesets v2 split actions](https://changesets.dev/guide/automating), paired with CLI v3:

1. **select-mode** chooses versioning, publishing, or no work using the actual Changesets and registry state.
2. **version** updates a `changeset-release/main` PR with bumped manifests, changelogs, and the refreshed pnpm lockfile.
3. **pack** builds and packs the publish plan in a job without npm credentials or OIDC permission.
4. **publish** consumes that artifact in a separate OIDC-enabled job and handles package tags and GitHub releases.

All actions are pinned to commits. Release jobs do not reuse dependency caches. Planning, versioning, and publishing
installs skip lifecycle scripts; build/pack scripts run only in the pack job. Generated-note formatting is disabled so
versioning does not need to build or execute the repository's formatter configuration.

The **pr-status** and **pr-comment** actions maintain a non-blocking release-preview comment, including for forks.
Their `pull_request_target` workflow uses a trusted base checkout, never installs dependencies or runs PR code, and
separates read-only status generation from comment-write permissions. Release PRs are skipped.

### Authentication and permissions

- Allow GitHub Actions to create PRs. Optional `RELEASE_TOKEN` enables CI events on generated release PRs; with the default
  `GITHUB_TOKEN`, a maintainer must close and reopen the PR to trigger required checks. No auto-merge is configured.
- Keep npm trusted publishers pointing to `2digits-agency/configs`, workflow **`release.yml`**. Only the publish job has
  `id-token: write`. pnpm handles OIDC and automatic provenance for eligible public packages. The existing `NPM_TOKEN`
  remains an optional fallback through setup-vp's npm auth configuration.
- The publish action uses its built-in artifact path, not a custom publish script, so Changesets can report publication,
  tags, and GitHub releases correctly. Do not replace it with a bare `pnpm publish -r` command.

## Manual verification and versioning

```sh
vp install --frozen-lockfile
vp run release:status
vp run release:version
```

Versioning consumes changesets and updates manifests/changelogs. Commit those changes and the lockfile in a release PR;
do not edit generated changelogs manually. Unlike v2, `changeset version` exits 1 when there is nothing to release.
The CI mode-selection action handles that condition. There is no pnpm consumption ledger in this workflow.

To verify the exact plan/pack path without publishing, build first and use an output directory outside the repository:

```sh
vp run build
vp exec changeset publish-plan --output /tmp/configs-publish-plan.json
vp exec changeset pack --from-publish-plan /tmp/configs-publish-plan.json --out-dir /tmp/configs-release-pack
```

No existing package versions are bumped by the tooling migration. Already-versioned packages missing on npm are included
in the publish plan without another bump. Their release notes are retained; the pending Oxlint plugin release's heading
is converted once to Changesets' `## version` format so the official action can extract its notes.
