import { defineConfig } from '../utils';

export const unicorn = defineConfig({
  extends: ['plugin:unicorn/recommended'],
  rules: {
    'unicorn/filename-case': ['off'],
    'unicorn/prefer-module': ['off'],
    'unicorn/prevent-abbreviations': ['off'],
    'unicorn/prefer-ternary': ['error', 'only-single-line'],
    'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
    'unicorn/prefer-top-level-await': ['off'],
  },
});
