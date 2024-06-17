import type { TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function prettier(): Promise<TypedFlatConfigItem[]> {
  const [prettier, react] = await Promise.all([
    interopDefault(import('eslint-config-prettier')),
    interopDefault(import('eslint-plugin-react')),
  ]);

  return [
    {
      name: '2digits:prettier',
      plugins: {
        react,
      },
      rules: {
        ...prettier.rules,

        'tailwindcss/classnames-order': 'off',
        'react/jsx-newline': ['error', { prevent: false }],
      },
    },
  ];
}
