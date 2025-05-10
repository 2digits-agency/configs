import type { TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function prettier(): Promise<Array<TypedFlatConfigItem>> {
  const [prettier, stylistic] = await Promise.all([
    interopDefault(import('eslint-config-prettier')),
    interopDefault(import('@stylistic/eslint-plugin')),
  ]);

  return [
    {
      name: '2digits:prettier',
      plugins: {
        stylistic,
      },
      rules: {
        ...prettier.rules,

        'tailwindcss/classnames-order': 'off',
        'stylistic/jsx-newline': ['error', { prevent: false }],
      },
    },
  ];
}
