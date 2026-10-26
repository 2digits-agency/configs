---
packages:
  'npm:@2digits/oxlint-config': minor
---

### Load more of the ESLint config's plugins through `jsPlugins`

The Oxlint preset now runs the same plugins as `@2digits/eslint-config` wherever Oxlint can load them, with the
ESLint config's config names, rule prefixes, options and toggles:

- `2digits:antfu`, `2digits:sonar` and `2digits:regexp` are always on. `2digits:depend` is on by default; turn it off with `depend: false`.
- `2digits:turbo`, `2digits:next/*`, `2digits:storybook/*`, `2digits:tailwind`, `2digits:tanstack-query`,
  `2digits:tanstack-router` and `2digits:drizzle` are enabled when their package is installed, through the `turbo`,
  `next`, `storybook`, `tailwind`, `tanstackQuery`, `tanstackRouter` and `drizzle` options.
- Next.js uses Oxlint's native `nextjs/*` rules. Only `next/no-location-assign-relative-destination`, which Oxlint
  doesn't implement, loads from `@next/eslint-plugin-next`.
- `sonar/no-for-in-iterable` and `sonar/no-ignored-return` are configured but never report, because Oxlint gives JS
  plugins no type information.
- Tailwind discovers `tailwind.config.ts`/`.js` up to the Git root, not the workspace root, because Oxlint loads
  configs synchronously.

Not ported:

- `comments` (eslint-plugin-eslint-comments): its rules report at column -1, which crashes Oxlint's JS plugin runner.
  Oxlint has native replacements
  (`reportUnusedDisableDirectives` and `unicorn/no-abusive-eslint-disable`).
- `css`, `jsonc`, `yaml`, `toml`, `markdown`, `graphql`, `github-action` and `pnpm`: these lint non-JavaScript files
  through custom parsers or languages, and Oxlint only parses JavaScript and TypeScript.
