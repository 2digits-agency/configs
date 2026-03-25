import { defineTypedConfig } from '../types';

export const typeAwareConfig = defineTypedConfig({
  options: {
    typeAware: true,
  },
  rules: {
    'typescript/await-thenable': 'error',
    'typescript/no-base-to-string': 'error',
    'typescript/no-duplicate-type-constituents': 'error',
    'typescript/no-floating-promises': 'error',
    'typescript/no-for-in-array': 'error',
    'typescript/no-implied-eval': 'error',
    'typescript/no-meaningless-void-operator': 'error',
    'typescript/no-misused-spread': 'error',
    'typescript/no-non-null-asserted-optional-chain': 'error',
    'typescript/no-redundant-type-constituents': 'error',
    'typescript/no-this-alias': 'error',
    'typescript/no-unnecessary-parameter-property-assignment': 'error',
    'typescript/no-unsafe-declaration-merging': 'error',
    'typescript/no-unsafe-unary-minus': 'error',
    'typescript/no-useless-empty-export': 'error',
    'typescript/require-array-sort-compare': 'error',
    'typescript/restrict-template-expressions': ['error', { allowNumber: true }],
    'typescript/triple-slash-reference': 'error',
    'typescript/unbound-method': 'error',
  },
});
