import { defineConfig } from 'oxlint';

export const typescriptRulesConfig = defineConfig({
  plugins: ['typescript'],
  rules: {
    'typescript/array-type': ['error', { default: 'generic' }],
    'typescript/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
    'typescript/consistent-type-exports': 'error',
    'typescript/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    'typescript/no-array-delete': 'error',
    'typescript/no-duplicate-enum-values': 'error',
    'typescript/no-empty-object-type': 'error',
    'typescript/no-explicit-any': 'error',
    'typescript/no-import-type-side-effects': 'error',
    'typescript/no-misused-new': 'error',
    'typescript/no-non-null-assertion': 'error',
    'typescript/no-wrapper-object-types': 'error',
    'typescript/prefer-as-const': 'error',
    'typescript/prefer-namespace-keyword': 'error',
  },
});
