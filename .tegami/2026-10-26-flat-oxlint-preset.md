---
packages:
  'npm:@2digits/oxlint-config': major
---

### Mirror the ESLint config's factory, built on oxlint-flat-config

`@2digits/oxlint-config` now has the same shape as `@2digits/eslint-config`: the default export
`twoDigits(options, ...userConfigs)` composes named
[oxlint-flat-config](https://github.com/liangmiQwQ/oxlint-flat-config) objects (`2digits:javascript`,
`2digits:typescript/rules`, `2digits:vitest/rules`, ...) and appends your flat config objects after them, so later
objects win.

- `ts`, `react`, `vitest` and `zod` are enabled when their package is installed. Pass `true`/`false` or an options
  object to override; `js`, `ts`, `react`, `vitest` and `zod` accept `overrides` for their rules.
- Vitest rules apply to test files only, and React rules to `.ts` and `.tsx` files only, like the ESLint config. Both
  accept `files`.
- Test globals and the relaxed `no-unused-expressions` now apply to `*.test.ts(x)` and `*.spec.ts(x)` files; the
  previous glob matched no files. The `vitest.typecheck` setting (option `vitest.typecheck`) now reaches Oxlint.

Migration:

- Replace `withTwoDigits(config)` with `twoDigits(options, ...configs)`.
- Replace `ignorePatterns: [...]` with `twoDigits({ ignores: { ignores: [...] } })`. Patterns are anchored to the config
  directory, so write `**/dist` to match at any depth.
- Replace `overrides: [{ files, rules }]` with separate `{ files, rules }` objects.
- Drop `plugins` and `categories`; every built-in plugin is enabled and only configured rules run.
- The `./base` and `./typescript` entry points are removed.
