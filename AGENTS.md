<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Agent Guidelines for @2digits/configs

## Commands

- **Build**: `pnpm build` | **Test**: `pnpm test` | **Single test**: `vitest run path/to/test.ts`
- **Full check**: `pnpm check` (test + lint + types + format + knip)
- **Fix**: `pnpm lint:fix` and `pnpm format:fix`

## Code Style

- **Arrays**: `Array<T>` not `T[]`
- **Type imports**: inline `import { type Foo }`, consistent exports
- **Type params**: `T` alone OK, else prefix with `T`/`$` + PascalCase (`TInput`, `$Result`)
- **Unused vars**: prefix with `_`
- **Top-level functions**: declarations not arrows (`export function foo()` not `export const foo = () =>`)
- **useState**: `[value, setValue]` naming enforced
- **Formatting**: printWidth 120, singleQuote, trailingComma 'all', bracketSameLine
- **Import order** (auto-sorted by Prettier): builtins → react → next → expo → third-party → @2digits → @/ → relative

<!-- opensrc:start -->

## Source Code Reference

Source code for dependencies is available in `opensrc/` for deeper understanding of implementation details.

See `opensrc/sources.json` for the list of available packages and their versions.

Use this source code when you need to understand how a package works internally, not just its types/interface.

### Fetching Additional Source Code

To fetch source code for a package or repository you need to understand, run:

```bash
npx opensrc <package>           # npm package (e.g., npx opensrc zod)
npx opensrc pypi:<package>      # Python package (e.g., npx opensrc pypi:requests)
npx opensrc crates:<package>    # Rust crate (e.g., npx opensrc crates:serde)
npx opensrc <owner>/<repo>      # GitHub repo (e.g., npx opensrc vercel/ai)
```

<!-- opensrc:end -->
