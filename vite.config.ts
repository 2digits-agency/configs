import { defineConfig } from 'vite-plus';

import fmt from '@2digits/oxfmt-config';
import lint from '@2digits/oxlint-config';
import { effectConfig } from '@2digits/oxlint-config/effect';

export default defineConfig({
  fmt: fmt({
    ignorePatterns: ['packages/**/_fixtures/**', 'packages/eslint-config/src/types.gen.d.ts'],
  }),
  lint: lint(
    {
      options: {
        reportUnusedDisableDirectives: 'allow',
      },
      ignorePatterns: ['packages/**/_fixtures/**', 'packages/eslint-config/src/types.gen.d.ts'],
    },
    effectConfig,
  ),
  test: {
    projects: ['./packages/*/vite.config.ts'],
  },
});
