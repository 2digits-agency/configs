---
name: monorepo-linting
description: Sets up @2digits/eslint-config for fast typed linting in pnpm and Turborepo monorepos. Use when adding ESLint to a monorepo or package, editing lint tasks in turbo.json, deciding on eslint --cache, or when linting is slow or runs out of memory.
---

# Fast typed linting in a monorepo

`@2digits/eslint-config` enables typescript-eslint's type-checked rules with `projectService`. Typed linting costs about as much as running `tsc` on the same files, so the setup aims to type-check each package once, in parallel, and skip unchanged packages entirely.

The rule of thumb: **one ESLint config and `lint` script per workspace package, cached by Turborepo, no `eslint --cache`.**

## Layout

Each workspace package (`apps/*`, `packages/*`) gets its own config and scripts:

```ts
// apps/web/eslint.config.ts
import { twoDigits } from '@2digits/eslint-config';

export default twoDigits({
  ts: { tsconfigRootDir: import.meta.dirname },
});
```

`apps/web/package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "devDependencies": {
    "@2digits/eslint-config": "...",
    "eslint": "..."
  }
}
```

The root keeps a config only for root-level files and ignores the packages, so no file is linted twice:

```ts
// eslint.config.ts
import { twoDigits } from '@2digits/eslint-config';

export default twoDigits({
  ts: { tsconfigRootDir: import.meta.dirname },
  ignores: { ignores: ['apps/**', 'packages/**'] },
});
```

Why per package rather than one root `eslint .`:

- Turborepo caches and parallelises per package, so an unchanged package costs a cache hit instead of a type-check.
- Each ESLint process only loads the TypeScript programs of its own package, which keeps memory bounded.
- Packages can turn on framework options (`react`, `next`, `storybook`, ...) only where they apply.

`tsconfigRootDir: import.meta.dirname` pins type resolution to the config's package, also when an editor or script runs ESLint from the repository root. The default is `process.cwd()`.

## Turborepo tasks

Use a transit node so `lint` runs in parallel yet is invalidated when an internal dependency's source changes:

`turbo.json`:

```json
{
  "tasks": {
    "topo": { "dependsOn": ["^topo"] },
    "lint": { "dependsOn": ["topo"], "outputLogs": "new-only" },
    "lint:fix": { "cache": false },
    "//#lint:root": { "outputLogs": "new-only" }
  }
}
```

- Add `"^build"` to `lint.dependsOn` only when internal packages expose their types from build output (`dist/*.d.ts`). Packages that export TypeScript source need no build before linting.
- The default inputs (`$TURBO_DEFAULT$`, all git-tracked files in the package) are correct. Add `$TURBO_ROOT$/...` inputs for every root file a package reads outside its directory, typically a shared `tsconfig.base.json` that its `tsconfig.json` extends.
- `lint:fix` writes source files, so it is not cached.
- Enable Remote Cache in CI so a package linted on one machine is a hit everywhere.
- Root scripts: `"lint": "turbo run lint //#lint:root"` with `"lint:root": "eslint ."`.

## Caching

Rely on the Turborepo cache alone; leave `eslint --cache` off. ESLint caches results per file, but typed rules depend on types from other files, so a cached file can keep a stale result after a file it imports changes. typescript-eslint recommends against `--cache` for this reason. Turborepo hashes the whole package and its internal dependencies, which is the correct granularity for typed linting.

## TypeScript programs

Typed linting is never faster than type-checking, so keep each package's TypeScript work small:

- Give every package its own `tsconfig.json` with a narrow `include` (for example `["src", "*.config.ts"]`). A missing or `**/*` include also pulls in `dist`, `.next` and other build output.
- Include config files such as `eslint.config.ts` and `vite.config.ts` in a tsconfig. A file that no tsconfig includes produces a parsing error; listing it in `parserOptions.projectService.allowDefaultProject` creates an extra TypeScript program per file and is capped at 8 files.
- Keep `parserOptions.projectService` on; it reuses one TypeScript service per process and supports project references. Pointing `parserOptions.project` at tsconfig globs is slower.

## Parallelism

Turborepo already runs one ESLint process per package across all cores. Leave ESLint's `--concurrency` at its default `off`: every worker thread builds its own TypeScript program, so typed linting usually gets slower and uses more memory. Measure before enabling it for a single very large package.

## When linting is slow

1. Compare with `tsc --noEmit` in the same package. Lint time close to type-check time is expected; then speed up the types, not the lint config (see the TypeScript wiki's Performance page, `tsc --generateTrace`).
2. Find slow rules with `TIMING=all eslint .`. The first type-aware rule always looks slowest because it pays for building the program; disable rules one at a time to compare.
3. Check which tsconfig each file uses with `DEBUG=typescript-eslint:typescript-estree:* eslint <file>`.
4. Large packages: `NODE_OPTIONS=--max-semi-space-size=256` can speed up garbage collection; raise `--max-old-space-size` only after out-of-memory errors that type simplification does not fix.
5. Formatting stays out of ESLint: run the formatter's check mode (`oxfmt --check`, `prettier --check`) as its own task.

## Editor

In VS Code, set `"eslint.workingDirectories": [{ "mode": "auto" }]` so the extension runs ESLint from each package's directory and finds its `eslint.config.ts`.
