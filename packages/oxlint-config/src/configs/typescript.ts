import { defineTypedConfig } from '../types';

export const typescriptRulesConfig = defineTypedConfig({
  plugins: ['typescript'],
  rules: {
    'typescript/array-type': ['error', { default: 'generic', readonly: 'generic' }],
    'typescript/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
    'typescript/consistent-generic-constructors': 'error',
    'typescript/consistent-type-definitions': 'error',
    'typescript/consistent-type-exports': 'error',
    'typescript/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    'typescript/no-array-delete': 'error',
    'typescript/no-duplicate-enum-values': 'error',
    'typescript/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends', allowObjectTypes: 'never' }],
    'typescript/no-explicit-any': 'error',
    'typescript/no-import-type-side-effects': 'error',
    'typescript/no-misused-new': 'error',
    'typescript/no-non-null-assertion': 'error',
    'typescript/no-require-imports': 'error',
    'typescript/no-var-requires': 'error',
    'typescript/no-wrapper-object-types': 'error',
    'typescript/prefer-as-const': 'error',
    'typescript/prefer-namespace-keyword': 'error',
  },
});
