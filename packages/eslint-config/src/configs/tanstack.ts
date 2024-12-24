import { renamePluginsInRules } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import type { OptionsOverrides, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function tanstack(options: OptionsOverrides = {}): Promise<TypedFlatConfigItem[]> {
  const { overrides = {} } = options;

  const tanstack = await interopDefault(import('@tanstack/eslint-plugin-query'));

  const recommended = renamePluginsInRules(
    tanstack.configs['flat/recommended'].at(0)?.rules ?? {},
    PluginNameMap,
  );

  return [
    {
      name: '2digits:tanstack',
      plugins: { tanstack },
      rules: {
        ...recommended,

        ...overrides,
      },
    },
  ];
}
