import { defineConfig, type RuleMap } from '@oxlint-types/define-config';

export const jsdocConfig = defineConfig({
  plugins: ['jsdoc'],
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
    'jsdoc/require-param-description': undefined,
    'jsdoc/require-param-type': undefined,
    'jsdoc/require-property-type': undefined,
    'jsdoc/require-returns': undefined,
    'jsdoc/require-returns-type': undefined,
    'jsdoc/require-throws-description': undefined,
    'jsdoc/require-throws-type': undefined,
    'jsdoc/require-yields-description': undefined,
    'jsdoc/require-yields-type': undefined,
  } satisfies {
    [k in Extract<keyof RuleMap, `jsdoc/${string}`>]: RuleMap[k];
  },
});
