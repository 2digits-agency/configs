import { GLOB_SRC } from '../globs';
import type { OptionsOverrides, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function zod(options: OptionsOverrides = {}): Promise<Array<TypedFlatConfigItem>> {
  const { overrides = {} } = options;

  const zod = await interopDefault(import('eslint-plugin-zod-x'));

  return [
    {
      files: [GLOB_SRC],
      name: '2digits:zod',
      plugins: { zod },
      rules: {
        'zod/array-style': ['error', { style: 'function' }],
        'zod/no-any': 'error',
        'zod/no-empty-custom-schema': 'error',
        'zod/no-throw-in-refine': 'error',
        'zod/prefer-meta': 'error',
        'zod/prefer-meta-last': 'error',
        'zod/prefer-namespace-import': 'error',
        'zod/require-schema-suffix': ['warn', { suffix: 'Schema' }],

        ...overrides,
      },
    },
  ];
}
