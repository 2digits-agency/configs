import pluginUnicorn from 'eslint-plugin-unicorn';

import { GLOB_SRC } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function unicorn(): Array<TypedFlatConfigItem> {
  return [
    {
      files: [GLOB_SRC],
      name: '2digits:unicorn',
      plugins: {
        unicorn: pluginUnicorn,
      },
      rules: {
        ...pluginUnicorn.configs.recommended.rules,

        'unicorn/no-array-callback-reference': 'off',
        'unicorn/filename-case': 'off',
        'unicorn/prefer-module': 'off',
        'unicorn/prevent-abbreviations': 'off',
        'unicorn/prefer-ternary': ['error', 'only-single-line'],
        'unicorn/no-useless-undefined': ['error', { checkArguments: false, checkArrowFunctionBody: false }],
        'unicorn/prefer-top-level-await': 'off',
        'unicorn/no-nested-ternary': 'off',

        'unicorn/name-replacements': 'off',
        'unicorn/consistent-boolean-name': 'off',
        'unicorn/no-computed-property-existence-check': 'off',
        'unicorn/prefer-await': 'off',
        'unicorn/no-non-function-verb-prefix': 'off',
        'unicorn/consistent-conditional-object-spread': 'off',
        'unicorn/no-break-in-nested-loop': 'off',
        'unicorn/no-declarations-before-early-exit': 'off',
        'unicorn/require-array-sort-compare': 'off',
        'unicorn/prefer-direct-iteration': 'off',
        'unicorn/max-nested-calls': 'off',
        'unicorn/prefer-iterator-to-array': 'off',
        'unicorn/prefer-number-coercion': 'off',
      },
    },
  ];
}
