# @2digits/eslint-config

## 4.13.3

### Patch Changes

- 82af422: Updated dependencies

## 4.13.2

### Patch Changes

- f8b3b31: Updated dependencies

## 4.13.1

### Patch Changes

- 9eef6d8: Updated dependencies
- 5e2b2be: Updated dependencies
- Updated dependencies [5e2b2be]
  - @2digits/eslint-plugin@3.2.4

## 4.13.0

### Minor Changes

- 0db6d35: Added new Zod validation rules:
  - zod/require-brand-type-parameter: Enforces brand type parameters
  - zod/schema-error-property-style: Standardizes error message format with literal and template literal support

### Patch Changes

- 2dec480: Updated dependencies

## 4.12.8

### Patch Changes

- 9a39932: Updated dependencies

## 4.12.7

### Patch Changes

- a839f24: Updated dependencies
- Updated dependencies [a839f24]
  - @2digits/eslint-plugin@3.2.3

## 4.12.6

### Patch Changes

- 1df59a3: Updated dependencies

## 4.12.5

### Patch Changes

- b726d7a: Updated dependencies

## 4.12.4

### Patch Changes

- 4c462e8: Updated dependencies
- a63eaeb: Removed fixupPluginRules from @eslint/compat for storybook plugin
- e5ec692: Fixed automatic storybook installation check for storybook linting rules

## 4.12.3

### Patch Changes

- 8950411: Updated dependencies
- db900bc: Updated dependencies
- Updated dependencies [8950411]
- Updated dependencies [db900bc]
  - @2digits/eslint-plugin@3.2.2

## 4.12.2

### Patch Changes

- 1881a7c: Enabled zod/no-number-schema-with-int rule
- 60f2878: Updated dependencies

## 4.12.1

### Patch Changes

- 75a4e83: Updated dependencies
- 4e87928: Removed stubbed eslint-plugin-next types
- fbf63f5: Updated zod/no-optional-and-default-together to prefer using .default when .optional and .default are both present
- Updated dependencies [75a4e83]
  - @2digits/eslint-plugin@3.2.1

## 4.12.0

### Minor Changes

- 0b01013: Updated dependencies

### Patch Changes

- Updated dependencies [0b01013]
  - @2digits/eslint-plugin@3.2.0

## 4.11.3

### Patch Changes

- 06373ea: Updated dependencies
- Updated dependencies [06373ea]
  - @2digits/eslint-plugin@3.1.28

## 4.11.2

### Patch Changes

- 78ecbb3: Sync pnpm workspace catalog: update cataloged dependencies (`@tanstack/eslint-plugin-query`, `eslint-plugin-storybook`) to their bumped catalog versions.

## 4.11.1

### Patch Changes

- 74ce116: Updated dependencies

## 4.11.0

### Minor Changes

- 5927e83: Added eslint-plugin-zod-x for linting schemas

### Patch Changes

- 750bb2b: Updated dependencies
- Updated dependencies [750bb2b]
  - @2digits/eslint-plugin@3.1.27

## 4.10.3

### Patch Changes

- cd8a68d: Updated dependencies

## 4.10.2

### Patch Changes

- 786f0f4: Updated dependencies
  - @2digits/constants@1.1.10
  - @2digits/eslint-plugin@3.1.26

## 4.10.1

### Patch Changes

- b8d3716: Updated dependencies
- Updated dependencies [b8d3716]
  - @2digits/eslint-plugin@3.1.26

## 4.10.0

### Minor Changes

- 2df758a: Renamed tanstack rules to tanstack-query
- a846a66: Renamed options.tanstack to options.tanstackQuery
- e140669: Added @tanstack/eslint-plugin-router when detecting tanstack router

### Patch Changes

- 4acf53b: Enforce better plugin naming type-safety

## 4.9.1

### Patch Changes

- 7ba67b4: Updated dependencies
- Updated dependencies [7ba67b4]
  - @2digits/eslint-plugin@3.1.25

## 4.9.0

### Minor Changes

- 14df9f0: Added eslint-plugin-depend
- 6323b10: Replaced find-up for faster alternatives

### Patch Changes

- 361364f: Updated dependencies

## 4.8.11

### Patch Changes

- 19e99a8: Updated dependencies
- 8bfcdc6: Fixed pnpm root package.json linting and check pnpm-workspace for valid packages
- 2a9fbab: Deduplicated dependencies
- Updated dependencies [19e99a8]
- Updated dependencies [2a9fbab]
  - @2digits/constants@1.1.10
  - @2digits/eslint-plugin@3.1.24

## 4.8.10

### Patch Changes

- bd13468: Updated dependencies

## 4.8.9

### Patch Changes

- 1a8b7d1: Updated dependencies
- Updated dependencies [1a8b7d1]
- Updated dependencies [63b9124]
  - @2digits/eslint-plugin@3.1.23

## 4.8.8

### Patch Changes

- 533a04f: Updated dependencies
- 1ef7e50: Updated dependencies
- Updated dependencies [533a04f]
  - @2digits/eslint-plugin@3.1.22

## 4.8.7

### Patch Changes

- 79eb56d: Updated dependencies
- 1aa6127: Updated dependencies
- Updated dependencies [1aa6127]
  - @2digits/eslint-plugin@3.1.21

## 4.8.6

### Patch Changes

- f6f3ecf: Updated dependencies
- Updated dependencies [f6f3ecf]
  - @2digits/eslint-plugin@3.1.20

## 4.8.5

### Patch Changes

- 69689ad: Updated dependencies
- ca321d4: Fixed tsdown builds by using the new --config-loader option
- Updated dependencies [ca321d4]
  - @2digits/eslint-plugin@3.1.19
  - @2digits/constants@1.1.9

## 4.8.4

### Patch Changes

- 136e668: Patched tsdown
- 681265d: Updated dependencies
- Updated dependencies [136e668]
- Updated dependencies [681265d]
  - @2digits/constants@1.1.8
  - @2digits/eslint-plugin@3.1.18

## 4.8.3

### Patch Changes

- b5c1eaf: Updated dependencies
- Updated dependencies [b5c1eaf]
  - @2digits/eslint-plugin@3.1.17

