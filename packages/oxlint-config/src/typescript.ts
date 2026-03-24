import { defineConfig } from 'oxlint';

export const typescriptConfig = defineConfig({
  plugins: ['typescript'],
  rules: {
    'typescript/array-type': ['error', { default: 'generic' }],
    'typescript/consistent-type-exports': 'error',
    'typescript/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    'typescript/no-explicit-any': 'error',
    'typescript/no-import-type-side-effects': 'error',
    'typescript/no-non-null-assertion': 'error',
  },
});
