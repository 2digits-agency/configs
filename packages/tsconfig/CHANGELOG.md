## @2digits/tsconfig@1.1.0

### Update `@effect/tsgo` to 0.61.0



### Enable the `flatMapIdentityToFlatten` Effect diagnostic

- Reported `flatMap` calls with an identity callback as errors, suggesting `flatten` instead.

## @2digits/tsconfig@1.0.7

### Pin the `@effect/tsgo` peer dependency

The optional `@effect/tsgo` peer dependency now uses the same exact version as the development dependency (0.59.0)
instead of `^0.45.0`, so installing the version that `effect.json` targets no longer causes a peer mismatch.

## @2digits/tsconfig@1.0.6

### Expand Effect namespace imports

Prefer namespace imports for all public packages in the Alchemy, Effect, and Yielded auth monorepos, keeping the existing barrel-import exception for `@effect/vitest`.

## @2digits/tsconfig@1.0.5

### Update @effect/tsgo to 0.57.0

## @2digits/tsconfig@1.0.4

### Update TypeScript to 7.1.0-beta

- Bumped the `typescript` catalog dependency from 7.0.2 to 7.1.0-beta
- The supported peer range `^6.0.3 || ^7.0.2` already covers the new release, so no range change was needed

## @2digits/tsconfig@1.0.3

### Update `@effect/tsgo` to 0.56.0

- Bumped the `@effect/tsgo` catalog dependency from 0.54.0 to 0.56.0

### Enable the `preferEffectString` rule in the Effect preset

- Added `"preferEffectString": "error"` to `effect.json`, so consumers that extend the preset now get an error when they call native string methods instead of `effect/String` helpers

## @2digits/tsconfig@1.0.2

### Enable schemaClassObjectLiteral rule in effect config

- Added `schemaClassObjectLiteral: error` to the `@effect/language-service` plugin rules in `effect.json`

### Update @effect/tsgo to 0.54.0

## @2digits/tsconfig@1.0.1

### Update @effect/tsgo to 0.53.4



### Expand namespace import packages list

- Replaced the wildcard `@effect/*` entry with an explicit, sorted list of Effect namespace import packages

## @2digits/tsconfig@1.0.0

### Reject error payloads that shadow `name`

- Enabled `errorPayloadShadowsName` as an error in `effect.json`, requiring flagged error payload fields to be renamed

### Update `@effect/tsgo` to 0.53.1



### Require Effect array helpers

- Enabled `preferEffectArray` as an error in `effect.json`, requiring flagged native array operations to use Effect helpers

### Require `Effect.yieldNow` instead of zero-duration sleeps

- Enabled `effectSleepZeroToYieldNow` as an error in `effect.json`; flagged `Effect.sleep(0)` calls now need `Effect.yieldNow`

### Require schema-based tagged errors

- Enabled `preferSchemaTaggedError` as an error in `effect.json`, requiring flagged tagged error definitions to use `Schema.TaggedError`

### Enforce Effect import conventions

- Enabled `preferBarrelImport` and `preferNamespaceImport` as errors in `effect.json`
- Configured barrel imports for `@effect/vitest` and namespace imports for Effect platform packages, `@yielded/oauth`, `@yielded/jose`, `@yielded/crypto`, and `alchemy`; existing imports may need migration

### Require `Effect.tap` for side effects that preserve the original value

- Enabled `flatMapToTap` as an error in `effect.json`, requiring flagged `Effect.flatMap` calls to use `Effect.tap`

### Require brands on schema classes

- Enabled `schemaClassMissingBrand` as an error in `effect.json`; flagged schema classes now need a unique brand

### Require Effect record helpers

- Enabled `preferEffectRecord` as an error in `effect.json`, requiring flagged native object operations to use Effect helpers

## @2digits/tsconfig@0.9.2

### Update @effect/tsgo to 0.51.0



### Disable Effect API stability diagnostics

- Disabled `experimentalApiUsage`, `unstableApiUsage` and `apiStabilityLeak` in the Effect TypeScript configuration.

## @2digits/tsconfig@0.9.1

### Update `@effect/tsgo` to 0.48.0



### Fix Effect diagnostic configuration

- Removed unsupported options and diagnostic names, and enabled new simplification diagnostics.
- Kept experimental- and unstable-API notices visible as non-blocking suggestions.

