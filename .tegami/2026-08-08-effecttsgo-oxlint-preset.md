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
- Using it requires `pnpm add -D @effect/tsgo oxlint oxlint-tsgolint` plus a
  `"prepare": "effect-tsgo patch --oxlint"` script (add `--no-typescript` to leave TypeScript
  alone), then `export default withTwoDigits(effectConfig)`.
- `withTwoDigits` now accepts and returns `TwoDigitsConfig`, an `OxlintConfig` whose `plugins` also
  admits plugins registered by a binary patch.
- Effect rules that `@effect/tsgo` enables by default — `floating-effect`, `missing-effect-context`
  and the other 11 correctness rules — stay off, because this preset disables every Oxlint
  category. Add them to your own `rules` if you want them enforced.
