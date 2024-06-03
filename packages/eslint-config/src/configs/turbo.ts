import type { OptionsOverrides, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function turbo(options: OptionsOverrides = {}): Promise<TypedFlatConfigItem[]> {
  const { overrides = {} } = options;

  const turbo = await interopDefault(import('eslint-plugin-turbo'));

  return [
    {
      name: '2digits:turbo',
      plugins: {
        turbo,
      },
      rules: {
        'turbo/no-undeclared-env-vars': 'error',

        ...overrides,
      },
    },
  ];
}
