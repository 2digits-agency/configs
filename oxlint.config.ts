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
);
