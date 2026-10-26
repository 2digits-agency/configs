---
name: prettier
description: Formatting rules and fixes for repositories formatted with @2digits/prettier-config. Use before committing or pushing changes, and when the Prettier `format` check fails locally or in CI.
---

# Prettier with `@2digits/prettier-config`

The project sets `"prettier": "@2digits/prettier-config"` in `package.json`, and CI runs its `format` script, usually
`prettier . --ignore-unknown --check --cache`. That check covers every file type Prettier knows: TypeScript,
JavaScript, JSON, YAML, Markdown and XML. A failure looks like this:

```text
[warn] apps/web/src/app/layout.tsx
[warn] Code style issues found in the above file. Run Prettier with --write to fix.
```

## Format as the last step before every commit

Most CI format failures come from a format step that was skipped, was killed, or ran before the last edit. Write the
files you changed (committed, uncommitted and untracked), then commit. Replace `origin/main` with the pull request's
base branch:

```sh
{ git diff --name-only --diff-filter=d "$(git merge-base origin/main HEAD)"; git ls-files --others --exclude-standard; } \
  | xargs -r pnpm exec prettier --write --ignore-unknown
```

`pnpm format:fix` writes the whole repository instead. Then `pnpm format` must pass.

- Run Prettier as `pnpm exec prettier` or through the package scripts. `npx prettier`, a global Prettier and an editor's
  bundled Prettier lack this config's plugins and produce different output.
- Formatting is checked per commit. In a stack or a series of split commits, a later commit that happens to fix the
  formatting leaves the lower pull request red. Check a file as it is in a given commit with
  `git show <rev>:<path> | pnpm exec prettier --check --stdin-filepath <path>`, and amend the fix into the commit that
  introduced it.
- When subagents or other agents are editing in parallel, run `format:fix` once after they finish, so it doesn't
  rewrite files they are still changing.

## What the config enforces

Reproduce these by running Prettier, not by hand. Each rule below is a diff that agents have shipped and CI rejected.

- **`printWidth: 120`** works in both directions. Prettier joins calls, parameters and expressions that fit in 120
  columns, including a call whose callback you split by hand: `it('name', () => {` goes back on one line. Object
  literals are the exception: a line break after `{` keeps them expanded. Anything longer than 120 columns is split,
  such as a `return { ... }` or a destructuring.
- **`singleQuote`, `trailingComma: 'all'`, semicolons, `bracketSameLine`**: the `>` of a multi-line JSX tag stays on
  the last attribute's line. Watch for stray spaces too, such as `import {  a }`.
- **`experimentalOperatorPosition: 'start'`**: wrapped binary and logical expressions put the operator at the start of
  each line:

  ```diff
   const ready =
  -  someLongConditionNameHere &&
  -  anotherVeryLongConditionNameHere &&
  -  moreConditionsHere123;
  +  someLongConditionNameHere
  +  && anotherVeryLongConditionNameHere
  +  && moreConditionsHere123;
  ```

- **Import order** (`@ianvs/prettier-plugin-sort-imports`) sorts alphabetically within groups and puts a blank line
  between groups, in this order:
  1. Node builtins (`node:fs` and `fs`)
  2. `react`, `react-native`
  3. `next`
  4. `expo`, `expo-*`, `@expo/*`
  5. Other packages
  6. `@2digits/*`, `@mod/*`
  7. `@/` and `@Capitalized/*` path aliases
  8. `*.json`
  9. Relative imports

  `import type` lines sort with their group.

- **Tailwind classes** (`prettier-plugin-tailwindcss`) are sorted in `className` and inside `tv`, `cn`, `cnBase`,
  `classnames`, `clsx` and `cx` calls. Write classes in any order and let Prettier sort them.
- **Markdown** gets a blank line around headings, lists, code blocks and HTML comments, and `-` list markers. Managed
  blocks in `AGENTS.md`, such as `<!-- tool:start -->` … `<!-- tool:end -->`, need a blank line just inside each marker.
  Changelog entries such as `.tegami/*.md` and docs are checked too.
- **`pnpm-lock.yaml`** is only formatted when it has a `@format` pragma, so it is effectively skipped.

## `prettier .` fails on files you didn't change

- **`[error] Unable to read file ... ENOENT`**: the check found a short-lived file, such as Turbo's
  `.turbo-restore-*` or a test's temporary directory, which was deleted before Prettier read it. Add a narrow glob to
  `.prettierignore`, for example `.turbo-restore-*`. For a test's temporary directory, give it a fixed prefix such as
  `.prettier-tmp-` and ignore that prefix. Leave the formatting check itself in place.
- **Generated files**: Prettier 3 already skips everything in `.gitignore`, so a gitignored generated file needs no
  `.prettierignore` entry. Format a committed generated file after generation with `pnpm exec prettier --write <file>`,
  or ignore it if it is regenerated on every build.
- **`No parser could be inferred`**: Prettier received an explicit path it has no parser for, such as `.gitignore`. Add
  `--ignore-unknown`.

Check an ignore rule with `pnpm exec prettier --file-info <path>`. It should print `"ignored": true` for the temporary or
generated file and `"ignored": false` for a real source file next to it.
