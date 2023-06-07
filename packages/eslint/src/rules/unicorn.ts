import type { Rules } from 'eslint-define-config';

export const unicorn = {
  'unicorn/filename-case': ['off'],
  'unicorn/prefer-module': ['off'],
  'unicorn/prevent-abbreviations': ['off'],
  'unicorn/prefer-ternary': ['error', 'only-single-line'],
  'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
} satisfies Rules;