## 4.8.2

### Patch Changes

- c973e65: Updated dependencies
- Updated dependencies [c973e65]
  - @2digits/eslint-plugin@3.1.16

## 4.8.1

### Patch Changes

- 8327800: Updated dependencies

## 4.8.0

### Minor Changes

- 359b35c: CSS parser now supports Tailwind v4 and auto-detects Tailwind major version.
  - Default: Detect installed `tailwindcss` version and select `tailwind4` (v4+) or `tailwind3` (v3). Falls back to v3 if not found.
  - Fix: Resolves CSS parsing errors (e.g., CSSTree "parse.prelude" / invalid regex flags) when linting Tailwind v4 files like `@import 'tailwindcss';`.
  - New options: Override detection via `css` options passed to the factory:
    - `css: { tailwindMajor: 4 }` or `css: { tailwindMajor: 3 }` to force a version.
    - `css: { customSyntax }` to provide a custom CSS syntax parser.

  Notes
  - The previous config always used `tailwind3` grammar. This change makes v4 projects parse correctly without manual config.

### Patch Changes

- 6851bd0: Updated dependencies

## 4.7.6

### Patch Changes

- 4050acf: Patched tsdown
- 487df06: Updated packages
- Updated dependencies [4050acf]
- Updated dependencies [487df06]
  - @2digits/eslint-plugin@3.1.15
  - @2digits/constants@1.1.7

## 4.7.5

### Patch Changes

- 0dfe8fc: Pinned rolldown-plugin-dts version to fix issues
- a72cdd1: Updated dependencies
- Updated dependencies [0dfe8fc]
- Updated dependencies [a72cdd1]
  - @2digits/eslint-plugin@3.1.14
  - @2digits/constants@1.1.6

## 4.7.4

### Patch Changes

- 73511c9: Updated dependencies
- Updated dependencies [73511c9]
  - @2digits/eslint-plugin@3.1.13
  - @2digits/constants@1.1.5

## 4.7.3

### Patch Changes

- 86d36fc: Updated dependencies
- Updated dependencies [86d36fc]
  - @2digits/eslint-plugin@3.1.12
  - @2digits/constants@1.1.4

## 4.7.2

### Patch Changes

- 7ad7eb2: Updated dependencies
- 02250bc: Added tailwind-csstree for better tailwind parsing
- Updated dependencies [7ad7eb2]
  - @2digits/eslint-plugin@3.1.11

## 4.7.1

### Patch Changes

- 8bacc71: Updated dependencies
- Updated dependencies [8bacc71]
  - @2digits/eslint-plugin@3.1.10

## 4.7.0

### Minor Changes

- 709039c: Added new github actions linting rules

### Patch Changes

- 5188775: Updated dependencies

## 4.6.12

### Patch Changes

- 632cd21: Updated dependencies
- Updated dependencies [632cd21]
  - @2digits/eslint-plugin@3.1.9

## 4.6.11

### Patch Changes

- dbc588d: Updated dependencies
- Updated dependencies [dbc588d]
  - @2digits/eslint-plugin@3.1.8

## 4.6.10

### Patch Changes

- b4af45e: Updated dependencies
- Updated dependencies [b4af45e]
  - @2digits/eslint-plugin@3.1.7

## 4.6.9

### Patch Changes

- a89a540: Updated dependencies
- Updated dependencies [a89a540]
  - @2digits/eslint-plugin@3.1.6
  - @2digits/constants@1.1.3

## 4.6.8

### Patch Changes

- 443d854: Updated dependencies

## 4.6.7

### Patch Changes

- 3d6249f: Updated dependencies
- Updated dependencies [3d6249f]
  - @2digits/eslint-plugin@3.1.5

## 4.6.6

### Patch Changes

- 28d45fd: Removed the sorting of pnpm-workspace.yaml since pnpm sorts it automatically when setting catalogMode to strict
- 9c9967e: Removed explicit install of @types/node, since it's already in the monorepo root
- f88036c: Changed pnpm settings thoughout monorepo
- Updated dependencies [f88036c]
  - @2digits/eslint-plugin@3.1.4
  - @2digits/constants@1.1.2

## 4.6.5

### Patch Changes

- cc20cef: Updated dependencies

## 4.6.4

### Patch Changes

- c098153: Updated dependencies
- Updated dependencies [c098153]
  - @2digits/eslint-plugin@3.1.3

## 4.6.3

### Patch Changes

- 070ba93: Updated dependencies

## 4.6.2

### Patch Changes

- 34e2fce: Updated dependencies
- Updated dependencies [34e2fce]
  - @2digits/constants@1.1.1
  - @2digits/eslint-plugin@3.1.2

## 4.6.1

### Patch Changes

- b2a282c: Updated dependencies
- Updated dependencies [b2a282c]
  - @2digits/eslint-plugin@3.1.1

## 4.6.0

### Minor Changes

- c1a347c: Updated from unbuild to tsdown

### Patch Changes

- d68354b: Updated dependencies
- Updated dependencies [d68354b]
- Updated dependencies [c1a347c]
  - @2digits/eslint-plugin@3.1.0
  - @2digits/constants@1.1.0

## 4.5.3

### Patch Changes

- 79bf7c8: Updated dependencies
- Updated dependencies [79bf7c8]
  - @2digits/eslint-plugin@3.0.10

## 4.5.2

### Patch Changes

- 0abbe0b: Updated dependencies
- Updated dependencies [0abbe0b]
  - @2digits/eslint-plugin@3.0.9

## 4.5.1

### Patch Changes

- e8b8289: Updated dependencies
- Updated dependencies [e8b8289]
  - @2digits/eslint-plugin@3.0.8

## 4.5.0

### Minor Changes

- 17e02f9: Updated ts/array-type to the `generic` option

### Patch Changes

- 152c522: Updated code to match linting rules
- Updated dependencies [152c522]
  - @2digits/eslint-plugin@3.0.7

## 4.4.13

### Patch Changes

- 75642dc: Updated dependencies

## 4.4.12

### Patch Changes

- 32ceba1: Updated dependencies

## 4.4.11

