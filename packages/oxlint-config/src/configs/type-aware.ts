import { defineTypedConfig } from '../types';

export const typeAwareConfig = defineTypedConfig({
  options: {
    typeAware: true,
  },
  rules: {
    'typescript/await-thenable': 'error',
    'typescript/consistent-type-exports': 'error',
    'typescript/no-array-delete': 'error',
    'typescript/no-base-to-string': 'error',
    'typescript/no-deprecated': 'error',
    'typescript/no-duplicate-type-constituents': 'error',
    'typescript/no-floating-promises': 'error',
    'typescript/no-for-in-array': 'error',
    'typescript/no-implied-eval': 'error',
    'typescript/no-meaningless-void-operator': 'error',
    'typescript/no-misused-spread': 'error',
    'typescript/no-redundant-type-constituents': 'error',
    'typescript/no-unnecessary-condition': ['error', { allowConstantLoopConditions: 'only-allowed-literals' }],
    'typescript/no-unsafe-unary-minus': 'error',
    'typescript/require-array-sort-compare': 'error',
    'typescript/restrict-template-expressions': ['error', { allowNumber: true }],
    'typescript/unbound-method': 'error',
    'typescript/dot-notation': ['error', { allowKeywords: true }],
  },
});
