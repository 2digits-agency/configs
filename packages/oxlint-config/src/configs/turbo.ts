import type { FlatConfigItem } from 'oxlint-flat-config';

import type { OptionsOverrides } from '../types';

export function turbo(options: OptionsOverrides = {}): Array<FlatConfigItem> {
  const { overrides = {} } = options;

  return [
    {
      name: '2digits:turbo',
      jsPlugins: [
        {
          name: 'turbo',
          specifier: import.meta.resolve('eslint-plugin-turbo'),
        },
      ],
      rules: {
        'turbo/no-undeclared-env-vars': 'error',

        ...overrides,
      },
    },
  ];
}
