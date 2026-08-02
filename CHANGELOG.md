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
