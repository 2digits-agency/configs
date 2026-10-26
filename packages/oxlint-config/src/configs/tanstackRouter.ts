import type { FlatConfigItem } from 'oxlint-flat-config';

import type { OptionsOverrides } from '../types';

export function tanstackRouter(options: OptionsOverrides = {}): Array<FlatConfigItem> {
  const { overrides = {} } = options;

  return [
    {
      name: '2digits:tanstack-router',
      jsPlugins: [
        {
          name: 'tanstack-router',
          specifier: import.meta.resolve('@tanstack/eslint-plugin-router'),
        },
      ],
      rules: {
        'tanstack-router/create-route-property-order': 'warn',
        'tanstack-router/route-param-names': 'error',

        'typescript/only-throw-error': [
          'error',
          {
            allow: [
              {
                from: 'package',
                package: '@tanstack/router-core',
                name: 'Redirect',
              },
            ],
          },
        ],

        ...overrides,
      },
    },
  ];
}
