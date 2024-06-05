import type { TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function prettier(): Promise<TypedFlatConfigItem[]> {
  const prettier = await interopDefault(import('eslint-config-prettier'));

  return [
    {
      name: '2digits:prettier',
      rules: {
        ...prettier.rules,

        'tailwindcss/classnames-order': 'off',
      },
    },
  ];
}
