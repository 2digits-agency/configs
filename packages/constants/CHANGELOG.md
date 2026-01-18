# @2digits/constants

## 1.1.15

### Patch Changes

- 4fb94d8: Migrate type checking from tsc to tsgo
  - Replaced `tsc --noEmit` with `tsgo --noEmit` in all package `types` scripts
  - Added `@typescript/native-preview` to devDependencies for tsgo binary

## 1.1.14

### Patch Changes

- a97ee7c: Updated tsdown and remove redundant main/module fields
  - Updated tsdown to 0.19.0
  - Removed `main` and `module` fields that duplicate the `exports` configuration
  - These fields are unnecessary for ESM-only packages with proper `exports` definitions

## 1.1.13

### Patch Changes

- bf25506: Update `tsdown` to 0.18.4

## 1.1.12

### Patch Changes

- e42299e: Bumped packages to force release

## 1.1.11

### Patch Changes

- f3fe438: Updated package.json repository.url to have the correct git+https url
- 2bcbdd0: Updated tsdown
- 92d4bcd: Enabled attw and publint during build

## 1.1.10

### Patch Changes

- 19e99a8: Updated dependencies
- 2a9fbab: Deduplicated dependencies

## 1.1.9

### Patch Changes

- ca321d4: Fixed tsdown builds by using the new --config-loader option

## 1.1.8

### Patch Changes

- 136e668: Patched tsdown
- 681265d: Updated dependencies

## 1.1.7

### Patch Changes

- 4050acf: Patched tsdown
- 487df06: Updated packages

## 1.1.6

### Patch Changes

- 0dfe8fc: Pinned rolldown-plugin-dts version to fix issues
- a72cdd1: Updated dependencies

## 1.1.5

### Patch Changes

- 73511c9: Updated dependencies

## 1.1.4

### Patch Changes

- 86d36fc: Updated dependencies

## 1.1.3

### Patch Changes

- a89a540: Updated dependencies

## 1.1.2

### Patch Changes

- f88036c: Changed pnpm settings thoughout monorepo

## 1.1.1

### Patch Changes

- 34e2fce: Updated dependencies

## 1.1.0

### Minor Changes

- c1a347c: Updated from unbuild to tsdown

## 1.0.0

### Major Changes

- 3b4f480: Changed to ESM export only

### Minor Changes

- 5782eb5: Changed tsup to unbuild

## 0.3.8

### Patch Changes

- 29707a0: Updated dependencies

## 0.3.7

### Patch Changes

- 77764ca: Updated typescript

## 0.3.6

### Patch Changes

- 73d2dbf: Updated tsup

## 0.3.5

### Patch Changes

- 1b9252d: Updated typescript

## 0.3.4

### Patch Changes

- f9605c5: Updated typescript

## 0.3.3

### Patch Changes

- ed3ba62: Updated package.json exports to correctly export types

## 0.3.2

### Patch Changes

- 14b8cbc: Updated typescript

## 0.3.1

### Patch Changes

- f8af040: Updated tsup

## 0.3.0

### Minor Changes

- ec136e3: Updated typescript to 5.6.2

## 0.2.5

### Patch Changes

- dda9470: Pinned all dependency versions

## 0.2.4

### Patch Changes

- 04fc87d: Changed internal versioning to use pnpm's workspace protocol

## 0.2.3

### Patch Changes

- be605e6: Changed internal versioning to use pnpm's workspace protocol

## 0.2.2

### Patch Changes

- 04d999e: Updated dependencies

## 0.2.1

### Patch Changes

- 97f3f82: Updated deps

## 0.2.0

### Minor Changes

- 23fa9b0: Updated to typescript 5.5

## 0.1.7

### Patch Changes

- 7cfdc5f: Updated dependencies

## 0.1.6

### Patch Changes

- 33a02c7: Updated dependencies
- 436aa65: Updated to pnpm 9

## 0.1.5

### Patch Changes

- 4964761: Updated to typescript 5.4

## 0.1.4

### Patch Changes

- 1e82db7: Updated dependencies

## 0.1.3

### Patch Changes

- 3e16131: Updated deps

## 0.1.2

### Patch Changes

- b0990d6: Reformatted tsconfigs
- cb3d9ca: Updated dependencies

## 0.1.1

### Patch Changes

- ff6a7bc: Updated dependencies

## 0.1.0

### Minor Changes

- 48306be: Bumped typescript version

## 0.0.6

### Patch Changes

- 310849d: Bumped deps to latest version

## 0.0.5

### Patch Changes

- f4017b4: Updated deps

## 0.0.4

### Patch Changes

- b11c8a6: Bumped typescript version

## 0.0.3

### Patch Changes

- 4c04296: Updated typescript version

## 0.0.2

### Patch Changes

- 71234fd: Updated exports fields to match new tsup output

## 0.0.1

### Patch Changes

- 42782c2: Refactored tailwindFunctions to an external constants package
