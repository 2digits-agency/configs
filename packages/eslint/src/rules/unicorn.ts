import type { Rules } from 'eslint-define-config';

export const unicorn = {
  'unicorn/filename-case': ['error', { cases: { camelCase: true, pascalCase: true } }],
  'unicorn/prefer-module': ['off'],
  'unicorn/prevent-abbreviations': ['off'],
  'unicorn/prefer-ternary': ['error', 'only-single-line'],
} satisfies Rules;
