import { twoDigits } from '@2digits/oxlint-config';

export default twoDigits(
  {
    ignores: {
      ignores: ['packages/**/_fixtures/**', 'packages/eslint-config/src/types.gen.d.ts'],
    },
    react: true,
    ts: true,
    vitest: true,
    zod: true,
  },
  {
    options: {
      reportUnusedDisableDirectives: 'allow',
    },
  },
  {
    // ESTree's `kind` is a plain node field (`const`, `init`), not a union to Match on.
    files: ['packages/oxlint-plugin/src/**'],
    rules: { '2digits/no-manual-tag-comparison': ['error', { discriminants: ['status'] }] },
  },
);
