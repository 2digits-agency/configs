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

        'unicorn/consistent-boolean-name': 'off',
        'unicorn/consistent-conditional-object-spread': 'off',
        'unicorn/filename-case': 'off',
        'unicorn/max-nested-calls': 'off',
        'unicorn/name-replacements': 'off',
        'unicorn/no-array-callback-reference': 'off',
        'unicorn/no-break-in-nested-loop': 'off',
        'unicorn/no-computed-property-existence-check': 'off',
        'unicorn/no-declarations-before-early-exit': 'off',
        'unicorn/no-nested-ternary': 'off',
        'unicorn/no-non-function-verb-prefix': 'off',
        'unicorn/no-useless-undefined': ['error', { checkArguments: false, checkArrowFunctionBody: false }],
        'unicorn/prefer-await': 'off',
        'unicorn/prefer-module': 'off',
        'unicorn/prefer-number-coercion': 'off',
        'unicorn/prefer-ternary': ['error', 'only-single-line'],
        'unicorn/prefer-top-level-await': 'off',
        'unicorn/prevent-abbreviations': 'off',
        'unicorn/require-array-sort-compare': 'off',
      },
    },
  ];
}
