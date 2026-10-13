---
packages:
  'npm:@2digits/eslint-config': minor
---

## Support Tailwind CSS v4 in the Tailwind config

- Updated `eslint-plugin-tailwindcss` to 4.4.0, which requires Tailwind CSS v4
- Added a `cssConfigPath` option for the Tailwind v4 CSS entrypoint
- Without `cssConfigPath`, a `tailwind.config.ts` (preferred) or `tailwind.config.js` is discovered and loaded through `@config`; the config is not enabled when none is found
- Added `tailwindcss/enforces-canonical-classname` and `tailwindcss/important-modifier-suffix`, and removed `tailwindcss/migration-from-tailwind-2`
