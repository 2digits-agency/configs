# @2digits/oxlint-config

Like `@2digits/eslint-config`, the default export `twoDigits(options, ...userConfigs)` builds the config from named
[oxlint-flat-config](https://github.com/liangmiQwQ/oxlint-flat-config) objects (`2digits:javascript`,
`2digits:typescript/rules`, ...). The `ts`, `react`, `vitest` and `zod` configs are enabled when their package is
installed, and accept `overrides` for their rules. Your flat config objects apply after the built-in ones; later objects
win, like ESLint:

```ts
import { twoDigits } from '@2digits/oxlint-config';

export default twoDigits(
  {
    ignores: { ignores: ['generated/**'] },
    react: true,
    vitest: { files: ['**/*.check.ts'] },
  },
  { options: { reportUnusedDisableDirectives: 'allow' } },
  { files: ['scripts/**'], rules: { 'no-console': 'off' } },
);
```

## React web checks

Enable the web profile explicitly with `twoDigits({ react: { web: true } })`. These additional web checks stay off by
default for React Native projects; installing `react-dom` does not enable the web profile automatically.

The profile enables 15 native `jsx-a11y` rules covering ARIA validity, required role properties, keyboard interaction,
focus, image alt text, associated labels, document language and iframe titles. It also enables
`react/no-unknown-property`, with only `cmdk-input-wrapper` allowed for the cmdk wrapper convention.
All new checks are errors; the existing `denyWarnings: true` policy is unchanged. No React Doctor dependency is added.

Web checks inherit `react.files` (TypeScript and TSX by default). Use `react.web.files` to select only web files in a
mixed web/native repository, and `react.web.overrides` to tune web rules:

```ts
export default twoDigits(
  {
    react: {
      web: {
        files: ['apps/web/**/*.{ts,tsx}', 'packages/web-ui/**/*.{ts,tsx}'],
        overrides: { 'jsx-a11y/label-has-associated-control': ['error', { controlComponents: ['Input'] }] },
      },
    },
  },
  { settings: { 'jsx-a11y': { components: { Label: 'label', Input: 'input' } } } },
);
```

Map only components whose props actually follow the corresponding HTML contract. Consumer flat configs still apply
last. `react.overrides` controls the general React rules; use `react.web.overrides` for the web profile's rules.

The general React preset also rejects nested component definitions with `react/no-unstable-nested-components`.
`allowAsProps: true` preserves translation callbacks and render props; inline component props are deliberately not
rejected by this rule. The existing React Compiler checks, including `react/static-components`, remain enabled.

## Shared defaults

The default preset enables `2digits/padding-line-between-statements`: statements require a blank line between them,
including variable declarations, control flow, and returns. Consecutive imports may stay grouped; existing import
group spacing is preserved. Run Oxlint with `--fix` to insert missing blank lines.

Override the rule through `twoDigits({}, { rules: { '2digits/padding-line-between-statements': 'off' } })`, or supply your own
spacing policies in its rule options.

The shared preset keeps `capitalized-comments` enabled for ordinary prose, but preserves case-sensitive
`fallow-ignore` suppression directives, including `fallow-ignore-next-line` and `fallow-ignore-file`.
The exception matches the directive family at the start of a comment; prose mentioning a directive remains checked.

The native autofix regression loads the built default export (`twoDigits()`) without consumer overrides and checks both
directive spellings byte-for-byte after two autofix passes. It also verifies lowercase prose is reported and fixed,
already capitalized prose is unchanged, and similarly named prose is still fixed.

Verified with the package's native **Oxlint 1.86.0** and Node.js 24.21.0. Vite+ 1.0.0 bundles Oxlint 1.85.0 separately;
the regression invokes the package's Oxlint CLI directly and removes Vite+'s `VP_VERSION` loader selection and
`NAPI_RS_NATIVE_LIBRARY_PATH` binary override from its child environment. This verifies comment preservation,
not Fallow's dead-code analysis.

After building the workspace, run the package's tests with `vpr test` from this directory.
