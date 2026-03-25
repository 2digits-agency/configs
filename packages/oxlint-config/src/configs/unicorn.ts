import { defineTypedConfig } from '../types';

export const unicornConfig = defineTypedConfig({
  plugins: ['unicorn'],
  rules: {
    'unicorn/no-abusive-eslint-disable': 'error',
    'unicorn/error-message': 'error',
    'unicorn/no-empty-file': 'error',
    'unicorn/no-invalid-fetch-options': 'error',
    'unicorn/no-invalid-remove-event-listener': 'error',
    'unicorn/no-new-array': 'error',
    'unicorn/no-thenable': 'error',
    'unicorn/no-unnecessary-await': 'error',
    'unicorn/no-useless-fallback-in-spread': 'error',
    'unicorn/no-useless-length-check': 'error',
    'unicorn/no-useless-spread': 'error',
    'unicorn/prefer-node-protocol': 'error',
    'unicorn/prefer-ternary': ['error', 'only-single-line'],
    'unicorn/prefer-set-size': 'error',
    'unicorn/prefer-string-starts-ends-with': 'error',
    'unicorn/prefer-modern-dom-apis': 'error',
  },
});