### Patch Changes

- 3c7f153: Updated dependencies
- Updated dependencies [3c7f153]
  - @2digits/eslint-plugin@3.0.6

## 4.4.10

### Patch Changes

- 80f8354: Updated dependencies
- Updated dependencies [80f8354]
  - @2digits/eslint-plugin@3.0.5

## 4.4.9

### Patch Changes

- d7d66c9: Updated dependencies
- Updated dependencies [d7d66c9]
  - @2digits/eslint-plugin@3.0.4

## 4.4.8

### Patch Changes

- 48813ac: Updated dependencies

## 4.4.7

### Patch Changes

- 9b66a41: Updated dependencies

## 4.4.6

### Patch Changes

- c59b963: Updated dependencies
- Updated dependencies [c59b963]
  - @2digits/eslint-plugin@3.0.3

## 4.4.5

### Patch Changes

- 4342b29: Updated dependencies

## 4.4.4

### Patch Changes

- ea12e97: Updated dependencies
- Updated dependencies [ea12e97]
  - @2digits/eslint-plugin@3.0.2

## 4.4.3

### Patch Changes

- 090ed3a: Updated dependencies

## 4.4.2

### Patch Changes

- 5c10362: Updated dependencies
- Updated dependencies [5c10362]
  - @2digits/eslint-plugin@3.0.1

## 4.4.1

### Patch Changes

- 3b4f480: Changed to ESM export only
- 940e238: Updated dependencies
- Updated dependencies [18c91b9]
- Updated dependencies [3b4f480]
- Updated dependencies [5782eb5]
- Updated dependencies [ed10498]
  - @2digits/eslint-plugin@3.0.0
  - @2digits/constants@1.0.0

## 4.4.0

### Minor Changes

- 34f018f: Changed bundler from tsup to unbuild

### Patch Changes

- 942a661: Updated dependencies
- e199c01: Deferred loading optional plugins
- c155dc7: Removed unused stub typings
- 3abdd8c: Removed unused exports from index.ts
- 791274f: Loaded required plugins on start
- 2760c26: Removed re-exporting plugins from plugins.ts
- Updated dependencies [942a661]
  - @2digits/eslint-plugin@2.3.49

## 4.3.7

### Patch Changes

- 1492082: Updated dependencies
- 29707a0: Updated dependencies
- Updated dependencies [29707a0]
  - @2digits/constants@0.3.8
  - @2digits/eslint-plugin@2.3.48

## 4.3.6

### Patch Changes

- 116b122: Updated dependencies
- Updated dependencies [116b122]
  - @2digits/eslint-plugin@2.3.47

## 4.3.5

### Patch Changes

- 100220d: Updated dependencies
- Updated dependencies [100220d]
  - @2digits/eslint-plugin@2.3.46

## 4.3.4

### Patch Changes

- 780707a: Updated dependencies

## 4.3.3

### Patch Changes

- 27b7ab9: Included new "storybook/meta-satisfies-type" rule for storybook
- 7f250e9: Updated dependencies

## 4.3.2

### Patch Changes

- fff8054: Updated config to allow useless fragments for text content
- ae1cb1b: Updated dependencies
- Updated dependencies [ae1cb1b]
  - @2digits/eslint-plugin@2.3.45

## 4.3.1

### Patch Changes

- e60793a: Updated dependencies
- b8843b4: Added fixtures to test config

## 4.3.0

### Minor Changes

- cad11e8: Fixed typescript rules linting unintended markdown snippets

### Patch Changes

- 0e11aac: Fixed markdown linting rules
- ba9ca50: Updated dependencies
- e6bc3c5: Fixed yaml linting rules not applying to yml files
- Updated dependencies [ba9ca50]
  - @2digits/eslint-plugin@2.3.44

## 4.2.0

### Minor Changes

- 305656d: Added markdown linting

### Patch Changes

- 69980ff: Updated dependencies
- Updated dependencies [69980ff]
  - @2digits/eslint-plugin@2.3.43

## 4.1.1

### Patch Changes

- 64f56fe: Updated dependencies

## 4.1.0

### Minor Changes

- 1d9473b: Added eslint-plugin-pnpm for linting pnpm monorepos
- bc009b4: Added eslint-plugin-yml for yaml linting

## 4.0.2

### Patch Changes

- 6a33a2a: Updated @eslint/css and removed old workarounds
- 6d44759: Updated dependencies

## 4.0.1

### Patch Changes

- bf66f8d: Updated dependencies
- 22e2060: Updated dependencies

## 4.0.0

### Major Changes

- 0adea6b: Removed eslint-plugin-react
- 0adea6b: Introduced @stylistic/eslint-plugin for jsx related linting

### Minor Changes

- fce1f06: Added `stylistic/padding-line-between-statements` rules

### Patch Changes

- 0cd3269: Updated deps
- Updated dependencies [fce1f06]
- Updated dependencies [0cd3269]
  - @2digits/eslint-plugin@2.3.42

## 3.0.7

### Patch Changes

- 772c37c: Updated dependencies
- Updated dependencies [772c37c]
  - @2digits/eslint-plugin@2.3.41

## 3.0.6

### Patch Changes

- 557a83b: Updated dependencies
- Updated dependencies [557a83b]
  - @2digits/eslint-plugin@2.3.40

## 3.0.5

### Patch Changes

- 69700ca: Updated deps
- d168a1d: Updated react eslint plugin configs to use flat versions
- Updated dependencies [69700ca]
  - @2digits/eslint-plugin@2.3.39

## 3.0.4

### Patch Changes

- 77764ca: Updated typescript
- a77ddff: Updated @eslint/config-inspector
- d034606: Removed unused code
- d2ad4e6: Updated @types/node
- 8b36ffc: Updated eslint-plugin-react-hooks
- 792e0fe: Updated local-pkg
- 97c8dc5: Updated @next/eslint-plugin-next
- 18c1428: Updated @eslint-react/eslint-plugin
- 544de13: Updated eslint-plugin-de-morgan
- d1d2702: Updated eslint-plugin-n
- Updated dependencies [77764ca]
  - @2digits/eslint-plugin@2.3.38
  - @2digits/constants@0.3.7

