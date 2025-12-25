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
        'zod/no-any-schema': 'error',
        'zod/no-empty-custom-schema': 'error',
        'zod/no-number-schema-with-int': 'error',
        'zod/no-optional-and-default-together': ['warn', { preferredMethod: 'default' }],
        'zod/no-throw-in-refine': 'error',
        'zod/prefer-meta': 'error',
        'zod/prefer-meta-last': 'error',
        'zod/prefer-namespace-import': 'error',
        'zod/require-brand-type-parameter': 'error',
        'zod/require-schema-suffix': ['warn', { suffix: 'Schema' }],
        'zod/schema-error-property-style': [
          'error',
          { selector: 'Literal,TemplateLiteral', example: `"This is an error message"` },
        ],

        ...overrides,
      },
    },
  ];
}
