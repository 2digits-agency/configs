## @2digits/config-monorepo@0.0.9

### Update Node.js to 24.20.0



### Update `@effect/tsgo` to 0.38.0



### Update `knip` to 6.32.3



### Update `baseline-browser-mapping` to 2.11.20



### Update `knip` to 6.33.0

## @2digits/config-monorepo@0.0.8

### Update `@effect/tsgo` to 0.37.0



### Update `baseline-browser-mapping` to 2.11.19



### Update pnpm to 11.24.0



### Prepare Amp orbs for development

- Added lifecycle scripts that install Vite+ and restore frozen workspace dependencies in fresh orbs.

### Update renovate to 44.46.0



### Update turbo to 2.10.12

## @2digits/config-monorepo@0.0.7

### Update `tegami` to 1.4.0



### Update `turbo` to 2.10.11



### Update `baseline-browser-mapping` to 2.11.17



### Update `publint` to 0.3.24



### Stop patching Oxlint with `effect-tsgo`

- The workspace `prepare` script now runs `effect-tsgo patch --typescript` only.

### Run `oxfmt` and `oxlint` from the repo root

- Replaced `vp fmt` / `vp lint` scripts with the `oxfmt` and `oxlint` binaries.
- Moved formatter and linter options into `oxfmt.config.ts` and `oxlint.config.ts`.

### Stop running `vp check` in CI

- Removed the `vp check` step so CI does not invoke Vite+'s built-in checker. Lint, format, types, and tests already run through `vp run`.

### Update `vite-plus` to 0.3.0

- Pinned `voidzero-dev/setup-vp` to 1.18.0 in GitHub Actions.

### Update `baseline-browser-mapping` to 2.11.18



### Update `pnpm` to 11.23.0

## @2digits/config-monorepo@0.0.6

### Update pnpm to 11.22.0



### Remove the unsupported service accessor diagnostic

## @2digits/config-monorepo@0.0.5

### Update `@effect/tsgo` to 0.36.4



### Update `tegami` to 1.3.5



### Update `typescript-eslint` packages to 8.67.0



### Update `knip` to 6.32.2



### Update Vite+ packages to 0.2.9



### Update `baseline-browser-mapping` to 2.11.14



### Update pnpm to 11.21.0



### Update `@effect/tsgo` to 0.36.5

- Enabled the full Effect diagnostic profile across the repository.

### Update `pkg-pr-new` to 0.0.88



### Update `turbo` to 2.10.10

## @2digits/config-monorepo@0.0.4

### Update tegami to 1.3.1



### Update pnpm to 11.20.0



### Update Node.js to 24.19.0



### Update the baseline-browser-mapping override to 2.11.12



### Pin @typescript-eslint/types to 8.66.0

- Kept `@eslint-react` and direct TypeScript ESLint dependencies on one AST type version

### Update publint to 0.3.23



### Update tegami to 1.3.4



### Update the baseline-browser-mapping override to 2.11.13



### Update @effect/language-service to 0.87.2



### Update knip to 6.32.0



### Update pkg-pr-new to 0.0.87



### Update turbo to 2.10.9



### Update tsx to 4.23.11

## @2digits/config-monorepo@0.0.3

### Update tegami to 1.3.0



### Update knip to 6.31.0



### Update pkg-pr-new to 0.0.86



### Update turbo to 2.10.8



### Update vite-plus to 0.2.7



### Update the baseline-browser-mapping override to 2.11.10



### Update the vite alias to @voidzero-dev/vite-plus-core 0.2.7

## @2digits/config-monorepo@0.0.2

### Update the baseline-browser-mapping override to 2.11.4



### Update tegami to 1.2.7



### Make the Tegami script importable

- Resolved `cwd` from the script location so it works regardless of the invoking directory
- Guarded `runCli()` behind `import.meta.main` and enabled `createTags` and `release`

### Update pkg-pr-new to 0.0.82



### Update publint to 0.3.22



### Update the baseline-browser-mapping override to 2.11.7



### Update pkg-pr-new to 0.0.80



### Update turbo to 2.10.7



### Update vite-plus to 0.2.6



### Update knip to 6.29.0



### Manage toolchain versions through idiomatic version files

- Dropped the pinned `[tools]` versions from `mise.toml` in favour of `idiomatic_version_file_enable_tools` for `node` and `pnpm`
- Added a `mise i -q` enter hook and the mise schema comment
- Declared `devEngines.packageManager` (pnpm 11.18.0, `onFail: download`) in the root manifest

## @2digits/config-monorepo@0.0.1

### Updated pnpm to v11.15.1



### Update tegami to 1.2.6



### Update pkg-pr-new to 0.0.79
