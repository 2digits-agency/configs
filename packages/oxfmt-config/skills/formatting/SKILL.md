---
name: formatting
description: How @2digits/oxfmt-config formats code and how to fix oxfmt failures. Use when a format check (`oxfmt --check`, `format`, CI "format") fails, when oxfmt rewrites imports or files unexpectedly, when editing `oxfmt.config.ts` or ignore patterns, when editor format-on-save disagrees with oxfmt, or when upgrading oxfmt.
---

# @2digits/oxfmt-config

The project formats with [oxfmt](https://oxc.rs/docs/guide/usage/formatter) using this preset. The formatter is the source of truth: let it write the output instead of matching its style by hand.

## Fix a failing format check

1. Find the project's scripts in `package.json`. The usual pair is `format` (`oxfmt . --check`) and `format:fix` (`oxfmt .` or `oxfmt . --write`). In Vite+ projects `vp fmt` forwards to the same oxfmt.
2. Format only the files you changed: `oxfmt path/to/a.ts path/to/b.tsx`. Running `oxfmt .` also rewrites files other people or agents are editing; use it only when the whole repo is yours to touch.
3. Rerun the check. Done when it prints `All matched files use the correct format.`

Messages that are not formatting problems:

- `Unterminated …`, `Unexpected token`, `Expected a semicolon`: the file does not parse. Fix the code (often a broken codemod or bad edit), then format.
- `Expected at least one target file. All matched files may have been excluded by ignore rules.`: every path you passed is ignored. Nothing to fix.

## Rewrites that surprise agents

These are deliberate preset settings. Accept them; do not revert them by hand.

- **Imports are sorted and grouped**, with one blank line between groups, in this order: Node builtins → `react` → `react-native` → `next` → `expo` → other packages → `@2digits/**` and `@mod/**` → `@/**` → other `@Scope` aliases → `*.json` → relative (`../`, `./`). Type imports sort with their group.
  - Sorting is case-sensitive ascending, so `./Worker.ts` sorts before `./resources.ts`.
  - A comment line between imports splits sorting: imports above and below it are sorted separately. Use this when order matters.
  - Side-effect imports (`import './style.css'`) keep their position and are not sorted.
- **Long union types** break to one member per line with a leading `|`.
- **Operators** (`&&`, `||`, `??`, `+`) go at the end of a broken line, not the start.
- **JSDoc** is normalised: single-line `/** … */` blocks expand to multi-line (including `/** @effect-diagnostics … */` directives), descriptions are capitalised and end with a period, and a blank line separates `@returns` from `@param`.
- **package.json** keys and `scripts` are sorted. If `.pnpmfile.mjs` or `.pnpmfile.cjs` is reformatted, its checksum in `pnpm-lock.yaml` changes: run `pnpm install --lockfile-only` and commit the lockfile with the formatting change.
- **Tailwind classes** are sorted in `className` and in calls to `tv`, `cn`, `cnBase`, `classnames`, `clsx` and `cx`.
- **Quotes**: single quotes in JS/TS, double quotes in JSX attributes. Print width is 120, trailing commas everywhere, `>` of multi-line JSX stays on the last attribute line.

## Configure oxfmt.config.ts

```ts
import fmt from '@2digits/oxfmt-config';

export default fmt({
  ignorePatterns: ['src/generated/**'],
});
```

- Options you pass override the preset. `ignorePatterns` is merged: yours are added to the preset's defaults (`node_modules`, `dist`, lockfiles, `coverage`, `.next`, `CHANGELOG*.md`, `__snapshots__`, `fixtures`, `.agents/skills` and similar), so list only the extras.
- Ignore generated output (codegen, ORM migrations, `payload-types.ts`, `.tegami/*.md`) or format it right after generating; either way the check passes. Keep each pattern as narrow as the generated files: ignoring a whole folder such as `.amp/**` also stops checking hand-written files in it.
- Only `.agents/skills` is ignored by default; `.claude`, `.amp` and `.opencode` are checked. When `.claude/skills/<name>` is a copy of `.agents/skills/<name>`, replace it with a symlink (`ln -s ../../.agents/skills/<name> .claude/skills/<name>`) instead of formatting or ignoring the copy.

## Keep oxfmt and the preset in step

The preset pins an exact `oxfmt` peer version, because oxfmt output changes between releases. Install the version it asks for (`pnpm view @2digits/oxfmt-config peerDependencies`), and upgrade `oxfmt` and `@2digits/oxfmt-config` together.

## Make the editor format like oxfmt

When format-on-save produces double quotes or different wrapping, the editor is still using Prettier. Point the workspace at the Oxc extension in `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true
}
```

and add `"oxc.oxc-vscode"` to `recommendations` in `.vscode/extensions.json`.

## Migrate from Prettier

Skip `oxfmt --migrate prettier`: it drops the import-sort, Tailwind and JSDoc plugins. Instead create the `oxfmt.config.ts` above, move `.prettierignore` entries into `ignorePatterns`, remove the `prettier` field from `package.json`, the Prettier config and `@2digits/prettier-config`, and point the `format` scripts at `oxfmt`. Then run `oxfmt .` once and commit that reformat on its own.
