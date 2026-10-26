import type { FlatConfigItem } from 'oxlint-flat-config';

import type { OptionsWithDrizzle } from '../types';

export function drizzle(options: OptionsWithDrizzle = {}): Array<FlatConfigItem> {
  const { overrides = {}, drizzleObjectName = ['drizzle', 'db'] } = options;

  return [
    {
      name: '2digits:drizzle',
      jsPlugins: [
        {
          name: 'drizzle',
          specifier: import.meta.resolve('eslint-plugin-drizzle'),
        },
      ],
      rules: {
        'drizzle/enforce-update-with-where': ['error', { drizzleObjectName }],
        'drizzle/enforce-delete-with-where': ['error', { drizzleObjectName }],

        ...overrides,
      },
    },
  ];
}
