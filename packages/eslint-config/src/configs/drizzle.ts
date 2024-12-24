import { fixupPluginRules } from '@eslint/compat';

import type { OptionsWithDrizzle, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function drizzle(options: OptionsWithDrizzle = {}): Promise<TypedFlatConfigItem[]> {
  const { overrides = {}, drizzleObjectName = ['drizzle', 'db'] } = options;

  const drizzle = await interopDefault(import('eslint-plugin-drizzle'));

  return [
    {
      name: '2digits:drizzle',
      plugins: {
        drizzle: fixupPluginRules(drizzle as never),
      },
      rules: {
        'drizzle/enforce-update-with-where': ['error', { drizzleObjectName }],
        'drizzle/enforce-delete-with-where': ['error', { drizzleObjectName }],

        ...overrides,
      },
    },
  ];
}
