import { GLOB_SRC } from '../globs';
import type { OptionsOverrides, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function zod(options: OptionsOverrides = {}): Promise<Array<TypedFlatConfigItem>> {
  const { overrides = {} } = options;

  const zod = await interopDefault(import('eslint-plugin-zod'));

  return [
    {
      files: [GLOB_SRC],
      name: '2digits:zod',
      plugins: { zod },
      rules: {
        'zod/array-style': ['error', { style: 'function' }],
        'zod/consistent-import': ['error', { syntax: 'namespace' }],
        'zod/consistent-schema-output-type-style': ['error', { style: 'infer' }],
        'zod/consistent-schema-var-name': ['warn', { after: 'Schema' }],
        'zod/no-any-schema': 'error',
        'zod/no-empty-custom-schema': 'error',
        'zod/no-native-enum': 'error',
        'zod/no-number-schema-with-finite': 'error',
        'zod/no-number-schema-with-int': 'error',
        'zod/no-number-schema-with-is-finite': 'error',
        'zod/no-number-schema-with-is-int': 'error',
        'zod/no-number-schema-with-safe': 'error',
        'zod/no-number-schema-with-step': 'error',
        'zod/no-optional-and-default-together': ['warn', { preferredMethod: 'default' }],
        'zod/no-schema-with-is-nullable': 'error',
        'zod/no-schema-with-is-optional': 'error',
        'zod/no-throw-in-refine': 'error',
        'zod/no-transform-in-record-key': 'error',
        'zod/prefer-enum-over-literal-union': 'error',
        'zod/prefer-loose-object': 'error',
        'zod/prefer-meta': 'error',
        'zod/prefer-meta-last': 'error',
        'zod/prefer-strict-object': 'error',
        'zod/prefer-string-schema-with-trim': 'error',
        'zod/prefer-top-level-string-formats': 'error',
        'zod/prefer-trim-before-string-length-checks': 'error',
        'zod/require-brand-type-parameter': 'error',
        'zod/schema-error-property-style': [
          'error',
          { selector: 'Literal,TemplateLiteral', example: `"This is an error message"` },
        ],

        ...overrides,
      },
    },
  ];
}
