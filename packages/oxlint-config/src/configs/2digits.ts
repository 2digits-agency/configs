import { defineConfig } from 'oxlint';

import { recommendedRules } from '@2digits/oxlint-plugin';

/**
 * Shared plugin defaults, including statement spacing with grouped imports.
 */
export const twoDigitsPluginConfig = defineConfig({
  jsPlugins: [
    {
      name: '2digits',
      specifier: import.meta.resolve('@2digits/oxlint-plugin'),
    },
  ],
  rules: {
    ...recommendedRules,
    '2digits/padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: '*' },
      { blankLine: 'any', prev: 'import', next: 'import' },
    ],
  },
});