## 3.0.3

### Patch Changes

- 8b327f6: Updated eslint-plugin-turbo
- 8405435: Updated typescript-eslint
- 0a2575e: Updated eslint-config-prettier
- efa45d7: Updated @eslint-react/eslint-plugin
- 73d2dbf: Updated tsup
- 7d721fd: Updated turborepo
- Updated dependencies [8405435]
- Updated dependencies [ec02094]
- Updated dependencies [73d2dbf]
  - @2digits/eslint-plugin@2.3.37
  - @2digits/constants@0.3.6

## 3.0.2

### Patch Changes

- 325b0ae: Updated globals
- bf2539a: Updated eslint monorepo
- fe4b180: Updated @eslint-react/eslint-plugin
- 1397df8: Removed unused @types/eslint\_\_js
- Updated dependencies [bf2539a]
  - @2digits/eslint-plugin@2.3.36

## 3.0.1

### Patch Changes

- b2c7ac7: Fixed @eslint/css installing fake deps
- Updated dependencies [148f68f]
  - @2digits/eslint-plugin@2.3.35

## 3.0.0

### Major Changes

- f0114ec: Added @eslint/css for css linting

### Patch Changes

- 1bc319a: Updated eslint-typegen
- 04bbec0: Updated eslint-config-flat-gitignore
- 5623a27: Updated eslint-plugin-de-morgan
- Updated dependencies [c26b3b0]
  - @2digits/eslint-plugin@2.3.34

## 2.15.2

### Patch Changes

- d211c9d: Updated eslint-plugin-storybook
- e7891a6: Updated typescript-eslint
- 32255d7: Updated eslint-plugin-unicorn
- 696db11: Updated eslint-plugin-antfu
- Updated dependencies [e7891a6]
  - @2digits/eslint-plugin@2.3.33

## 2.15.1

### Patch Changes

- 2022af5: Updated eslint-plugin-de-morgan
- 0f0d669: Updated eslint-plugin-sonarjs

## 2.15.0

### Minor Changes

- f5c6de6: Added eslint-plugin-de-morgan for boolean logic

### Patch Changes

- e3abc4c: Updated turborepo
- a73ce95: Updated globals

## 2.14.10

### Patch Changes

- e0c2587: Updated typescript-eslint
- ca03080: Updated @next/eslint-plugin-next
- d4d4f07: Updated @tanstack/eslint-plugin-query
- d6fa644: Updated eslint
- 74fcf97: Updated turbo
- Updated dependencies [e0c2587]
- Updated dependencies [d6fa644]
  - @2digits/eslint-plugin@2.3.32

## 2.14.9

### Patch Changes

- bd92458: Updated @eslint-react/eslint-plugin
- 735076a: Updated eslint
- Updated dependencies [735076a]
  - @2digits/eslint-plugin@2.3.31

## 2.14.8

### Patch Changes

- a1e5a7c: Updated typescript-eslint
- 09a2cb7: Updated eslint-flat-config-utils
- b28ee76: Updated @eslint-react/eslint-plugin
- Updated dependencies [a1e5a7c]
- Updated dependencies [4491baf]
  - @2digits/eslint-plugin@2.3.30

## 2.14.7

### Patch Changes

- 0763a36: Updated eslint-config-flat-gitignore
- a456260: Updated @tanstack/eslint-plugin-query
- bb621dd: Updated @eslint/compat
- f265e61: Updated react linting rules
- 60fb81e: Updated turborepo
- f03154d: Updated @eslint-react/eslint-plugin

## 2.14.6

### Patch Changes

- 3cf4004: Updated @tanstack/eslint-plugin-query
- 62cf0b1: Updated @eslint-react/eslint-plugin
- ed326f3: Updated typescript-eslint
- Updated dependencies [ed326f3]
  - @2digits/eslint-plugin@2.3.29

## 2.14.5

### Patch Changes

- f2bf009: Updated eslint-flat-config-utils and eslint-plugin-antfu to ESM only versions
- 76f52a3: Updated eslint-plugin-jsdoc
- efd2bc5: Updated eslint-plugin-jsonc
- 459c98a: Updated eslint
- d685e8d: Updated eslint-plugin-turbo

## 2.14.4

### Patch Changes

- d51a1f6: Updated @eslint-react/eslint-plugin
- f05e2a8: Updated eslint-flat-config-utils
- 9419262: Updated @next/eslint-plugin-next

## 2.14.3

### Patch Changes

- Updated dependencies [a46225b]
  - @2digits/eslint-plugin@2.3.28

## 2.14.2

### Patch Changes

- 35bb801: Updated typescript-eslint
- acc5130: Updated @eslint-react/eslint-plugin
- Updated dependencies [35bb801]
  - @2digits/eslint-plugin@2.3.27

## 2.14.1

### Patch Changes

- 324dc68: Updated eslint-plugin-tailwindcss
- f9bd30b: Updated @next/eslint-plugin-next
- 21c0f9c: Updated @tanstack/eslint-plugin-query
- 7ef4056: Updated eslint-plugin-jsdoc
- Updated dependencies [1832190]
  - @2digits/eslint-plugin@2.3.26

## 2.14.0

### Minor Changes

- 323e33c: Updated eslint-plugin-sonarjs to version 3.0
- 524fc62: Updated eslint-plugin-sonarjs to 2.0.4

### Patch Changes

- b46e33a: Updated eslint-plugin-sonarjs
- Updated dependencies [94828c6]
  - @2digits/eslint-plugin@2.3.25

## 2.13.3

### Patch Changes

- d394a9b: Updated typescript-eslint
- 5b735f5: Updated eslint-plugin-react and eslint-plugin-react-compiler
- e26393f: Updated eslint-config-prettier
- Updated dependencies [d394a9b]
  - @2digits/eslint-plugin@2.3.24

## 2.13.2

### Patch Changes

- 1877868: Updated eslint
- Updated dependencies [1877868]
  - @2digits/eslint-plugin@2.3.23

## 2.13.1

### Patch Changes

