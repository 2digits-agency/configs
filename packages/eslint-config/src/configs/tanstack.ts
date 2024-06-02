import { fixupPluginRules } from '@eslint/compat';

import type { OptionsOverrides, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function tanstack(options: OptionsOverrides = {}): Promise<TypedFlatConfigItem[]> {
  const { overrides = {} } = options;

  const tanstack = await interopDefault(import('@tanstack/eslint-plugin-query'));

  return [
    {
      name: '2digits:tanstack',
      plugins: {
        tanstack: fixupPluginRules(tanstack as never),
      },
      rules: {
        'tanstack/exhaustive-deps': 'error',
        'tanstack/stable-query-client': 'error',
        'tanstack/no-rest-destructuring': 'error',

        ...overrides,
      },
    },
  ];
}
