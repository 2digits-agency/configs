import { GLOB_SRC } from '../globs';
import type { TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function jsdoc(): Promise<TypedFlatConfigItem[]> {
  return [
    {
      files: [GLOB_SRC],
      name: '2digits:jsdoc',
      plugins: {
        jsdoc: await interopDefault(import('eslint-plugin-jsdoc')),
      },
      rules: {
        'jsdoc/check-access': 'error',
        'jsdoc/check-param-names': 'error',
        'jsdoc/check-property-names': 'error',
        'jsdoc/check-types': 'error',
        'jsdoc/empty-tags': 'error',
        'jsdoc/implements-on-classes': 'error',
        'jsdoc/no-defaults': 'error',
        'jsdoc/no-multi-asterisks': 'error',
        'jsdoc/require-param-name': 'error',
        'jsdoc/require-property': 'error',
        'jsdoc/require-property-description': 'error',
        'jsdoc/require-property-name': 'error',
        'jsdoc/require-returns-check': 'error',
        'jsdoc/require-returns-description': 'error',
        'jsdoc/require-yields-check': 'error',
      },
    },
  ];
}