- 35fe541: Updated eslint-flat-config-utils
- 1b9252d: Updated typescript
- d331989: Updated @next/eslint-plugin-next
- 5badc78: Updated local-pkg
- 9b0180f: Updated eslint-typegen
- 138e4c4: Updated @eslint-react/eslint-plugin
- f56ebf5: Updated eslint-plugin-flat-gitignore
- fa080b6: Updated @eslint/config-inspector
- Updated dependencies [e72363d]
- Updated dependencies [1b9252d]
  - @2digits/eslint-plugin@2.3.22
  - @2digits/constants@0.3.5

## 2.13.0

### Minor Changes

- e6ebea1: Added eslint-plugin-jsonc
- 47ab363: Added package.json and tsconfig.json sorting

### Patch Changes

- d644918: Updated typescript-eslint
- 50638cc: Updated @tanstack/eslint-plugin-query
- 6f5b02a: Added documentation url to package.json
- 810580a: Replaced deprecated no-empty-interfaces rule
- 1b7b444: Added documentation via eslint-config-inspector
- Updated dependencies [d644918]
  - @2digits/eslint-plugin@2.3.21

## 2.12.3

### Patch Changes

- ec05dea: Updated @tanstack/eslint-plugin-query

## 2.12.2

### Patch Changes

- 80973ea: Updated eslint-plugin-storybook
- 9c0e1cd: Updated @eslint-react/eslint-plugin

## 2.12.1

### Patch Changes

- bf60eeb: Updated @next/eslint-plugin-next
- 9dbf877: Updated @eslint-react/eslint-plugin
- 4842a8a: Updated typescript-eslint
- Updated dependencies [4842a8a]
  - @2digits/eslint-plugin@2.3.20

## 2.12.0

### Minor Changes

- e65a601: Added eslint-plugin-drizzle

### Patch Changes

- 4cd2c5b: Updated typescript-eslint
- c1e2386: Updated @tanstack/eslint-plugin-query
- d8c0f2c: Fixed tanstack eslint plugin setup
- 282fc69: Updated @eslint-react/eslint-plugin
- 33119ed: Updated eslint-plugin-react
- Updated dependencies [4cd2c5b]
  - @2digits/eslint-plugin@2.3.19

## 2.11.0

### Minor Changes

- 2b1f002: Updated node to version 22 inside of node linting rules

### Patch Changes

- e550b29: Updated eslint-plugin-n
- 1d96eed: Updated globals
- a50c35f: Updated @eslint-react/eslint-plugin
- b642bc0: Updated @eslint-react/eslint-plugin
- ebbdb29: Updated @next/eslint-plugin-next

## 2.10.9

### Patch Changes

- 55a2380: Updated eslint
- 87f567f: Updated @eslint-react/eslint-plugin
- 5c4b704: Updated typescript-eslint
- Updated dependencies [3b5fc27]
- Updated dependencies [55a2380]
- Updated dependencies [5c4b704]
  - @2digits/eslint-plugin@2.3.18

## 2.10.8

### Patch Changes

- dfe64a2: Updated eslint-plugin-n
- 26a9d98: Updated eslint-plugin-jsdoc
- e49bf28: Updated eslint-plugin-next

## 2.10.7

### Patch Changes

- 582d07d: Updated typescript-eslint
- da50816: Updated @eslint-react/eslint-plugin
- Updated dependencies [582d07d]
  - @2digits/eslint-plugin@2.3.17

## 2.10.6

### Patch Changes

- 2bd9077: Updated @next/eslint-plugin-next
- 92cc201: Updated @graphql-eslint/eslint-plugin
- 74bf5f7: Updated eslint-compat
- 202b938: Updated eslint-plugin-react-hooks

## 2.10.5

### Patch Changes

- ee0caf4: Updated @graphql-eslint/eslint-plugin

## 2.10.4

### Patch Changes

- a8732d6: Updated @eslint-react/eslint-plugin
- 9bcc973: Updated typescript-eslint
- eef5195: Updated @tanstack/eslint-plugin-query
- Updated dependencies [9bcc973]
  - @2digits/eslint-plugin@2.3.16

## 2.10.3

### Patch Changes

- 7f4be09: Updated @eslint-react/eslint-plugin
- ad65bd2: Updated @graphql-eslint/eslint-plugin
- 509e167: Updated eslint
- Updated dependencies [509e167]
  - @2digits/eslint-plugin@2.3.15

## 2.10.2

### Patch Changes

- 3532101: Updated @tanstack/eslint-plugin-query
- 0da5144: Updated @graphql-eslint/eslint-plugin

## 2.10.1

### Patch Changes

- 03dca75: Updated turborepo

## 2.10.0

### Minor Changes

- 022ac60: Updated @graphql-eslint/eslint-plugin

### Patch Changes

- 28e72d7: Updated eslint-plugin-jsdoc
- e375e6f: Updated @tanstack/eslint-plugin-query

## 2.9.16

### Patch Changes

- ce18419: Updated turborepo

## 2.9.15

### Patch Changes

- 16e8878: Fixed read-only-props

## 2.9.14

### Patch Changes

- aa868a8: Updated turborepo
- 8d82f67: Updated eslint-plugin-react-compiler
- cba9c4e: Updated eslint-plugin-n
- 4de5eaa: Updated @tanstack/eslint-plugin
- a87f2c2: @eslint-react/eslint-plugin
- f9605c5: Updated typescript
- Updated dependencies [f9605c5]
  - @2digits/eslint-plugin@2.3.14
  - @2digits/constants@0.3.4

## 2.9.13

### Patch Changes

- 746ea8c: Updated local-pkg
- bd76a77: Updated eslint-plugin-unicorn
- 0310ccf: chore(deps): update typescript-eslint monorepo to v8.15.0
- 03eb96d: Updated eslint monorepo
- 4c83bf7: Updated eslint-plugin-regexp
- a2963e7: Updated eslint-plugin-storybook
- d76783d: Updated eslint-plugin-n
- Updated dependencies [0310ccf]
- Updated dependencies [03eb96d]
  - @2digits/eslint-plugin@2.3.13

## 2.9.12

### Patch Changes

