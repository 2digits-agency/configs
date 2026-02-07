# @2digits/cli

## 1.2.29

### Patch Changes

- 1fcaa08: Disable tsgo for declaration file generation
  - Reverted to standard dts generation due to tsgo compatibility issues

## 1.2.28

### Patch Changes

- 0877a3c: Update @effect/language-service to 0.73.0
- 0877a3c: Update Effect dependencies
  - Updated `effect` to 3.19.16
  - Updated `@effect/cli` to 0.73.2
  - Updated `@effect/platform` to 0.94.3

## 1.2.27

### Patch Changes

- 6aec756: Update Effect dependencies
  - Updated `@effect/cli` to 0.73.1
  - Updated `@effect/platform` to 0.94.2
  - Updated `@effect/platform-node` to 0.104.1
  - Updated `effect` to 3.19.15

## 1.2.26

### Patch Changes

- 74fbec6: Enable tsgo for declaration file generation
  - Updated tsdown configs to use `dts: { tsgo: true }` for faster .d.ts generation

- 7b6ba6d: Update @effect/language-service to 0.72.0

## 1.2.25

### Patch Changes

- 91ee064: Update @effect/language-service to 0.71.2

## 1.2.24

### Patch Changes

- ba8d11a: Update nypm to 0.6.4
- ba8d11a: Update @effect/language-service to 0.71.1

## 1.2.23

### Patch Changes

- 730b63f: Update @effect/language-service to 0.71.0

## 1.2.22

### Patch Changes

- 4fb94d8: Migrate type checking from tsc to tsgo
  - Replaced `tsc --noEmit` with `tsgo --noEmit` in all package `types` scripts
  - Added `@typescript/native-preview` to devDependencies for tsgo binary

## 1.2.21

### Patch Changes

- 8e17255: Update @effect/language-service to 0.69.1

## 1.2.20

### Patch Changes

- a97ee7c: Updated tsdown and remove redundant main/module fields
  - Updated tsdown to 0.19.0
  - Removed `main` and `module` fields that duplicate the `exports` configuration
  - These fields are unnecessary for ESM-only packages with proper `exports` definitions

## 1.2.19

### Patch Changes

- 5aa0814: Update dependencies
  - Updated `@eslint-react/eslint-plugin` to 2.5.1
  - Updated `@typescript-eslint/*` packages to 8.52.0
  - Updated `typescript-eslint` to 8.52.0
  - Updated `eslint-plugin-turbo` to 2.7.3
  - Updated `renovate` to 42.71.2
  - Updated `@effect/language-service` to 0.64.1

## 1.2.18

### Patch Changes

- 3bbd30d: Updated dependencies

## 1.2.17

### Patch Changes

- bf25506: Update `tsdown` to 0.18.4
- bf25506: Updated dependencies

## 1.2.16

### Patch Changes

- 806698a: Updated dependencies

## 1.2.15

### Patch Changes

- 65b489b: Updated dependencies

## 1.2.14

### Patch Changes

- 5a36102: Updated dependencies
- bb1223d: Fixed default param in readPackageJson

## 1.2.13

### Patch Changes

- e42299e: Bumped packages to force release

## 1.2.12

### Patch Changes

- be22273: Updated dependencies

## 1.2.11

### Patch Changes

- 7df2a2b: Updated dependencies

## 1.2.10

### Patch Changes

- 21458cc: Updated dependencies

## 1.2.9

### Patch Changes

- e542a19: Updated dependencies

## 1.2.8

### Patch Changes

- 6151000: Updated dependencies

## 1.2.7

### Patch Changes

- f3fe438: Updated package.json repository.url to have the correct git+https url
- 2bcbdd0: Updated tsdown
- b667174: Updated dependencies
- 92d4bcd: Enabled attw and publint during build

## 1.2.6

### Patch Changes

- 5a4ff7d: Updated dependencies

## 1.2.5

### Patch Changes

- 7679d2b: Updated dependencies

## 1.2.4

### Patch Changes

- 6bd32e6: Updated dependencies

## 1.2.3

### Patch Changes

- d5ad954: Updated dependencies

## 1.2.2

### Patch Changes

- 2256882: Updated dependencies

## 1.2.1

### Patch Changes

- 82af422: Updated dependencies

## 1.2.0

### Minor Changes

- 3d711e8: Added automatic turborepo setup

### Patch Changes

- 9eef6d8: Updated dependencies
- 5e2b2be: Updated dependencies

## 1.1.0

### Minor Changes

- 8903e25: Added eslint setup
- c1b806e: Updated formatting package.json scripts

### Patch Changes

- 2dec480: Updated dependencies

## 1.0.24

### Patch Changes

- 9a39932: Updated dependencies

## 1.0.23

### Patch Changes

- a839f24: Updated dependencies

## 1.0.22

### Patch Changes

- 1df59a3: Updated dependencies

## 1.0.21

### Patch Changes

- b726d7a: Updated dependencies

## 1.0.20

### Patch Changes

- db900bc: Updated dependencies

## 1.0.19

### Patch Changes

- 60f2878: Updated dependencies

## 1.0.18

### Patch Changes

- 75a4e83: Updated dependencies

## 1.0.17

### Patch Changes

- 06373ea: Updated dependencies

## 1.0.16

### Patch Changes

- 49dbe02: Sync pnpm workspace catalog: bump the cataloged `@effect/language-service` dev dependency to the newer catalog version (keeps the CLI dev deps up to date).

## 1.0.15

### Patch Changes

- 74ce116: Updated dependencies

## 1.0.14

### Patch Changes

- cd8a68d: Updated dependencies

## 1.0.13

### Patch Changes

- 786f0f4: Updated dependencies

## 1.0.12

### Patch Changes

- b8d3716: Updated dependencies

## 1.0.11

### Patch Changes

- 7ba67b4: Updated dependencies

## 1.0.10

### Patch Changes

- 361364f: Updated dependencies

## 1.0.9

### Patch Changes

- 19e99a8: Updated dependencies
- 2a9fbab: Deduplicated dependencies

## 1.0.8

### Patch Changes

- bd13468: Updated dependencies

## 1.0.7

### Patch Changes

- 1a8b7d1: Updated dependencies

## 1.0.6

### Patch Changes

- 533a04f: Updated dependencies
- 1ef7e50: Updated dependencies

## 1.0.5

### Patch Changes

- 79eb56d: Updated dependencies
- 1aa6127: Updated dependencies

## 1.0.4

### Patch Changes

- f6f3ecf: Updated dependencies

## 1.0.3

### Patch Changes

- 69689ad: Updated dependencies
- ca321d4: Fixed tsdown builds by using the new --config-loader option

## 1.0.2

### Patch Changes

- 5c6df5d: Added basic format script logs to the output
- c45815b: Enable prettier cli option by default
- 136e668: Patched tsdown
- 2ac942a: Moved installing dependencies to use @effect/platform's Command and CommandExecutor
- 681265d: Updated dependencies

## 1.0.1

### Patch Changes

- 622d002: Set cli to private for now
- 85cbac2: Updated dependencies
