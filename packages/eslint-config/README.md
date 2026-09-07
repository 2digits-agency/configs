# @2digits/eslint-config

Shared flat ESLint configuration with TypeScript, React and optional framework integrations.

## Monorepos: lint each workspace separately

Install `eslint` and `@2digits/eslint-config` as development dependencies of each linted package/app. Keep an
`eslint.config.ts` and a narrowly scoped `tsconfig.json` in each workspace. Run ESLint from that workspace, not once
over the entire repository. ESLint must support loading TypeScript configuration files in your Node environment.

```ts
// apps/web/eslint.config.ts
import { twoDigits } from '@2digits/eslint-config';

export default twoDigits({
  ts: {
    enable: true,
    tsconfigRootDir: import.meta.dirname,
  },
  react: true,
  next: true,
  // Explicit options avoid package auto-detection and unwanted framework loading.
  css: false,
  drizzle: false,
  graphql: false,
  pnpm: false,
  storybook: false,
  tailwind: false,
  tanstackQuery: false,
  tanstackRouter: false,
  turbo: true,
  vitest: false,
  zod: false,
});
```

For a non-React package, set `react: false` and `next: false`. Omitted integrations retain auto-detection; merely
passing an options object does not enable an undetected integration, so use `enable: true` where appropriate.
CSS is opt-in and dependency linting is enabled by default (`depend: false` disables it).

Each workspace's `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

Root `package.json`:

```json
{
  "scripts": {
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix"
  }
}
```

Root `turbo.json`:

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "lint:inputs": {
      "dependsOn": ["^lint:inputs"]
    },
    "lint": {
      "dependsOn": ["lint:inputs"],
      "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/tsconfig.json", "$TURBO_ROOT$/.gitignore"],
      "outputs": []
    },
    "lint:fix": {
      "cache": false
    }
  }
}
```

Do **not** add a `lint:inputs` script. This transit task propagates dependency source changes into lint cache keys
without making each package wait for its dependencies' lint processes. Declare workspace dependencies in
`package.json`; undeclared relationships cannot invalidate caches correctly. Add any shared config files you read
to lint's inputs. A changed shared ESLint config package must invalidate its consumers too.

If lint needs generated declarations or a compiled workspace-local config, add the necessary build task dependency
(for example `^build`) to `lint.dependsOn`. Published configs do not need that build step. Do not use `--parallel`,
which bypasses the dependency graph. Use `turbo run lint --affected` to select changed workspaces and their dependents.

### Type-aware caching and memory

- Prefer **Turbo task caching alone** for typed linting. ESLint's file cache does not track type changes in other
  files: layering `eslint --cache` on a Turbo cache miss can reuse stale diagnostics. A Turbo miss should re-lint
  the package; a hit should skip ESLint entirely.
- Keep `projectService: true` (the default), avoid broad `allowDefaultProject` globs, and limit each tsconfig's
  `include` to its own sources/configs. Project Service may still load referenced dependencies needed for types.
- Set `tsconfigRootDir: import.meta.dirname` to anchor parser resolution. Nested `ts.parserOptions` values take
  precedence over the top-level TypeScript options.
- Each parallel ESLint process has its own TypeScript heap. If RAM is the bottleneck, lower Turbo's concurrency
  (for example `turbo run lint --concurrency=2`) instead of giving every process more heap.
- Keep generated output ignored. Don't disable type-aware rules just to improve a benchmark; doing so changes the
  checks you run.

## Measuring performance

From this package, after building:

```sh
vp exec node benchmarks/startup.ts
vp exec node benchmarks/startup.ts /path/to/baseline/index.mjs dist/index.mjs
vp exec node benchmarks/pack.ts
```

The benchmark alternates built entry points in fresh Node processes: one warmup and five measured samples per
scenario, reporting median import/config/total time and RSS. It includes JS-only, TypeScript and React config
construction plus linting 500 JavaScript exports. It uses warm filesystem caches, not warm Node module caches.
This is a startup/synthetic benchmark, not a prediction for an application's type graph. See [performance
experiments](PERFORMANCE.md) for decisions and measured results.
