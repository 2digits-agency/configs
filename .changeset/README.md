# Releases

We use [pnpm's native release management](https://pnpm.io/versioning), which reads and writes
[Changesets-format files](https://pnpm.io/using-changesets). The pinned pnpm version handles version planning,
dependent bumps, changelogs, and publishing; neither Tegami nor `@changesets/cli` is required.

## Record a change

Run `vp run changeset` from the repository root and commit the generated `.changeset/*.md` file with the code change.
For a non-interactive entry:

```sh
vp run changeset @2digits/eslint-config --bump patch --summary 'Fix configuration behavior.'
```

Or write a file directly:

```md
---
'@2digits/eslint-config': patch
'@2digits/oxlint-config': patch
---

Describe the shared user-facing fix.
```

Use `patch`, `minor`, or `major`. Names must match package manifests, without `npm:` prefixes or a `packages:` wrapper.
Private packages can have change intents and changelogs, but recursive publishing skips them. Repository-only tooling
changes do not require a package release.

Preview with `vp run release:status` or `vp pm version -- -r --dry-run` (no writes).
The read-only **Changeset PR** check also puts the release preview in its GitHub Actions job summary, including for forks.

## Automated releases

On pushes to `main`, `.github/workflows/release.yml`:

1. Computes the native pnpm release plan. Pending intents produce a `release/main` PR containing bumped manifests,
   repository changelogs, the refreshed lockfile, and pnpm's `.changeset/ledger.yaml` consumption record.
2. When no pending release remains (normally after that PR merges), builds and publishes manifest versions not already
   on npm with `pnpm publish -r --access public --provenance`, through Vite+.
3. Creates missing `package-name@version` tags and GitHub releases from the committed changelogs. Existing releases are
   left untouched; rerunning a failed release step repairs missing releases without republishing existing npm versions.

Do not edit the generated ledger or changelogs manually. Commit the ledger and consumed intent deletions with each release.
Repository changelog storage is configured in `pnpm-workspace.yaml`; existing release history is retained unchanged.
There are no pending pre-migration notes to convert: the old publish lock's notes were already versioned into the manifests
and changelogs. Any of those versions still missing on npm will be picked up by recursive publishing without another bump.

### GitHub and npm setup

- Allow GitHub Actions to create pull requests. The workflow requests `contents: write` and `pull-requests: write`.
- Optionally set `RELEASE_TOKEN` to a bot token with repository contents and pull-request write permissions so generated
  release PRs trigger CI. With the default `GITHUB_TOKEN`, GitHub suppresses those events; a maintainer must close and reopen
  the PR to trigger required checks before merging. No automatic merge is configured.
- Keep npm trusted publishers pointing to `2digits-agency/configs`, workflow **`release.yml`**. The filename and
  `id-token: write` permission are unchanged. Native pnpm uses OIDC for each public package; the existing `NPM_TOKEN` secret
  remains an optional fallback through the setup-generated npm auth configuration.
- Only the `main` workflow publishes. PR previews have read-only permissions and never receive publishing credentials.

## Manual release

From a clean, up-to-date checkout of `main`, preview first, then prepare the version commit:

```sh
vp install --frozen-lockfile
vp run release:status
vp run release:version
```

Review and commit the generated changes in a release PR. Merging it lets CI build, publish, and create GitHub releases.
`vp run release:publish` is intended for the authorized GitHub Actions environment: provenance requires supported CI.
For local packaging verification without uploading anything:

```sh
vp run build
vp pm publish -- -r --dry-run --no-git-checks
```

The `vp pm` separator is significant: use `--` before native pnpm flags. `vp run changeset` wraps `vp exec pnpm change`
because this version of Vite+ does not yet expose `change` through `vp pm`.
