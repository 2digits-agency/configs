import { defineConfig } from 'oxlint';

export const jsdocConfig = defineConfig({
  plugins: ['jsdoc'],
  rules: {
    'jsdoc/check-access': 'error',
    'jsdoc/check-property-names': 'error',
    'jsdoc/check-tag-names': [
      'error',
      {
        typed: true,
        definedTags: [
          'effect-codegens',
          'effect-diagnostics',
          'effect-diagnostics-next-line',
          'effect-expect-leaking',
          'effect-identifier',
          'effect-leakable-service',
          'effect-schema-codegenerated',
        ],
      },
    ],
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
