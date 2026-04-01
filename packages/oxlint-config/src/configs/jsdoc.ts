import { defineTypedConfig } from '../types';

export const jsdocConfig = defineTypedConfig({
  plugins: ['jsdoc'],

  settings: {
    jsdoc: {},
  },

  rules: {
    'jsdoc/check-access': 'error',
    'jsdoc/check-property-names': 'error',
    'jsdoc/check-tag-names': ['error', { typed: true }],
    'jsdoc/empty-tags': 'error',
    'jsdoc/implements-on-classes': 'error',
    'jsdoc/no-defaults': 'error',
    'jsdoc/require-param': 'error',
    'jsdoc/require-param-name': 'error',
    'jsdoc/require-property': 'error',
    'jsdoc/require-property-description': 'error',
    'jsdoc/require-property-name': 'error',
    'jsdoc/require-returns-description': 'error',
    'jsdoc/require-yields': 'error',
  },
});
