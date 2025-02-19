import { GLOB_SRC } from '../globs';
import { pluginUnicorn } from '../plugins';
import type { TypedFlatConfigItem } from '../types';

export function unicorn(): TypedFlatConfigItem[] {
  return [
    {
      files: [GLOB_SRC],
      name: '2digits:unicorn',
      plugins: {
        unicorn: pluginUnicorn,
      },
      rules: {
        ...pluginUnicorn.configs.recommended.rules,

        'unicorn/filename-case': ['off'],
        'unicorn/prefer-module': ['off'],
        'unicorn/prevent-abbreviations': ['off'],
        'unicorn/prefer-ternary': ['error', 'only-single-line'],
        'unicorn/no-useless-undefined': [
          'error',
          {
            checkArguments: false,
            checkArrowFunctionBody: false,
          },
        ],
        'unicorn/prefer-top-level-await': ['off'],
      },
    },
  ];
}
