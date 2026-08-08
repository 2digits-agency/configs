---
packages:
  'npm:@2digits/oxlint-config': minor
---

## Add an opt-in Effect preset for the `effecttsgo` plugin

- New `@2digits/oxlint-config/effect` entrypoint exporting `effectConfig`, which enables the
  `effecttsgo` plugin from `@effect/tsgo` in type-aware mode and configures 82 Effect rules
  (`missing-pipeable-signature`, `strict-boolean-expressions` and `strict-effect-provide` as
  warnings, the rest as errors).
- The preset is deliberately not part of `twoDigits`. Oxlint rejects the entire configuration with
  `Unknown plugin: 'effecttsgo'` when its binary is unpatched, so projects that do not use Effect
  are unaffected and keep linting as before.
- Also exports `effectConfigFor(files)`, which keeps the plugin enabled globally but restricts the
  rules to the given globs. Rules such as `async-function`, `process-env` and `node-builtin-import`
  judge plain TypeScript too, so a repository that mixes Effect and non-Effect packages should name
  its Effect sources rather than reporting unfollowable advice everywhere.
- The installed `oxlint`, `oxlint-tsgolint` and `@effect/tsgo` versions must match each other;
  `effect-tsgo patch` refuses to run otherwise. `@effect/tsgo@0.36.0` supports `oxlint@1.77.0` with
  `oxlint-tsgolint@7.0.2001`, which is what this repository's catalog pins. Set up a consumer with:

  ```sh
  pnpm add -D @effect/tsgo@0.36.0 oxlint@1.77.0 oxlint-tsgolint@7.0.2001
  ```

  then add `"prepare": "effect-tsgo patch --oxlint"` (append `--no-typescript` to leave TypeScript
  alone) and `export default withTwoDigits(effectConfig)`.

- `withTwoDigits` now accepts and returns `TwoDigitsConfig`, an `OxlintConfig` whose `plugins` also
  admits plugins registered by a binary patch, and appends each config's `overrides` in argument
  order. Previously `defu` prepended them, so a later config's override lost to an earlier one even
  though the documented contract is that later configs win.
- Effect rules that `@effect/tsgo` enables by default — `floating-effect`, `missing-effect-context`
  and the other 11 correctness rules — stay off, because this preset disables every Oxlint
  category. Add them to your own `rules` if you want them enforced.