## @2digits/tsconfig@0.9.0

### Add an Effect TypeScript configuration preset

- Added `@2digits/tsconfig/effect.json`, extending the base config with Effect language-service and tsgo plugin settings, diagnostics, import aliases, and test overrides.

## @2digits/tsconfig@0.8.8

### Adopt TypeScript 7 while preserving ESLint compatibility

- Migrated non-ESLint package type checks and declaration builds to TypeScript 7.0.2, replacing native-preview and alias dependencies.
- Retained fast `tsgo` type checks for the ESLint config and plugin while keeping their TypeScript compiler API dependencies on TypeScript 6.0.3 through the named `eslint` catalog.
- Expanded the shared tsconfig's TypeScript peer range to support both TypeScript 6 and 7.

# @2digits/tsconfig

## 0.8.7

### Patch Changes

- 85ba774: Update TypeScript to 6.0.2

## 0.8.6

### Patch Changes

- e42299e: Bumped packages to force release

## 0.8.5

### Patch Changes

- f3fe438: Updated package.json repository.url to have the correct git+https url

## 0.8.4

### Patch Changes

- 5c75f4b: Added allowArbitraryExtensions=true to enable e.g. .d.json.ts

## 0.8.3

### Patch Changes

- 0d0a1a5: Changed peerDependencies to use catalog:
- 19e99a8: Updated dependencies
- 2a9fbab: Deduplicated dependencies

## 0.8.2

### Patch Changes

- 0dfe8fc: Pinned rolldown-plugin-dts version to fix issues

## 0.8.1

### Patch Changes

- 73511c9: Updated dependencies

## 0.8.0

### Minor Changes

- 76197fe: Enable incremental by default

### Patch Changes

- f88036c: Changed pnpm settings thoughout monorepo

## 0.7.1

### Patch Changes

- 29707a0: Updated dependencies

## 0.7.0

### Minor Changes

- 2fffed4: Updated tsconfig to only allow erasable syntax

### Patch Changes

- 77764ca: Updated typescript

## 0.6.3

### Patch Changes

- 1b9252d: Updated typescript

## 0.6.2

### Patch Changes

- f9605c5: Updated typescript

## 0.6.1

### Patch Changes

- 14b8cbc: Updated typescript

## 0.6.0

### Minor Changes

- ec136e3: Updated typescript to 5.6.2

## 0.5.1

### Patch Changes

- dda9470: Pinned all dependency versions

## 0.5.0

### Minor Changes

- 25a4d6d: Updated tsconfig to match totaltypescript recommendations

## 0.4.0

### Minor Changes

- 23fa9b0: Updated to typescript 5.5

## 0.3.5

### Patch Changes

- 33a02c7: Updated dependencies
- 436aa65: Updated to pnpm 9

## 0.3.4

### Patch Changes

- 3e16131: Updated deps

## 0.3.3

### Patch Changes

- b0990d6: Reformatted tsconfigs
- cb3d9ca: Updated dependencies

## 0.3.2

### Patch Changes

- ff6a7bc: Updated dependencies

## 0.3.1

### Patch Changes

- 48306be: Bumped typescript version

## 0.3.0

### Minor Changes

- 202d0a3: Disabled generating declarations and declaration maps

### Patch Changes

- f4017b4: Updated deps

## 0.2.1

### Patch Changes

- b11c8a6: Bumped typescript version

## 0.2.0

### Minor Changes

- 16c6614: Updated to typescript 5.1

## 0.1.4

### Patch Changes

- 2cf70bf: Removed resolvePackageJsonExports since it screwed up base node resolves

## 0.1.3

### Patch Changes

- 4541687: Enabled resolvePackageJsonExports
- 30fc28d: Updated target to ESNext
- 78922ff: Reworked pnpm install stuff

## 0.1.2

### Patch Changes

- d0e7586: Updated types for the defineConfig helper util
- 7d1cb85: Updated deps
- c0293b9: Updated tsconfig to show full errors by default

## 0.1.1

### Patch Changes

- fe6c2e8: Changed moduleResolution to bundler

## 0.1.0

### Minor Changes

- f74f777: Upgraded typescript

### Patch Changes

- 726a473: Upgraded all packages

## 0.0.1

### Patch Changes

- 6ef9cc3: Initial release
