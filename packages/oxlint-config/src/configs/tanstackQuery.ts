import type { FlatConfigItem } from 'oxlint-flat-config';

import type { OptionsOverrides } from '../types';

export function tanstackQuery(options: OptionsOverrides = {}): Array<FlatConfigItem> {
  const { overrides = {} } = options;

  return [
    {
      name: '2digits:tanstack-query',
      jsPlugins: [
        {
          name: 'tanstack-query',
          specifier: import.meta.resolve('@tanstack/eslint-plugin-query'),
        },
      ],
      rules: {
        'tanstack-query/exhaustive-deps': 'error',
        'tanstack-query/infinite-query-property-order': 'error',
        'tanstack-query/mutation-property-order': 'error',
        'tanstack-query/no-rest-destructuring': 'warn',
        'tanstack-query/no-unstable-deps': 'error',
        'tanstack-query/no-void-query-fn': 'error',
        'tanstack-query/prefer-query-options': 'error',
        'tanstack-query/stable-query-client': 'error',

        ...overrides,
      },
    },
  ];
}
