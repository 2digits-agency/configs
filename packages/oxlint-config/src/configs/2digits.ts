import type { FlatConfigItem } from 'oxlint-flat-config';

import { recommendedRules } from '@2digits/oxlint-plugin';

/**
 * Shared plugin defaults, including statement spacing with grouped imports.
 */
export function twoDigitsPlugin(): Array<FlatConfigItem> {
  return [
    {
      name: '2digits:plugin',
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
          { blankLine: 'any', prev: 'case', next: 'case' },
        ],
      },
    },
  ];
}
