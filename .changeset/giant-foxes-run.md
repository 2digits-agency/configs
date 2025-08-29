---
'@2digits/eslint-config': minor
---

CSS parser now supports Tailwind v4 and auto-detects Tailwind major version.

- Default: Detect installed `tailwindcss` version and select `tailwind4` (v4+) or `tailwind3` (v3). Falls back to v3 if not found.
- Fix: Resolves CSS parsing errors (e.g., CSSTree "parse.prelude" / invalid regex flags) when linting Tailwind v4 files like `@import 'tailwindcss';`.
- New options: Override detection via `css` options passed to the factory:
  - `css: { tailwindMajor: 4 }` or `css: { tailwindMajor: 3 }` to force a version.
  - `css: { customSyntax }` to provide a custom CSS syntax parser.

Notes
- The previous config always used `tailwind3` grammar. This change makes v4 projects parse correctly without manual config.
