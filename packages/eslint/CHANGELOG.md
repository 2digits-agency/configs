# @2digits/eslint-config

## 0.6.1

### Patch Changes

- d3a98e3: Added eslint-plugin-storybook

## 0.6.0

### Minor Changes

- 42782c2: Refactored tailwindFunctions to an external constants package

### Patch Changes

- 2bb82c1: Added next.ts config
- 5163bba: Improved defineConfig types
- 4aed6d6: Made eslint search for tailwind config, closes #37
- d99ea1e: Refactored and unified the way the eslint config gets built
- Updated dependencies [42782c2]
  - @2digits/constants@0.0.1

## 0.5.1

### Patch Changes

- eaf5c26: Updated dependencies
- d0a5d95: Added eslint settings to better detect valid classnames
- 10639e4: Disable checking for misused promises

## 0.5.0

### Minor Changes

- 16c6614: Updated to typescript 5.1
- 46a54ba: Added tailwindcss plugin to check for valid classnames

### Patch Changes

- 6b78046: Fixed undefined being reported as a useless argument (thanks @SocialMaurits)

## 0.4.0

### Minor Changes

- 6922293: Better auto resolve react version
- ec472fd: Added filename casing linting

## 0.3.4

### Patch Changes

- eb84f61: Make sure type imports dont get converted to side effect imports
- 78922ff: Reworked pnpm install stuff
- 85e800a: Enabled max-params warning

## 0.3.3

### Patch Changes

- 9acc74f: Updated dependencies

## 0.3.2

### Patch Changes

- 76bac0d: Formatting + updates

## 0.3.1

### Patch Changes

- 7d1cb85: Updated deps

## 0.3.0

### Minor Changes

- 45398b2: Added eslint-config-next

### Patch Changes

- fec0ce1: Changed react eslint rules to only apply when react is used in a project
- 0ee62f8: Updated deps

## 0.2.1

### Patch Changes

- 194fc72: Updated react/jsx-newline to force spacing between jsx elements
- bc50a26: Switched node:path for pathe

## 0.2.0

### Minor Changes

- f74f777: Upgraded typescript

### Patch Changes

- 726a473: Upgraded all packages

## 0.1.1

### Patch Changes

- 2318b77: Fixed peerdependency to normal dependency
- 3b0003c: Added better automatic repo root detection

## 0.1.0

### Minor Changes

- 7cf1aa5: Updated the package.json to export the proper types

## 0.0.1

### Patch Changes

- 6ef9cc3: Initial release