- 64e8068: Updated turborepo
- daaab81: fix(deps): update dependency eslint-plugin-jsdoc to v50.5.0
- 43a189b: Updated @eslint/compat

## 2.9.11

### Patch Changes

- cd69fdf: Updated eslint-plugin-react-compiler
- af30667: Updated typescript-eslint
- Updated dependencies [af30667]
  - @2digits/eslint-plugin@2.3.12

## 2.9.10

### Patch Changes

- c77ea65: Updated @eslint-react/eslint-plugin
- 558251b: fix(deps): update dependency @tanstack/eslint-plugin-query to v5.60.1

## 2.9.9

### Patch Changes

- 9f7a9fa: fix(deps): update dependency eslint-plugin-n to v17.13.1
- 8ada331: fix(deps): update dependency @next/eslint-plugin-next to v15.0.3

## 2.9.8

### Patch Changes

- aed30c5: fix(deps): update dependency eslint-plugin-n to v17.13.0
- de3813b: fix(deps): update dependency @tanstack/eslint-plugin-query to v5.59.20

## 2.9.7

### Patch Changes

- ec99e07: Updated typescript-eslint
- 87138fc: Updated eslint-plugin-storybook
- Updated dependencies [ec99e07]
  - @2digits/eslint-plugin@2.3.11

## 2.9.6

### Patch Changes

- 7c9f1fc: fix(deps): update dependency eslint-plugin-storybook to v0.10.2
- 2f20696: fix(deps): update eslint monorepo to v9.14.0
- Updated dependencies [2f20696]
  - @2digits/eslint-plugin@2.3.10

## 2.9.5

### Patch Changes

- 8387145: Updated eslint-plugin-n
- 376f416: fix(deps): update dependency @eslint-react/eslint-plugin to v1.15.2
- 8c28fad: fix(deps): update dependency @next/eslint-plugin-next to v15.0.1

## 2.9.4

### Patch Changes

- ed3ba62: Updated package.json exports to correctly export types
- 2106afd: Updated eslint-plugin-eslint-comments
- 8c3106d: Updated @eslint-react/eslint-plugin
- 3002564: Updated @next/eslint-plugin-next
- 8b22149: Updated ts-eslint
- Updated dependencies [ed3ba62]
- Updated dependencies [8b22149]
- Updated dependencies [0c95b3a]
  - @2digits/eslint-plugin@2.3.9
  - @2digits/constants@0.3.3

## 2.9.3

### Patch Changes

- 83fe743: Updated eslint-plugin-react
- aebf50f: Updated eslint-plugin-storybook
- fb4aa3b: Updated eslint-plugin-next
- 77f159d: Updated typescript-eslint
- 831673a: Updated eslint-plugin-turbo
- Updated dependencies [77f159d]
  - @2digits/eslint-plugin@2.3.8

## 2.9.2

### Patch Changes

- 1d59c0e: Updated eslint-plugin-jsdoc
- 20e8d88: Updated typescript-eslint
- 2e2c97c: Updated eslint-plugin-react-compiler
- 3d41896: Updated eslint
- 759eb51: Updated eslint-plugin-turbo
- Updated dependencies [20e8d88]
- Updated dependencies [3d41896]
  - @2digits/eslint-plugin@2.3.7

## 2.9.1

### Patch Changes

- 054f32c: Updated eslint-plugin-react-compiler
- ac7a26d: Updated eslint-plugin-jsdoc
- 8031c28: Updated typescript-eslint
- Updated dependencies [8031c28]
- Updated dependencies [7476c3c]
  - @2digits/eslint-plugin@2.3.6

## 2.9.0

### Minor Changes

- e6d1a36: Added eslint-plugin-antfu

## 2.8.0

### Minor Changes

- d5506df: Added new regexp linting rules

### Patch Changes

- 32ea4cb: Updated storybook related linting

## 2.7.7

### Patch Changes

- d4681e4: Updated @eslint-react/eslint-plugin
- 8b81df9: Updated eslint-plugin-jsdoc
- a085b5b: Updated eslint-plugin-react-hooks

## 2.7.6

### Patch Changes

- bab132b: Updated globals
- a8ad161: Updated @next/eslint-plugin-next
- 2dcd268: Updated typescript-eslint
- 7aff9eb: Updated eslint-plugin-tailwindcss
- 14b8cbc: Updated typescript
- 2d0ec9a: Updated eslint-plugin-n
- d056cd6: Updated @tanstack/eslint-plugin-query
- Updated dependencies [2dcd268]
- Updated dependencies [14b8cbc]
  - @2digits/eslint-plugin@2.3.5
  - @2digits/constants@0.3.2

## 2.7.5

### Patch Changes

- 96f7ae9: Updated eslint
- 707e0ec: Updated @tanstack/eslint-plugin-query
- Updated dependencies [96f7ae9]
  - @2digits/eslint-plugin@2.3.4

## 2.7.4

### Patch Changes

- 4c3f468: Updated eslint-plugin-turbo
- 5134870: Updated eslint-plugin-react and eslint-plugin-next
- 63d0376: Updated eslint-plugin-unicorn and eslint-plugin-jsdoc

## 2.7.3

### Patch Changes

- b528e92: Updated tanstack query eslint plugin
- 843fc6a: Updated react eslint plugins
- 5d64fc3: Updated eslint-plugin-storybook
- c02849a: Updated eslint-plugin-jsdoc
- Updated dependencies [d0e677f]
  - @2digits/eslint-plugin@2.3.3

## 2.7.2

### Patch Changes

- fe82bf2: Updated @tanstack/eslint-plugin-query
- 815973f: Updated typescript-eslint
- 02624b0: Updated eslint-plugin-comments to enable whole file disables
- a145e8b: Updated eslint-plugin-react-compiler
- Updated dependencies [815973f]
  - @2digits/eslint-plugin@2.3.2

## 2.7.1

### Patch Changes

