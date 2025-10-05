import { renamePluginsInRules } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import { GLOB_SRC } from '../globs';
import type { OptionsOverrides, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function tanstackRouter(options: OptionsOverrides = {}): Promise<Array<TypedFlatConfigItem>> {
  const { overrides = {} } = options;

  const tsRouter = await interopDefault(import('@tanstack/eslint-plugin-router'));

  const recommended = renamePluginsInRules(tsRouter.configs['flat/recommended'].at(0)?.rules ?? {}, PluginNameMap);

  return [
    {
      files: [GLOB_SRC],
      name: '2digits:tanstack-router',
      plugins: { 'tanstack-router': tsRouter },
      rules: {
        ...recommended,

        'ts/only-throw-error': [
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