- 7c9b9b5: Updated eslint-plugin-turbo
- 6cbb3eb: Updated typescript-eslint
- b738e5e: Replaced eslint-plugin-eslint-comments with @eslint-community/eslint-plugin-eslint-comments
- 66b43c2: Updated eslint-plugin-n
- e43bdac: Updated graphql eslint config to allow leading underscores by default
- 1289a06: Updated eslint-plugin-react
- c0c7a5f: Updated @eslint-react/eslint-plugin
- 25a5280: Updated eslint-plugin-jsdoc
- c8f74d2: Updated eslint-plugin-react-compiler
- 237c6db: Updated @tanstack/eslint-plugin-query
- f8af040: Updated tsup
- 0570d4f: Updated eslint-plugin-next
- 2a83edd: Updated eslint
- Updated dependencies [35dc34b]
- Updated dependencies [6cbb3eb]
- Updated dependencies [f8af040]
- Updated dependencies [2a83edd]
  - @2digits/eslint-plugin@2.3.1
  - @2digits/constants@0.3.1

## 2.7.0

### Minor Changes

- ec136e3: Updated typescript to 5.6.2

### Patch Changes

- 14b8065: Updated eslint-flat-config-utils
- a1a2caa: Updated @react-eslint
- c9bd3b9: Updated @react-eslint
- 54bc0da: Updated eslint-typegen
- 2b2e356: Removed warning for unsupported versions of ts
- b21f222: Removed @types/eslint
- 2db28b8: Updated eslint-plugin-next
- Updated dependencies [ec136e3]
  - @2digits/eslint-plugin@2.3.0
  - @2digits/constants@0.3.0

## 2.6.0

### Minor Changes

- b4804ec: Updated React eslint rule names

### Patch Changes

- 7b61fd7: Updated eslint-plugin-next
- 178b174: Updated eslint-plugin-react
- 3922ea4: Updated @eslint-react
- c15e934: Updated eslint
- b4e6b1e: Updated tseslint
- Updated dependencies [c15e934]
- Updated dependencies [b4e6b1e]
  - @2digits/eslint-plugin@2.2.9

## 2.5.2

### Patch Changes

- f291f13: Updated gitignore eslint config
- a196f53: Updated dependencies
- Updated dependencies [a196f53]
  - @2digits/eslint-plugin@2.2.8

## 2.5.1

### Patch Changes

- 69eb28c: Updated eslint to 9.9.1
- Updated dependencies [69eb28c]
  - @2digits/eslint-plugin@2.2.7

## 2.5.0

### Minor Changes

- 6beea00: Updated dependencies

## 2.4.9

### Patch Changes

- 9d60fa0: Fixed issue with @eslint-react/eslint-plugin
- Updated dependencies [8f8040b]
  - @2digits/eslint-plugin@2.2.6

## 2.4.8

### Patch Changes

- c86d051: fix(deps): update dependency @eslint-react/eslint-plugin to v1.11.0

## 2.4.7

### Patch Changes

- dda9470: Pinned all dependency versions
- c3185b6: Updated dependencies
- Updated dependencies [dda9470]
- Updated dependencies [c3185b6]
  - @2digits/constants@0.2.5
  - @2digits/eslint-plugin@2.2.5

## 2.4.6

### Patch Changes

- 729b5ac: Disable react/prop-types because of false-positives

## 2.4.5

### Patch Changes

- 38524f0: Updated eslint to 9.9.0
- 80dbf0c: Updated eslint-react from 1.8.2 to 1.10.0
- 043660a: Updated tseslint from 8.0.0 to 8.0.1
- 01499ba: Updated eslint-plugin-jsdoc from 48.11.0 to 50.0.1
- 9717730: Updated eslint-plugin-n from 17.10.1 to 17.10.2
- a0da25a: Updated eslint-plugin-turborepo from 2.0.11 to 2.0.12
- Updated dependencies [38524f0]
  - @2digits/eslint-plugin@2.2.4

## 2.4.4

### Patch Changes

- 04fc87d: Changed internal versioning to use pnpm's workspace protocol
- Updated dependencies [04fc87d]
  - @2digits/eslint-plugin@2.2.3
  - @2digits/constants@0.2.4

## 2.4.3

### Patch Changes

- be605e6: Changed internal versioning to use pnpm's workspace protocol
- Updated dependencies [be605e6]
  - @2digits/eslint-plugin@2.2.2
  - @2digits/constants@0.2.3

## 2.4.2

### Patch Changes

- b3b2887: Changed typescript-eslint parser settings to use projectService

## 2.4.1

### Patch Changes

- 0a1fd78: Updated dependencies
- 856c8af: Downgraded @types/node to match node 20
- Updated dependencies [0a1fd78]
  - @2digits/eslint-plugin@2.2.1

## 2.4.0

### Minor Changes

- 0876d1c: Updated to typescript-eslint v8

### Patch Changes

- Updated dependencies [0876d1c]
  - @2digits/eslint-plugin@2.2.0

## 2.3.8

### Patch Changes

- c52a1bf: Updated eslint-plugin-turbo
- 42f5efe: Fixed option to disable graphql linting

## 2.3.7

### Patch Changes

- 9c8b68a: Updated dependencies

## 2.3.6

### Patch Changes

- 04d999e: Updated dependencies
- Updated dependencies [04d999e]
  - @2digits/eslint-plugin@2.1.5
  - @2digits/constants@0.2.2

## 2.3.5

### Patch Changes

- 6443640: Updated dependencies
- Updated dependencies [6443640]
  - @2digits/eslint-plugin@2.1.4

## 2.3.4

### Patch Changes

- 565875a: Updated dependencies
- Updated dependencies [565875a]
  - @2digits/eslint-plugin@2.1.3

## 2.3.3

### Patch Changes

- 97f3f82: Updated deps
- 71e5992: Updated dependencies
- Updated dependencies [97f3f82]
  - @2digits/eslint-plugin@2.1.2
  - @2digits/constants@0.2.1

## 2.3.2

### Patch Changes

- 47a867f: Updated typescript-eslint to support 5.5
- 3ab1797: Updated eslint-plugin-turbo
- Updated dependencies [47a867f]
  - @2digits/eslint-plugin@2.1.1

## 2.3.1

### Patch Changes

- 22beecc: Updated deps

## 2.3.0

### Minor Changes

- 23fa9b0: Updated to typescript 5.5

### Patch Changes

- Updated dependencies [23fa9b0]
  - @2digits/eslint-plugin@2.1.0
  - @2digits/constants@0.2.0

## 2.2.3

### Patch Changes

- a7e43d5: Fixed jsx-newline getting disabled by prettier
- fe1eba1: Updated deps
- Updated dependencies [fe1eba1]
  - @2digits/eslint-plugin@2.0.3

## 2.2.2

### Patch Changes

- d892f67: Removed some rules which were a bit too strict
- 7cfdc5f: Updated dependencies
- Updated dependencies [7cfdc5f]
  - @2digits/eslint-plugin@2.0.2
  - @2digits/constants@0.1.7

## 2.2.1

### Patch Changes

- 85438a0: Updated eslint-plugin-tailwindcss to fix issue

## 2.2.0

### Minor Changes

- ea9cf9d: Added sonarjs rules
- fd6e85b: Added graphql linting

## 2.1.1

### Patch Changes

- ad91acc: Updated dependencies
- 7cbda11: Disable tailwind class-sorting in the prettier disables

## 2.1.0

### Minor Changes

- 79b14f2: Added react-compiler plugin

### Patch Changes

- 8a4e12a: Updated dependencies
- 96e16c0: Updated turbo to v2
- Updated dependencies [8a4e12a]
  - @2digits/eslint-plugin@2.0.1

## 2.0.1

### Patch Changes

- e6b10e2: Fixed required dependencies

## 2.0.0

### Major Changes

- 89206d8: Updated eslint to v9

### Minor Changes

- d0c1d04: Added eslint-plugin-comments
- 52b6736: Added automatic gitignore detection to eslint
- 00dd377: Added eslint-plugin-n

### Patch Changes

- 33a02c7: Updated dependencies
- 436aa65: Updated to pnpm 9
- Updated dependencies [89206d8]
- Updated dependencies [33a02c7]
- Updated dependencies [436aa65]
  - @2digits/eslint-plugin@2.0.0
  - @2digits/constants@0.1.6

## 1.5.0

### Minor Changes

- 4964761: Updated to typescript 5.4

### Patch Changes

- Updated dependencies [4964761]
  - @2digits/eslint-plugin@1.1.0
  - @2digits/constants@0.1.5

## 1.4.0

### Minor Changes

- 201427c: Allow returning void for arrow-functions

## 1.3.1

### Patch Changes

- 6724345: Removed unused dependencies
- 7dfe32d: Updated dependencies
- 1e82db7: Updated dependencies
- Updated dependencies [6724345]
- Updated dependencies [7dfe32d]
- Updated dependencies [1e82db7]
- Updated dependencies [e4026ca]
  - @2digits/eslint-plugin@1.0.5
  - @2digits/constants@0.1.4

## 1.3.0

### Minor Changes

- 8623879: Added JSDoc linting
- 711e391: Disabled conflicting jsdoc/tag-lines rule

### Patch Changes

- 3e16131: Updated deps
- Updated dependencies [3e16131]
  - @2digits/eslint-plugin@1.0.4
  - @2digits/constants@0.1.3

## 1.2.1

### Patch Changes

- b0990d6: Reformatted tsconfigs
- cb3d9ca: Updated dependencies
- Updated dependencies [b0990d6]
- Updated dependencies [cb3d9ca]
  - @2digits/eslint-plugin@1.0.3
  - @2digits/constants@0.1.2

## 1.2.0

### Minor Changes

- 65a7dae: Added tanstack-query eslint rules

### Patch Changes

- 9e34d00: Update deps
- Updated dependencies [9e34d00]
  - @2digits/eslint-plugin@1.0.2

## 1.1.0

### Minor Changes

- dfd3348: Removed prefer-toplevel-await

### Patch Changes

- ff6a7bc: Updated dependencies
- 9a577bc: Added typechecking to eslint rule configs
- Updated dependencies [ff6a7bc]
  - @2digits/eslint-plugin@1.0.1
  - @2digits/constants@0.1.1

## 1.0.0

### Major Changes

- 2899a2e: Updated typescript-eslint deps to version 6

### Minor Changes

- d40e5b4: Use new EXPERIMENTAL_useProjectService
- 48306be: Bumped typescript version

### Patch Changes

- Updated dependencies [2899a2e]
- Updated dependencies [48306be]
  - @2digits/eslint-plugin@1.0.0
  - @2digits/constants@0.1.0

## 0.8.1

### Patch Changes

- 310849d: Bumped deps to latest version
- Updated dependencies [310849d]
  - @2digits/eslint-plugin@0.0.5
  - @2digits/constants@0.0.6

## 0.8.0

### Minor Changes

- ae50376: Removed next related rules when not using next in a project
- 104b2dc: Fixed tailwind plugin being loaded when not using tailwind in a project

### Patch Changes

- f4017b4: Updated deps
- Updated dependencies [f4017b4]
  - @2digits/eslint-plugin@0.0.4
  - @2digits/constants@0.0.5

## 0.7.2

### Patch Changes

- 4ac361d: Moved eslint to eslint-config inside repo
- 9d6ba66: Disabled default warning for html link on pages in next
- b11c8a6: Bumped typescript version
- Updated dependencies [b11c8a6]
  - @2digits/eslint-plugin@0.0.3
  - @2digits/constants@0.0.4

## 0.7.1

### Patch Changes

- 4c04296: Updated typescript version
- Updated dependencies [4c04296]
  - @2digits/constants@0.0.3
  - @2digits/eslint-plugin@0.0.2

## 0.7.0

### Minor Changes

- e8d86a1: Extend 'plugin:@2digits/recommended' config
- 08a5587: Changed eslint rule to prefer inline type imports
- 6a01f22: Removed '@typescript-eslint/naming-convention'
- 1190a3f: Added '@2digits/type-param-names' rule

### Patch Changes

- 71234fd: Updated exports fields to match new tsup output
- Updated dependencies [71234fd]
- Updated dependencies [1190a3f]
  - @2digits/constants@0.0.2
  - @2digits/eslint-plugin@0.0.1

## 0.6.2

### Patch Changes

- 1d90de8: Updated deps

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
