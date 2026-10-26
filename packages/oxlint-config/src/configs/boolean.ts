import { defineConfig } from 'oxlint';

/**
 * De Morgan's laws for negated boolean expressions, under the `boolean` name the ESLint config also uses.
 */
export const booleanConfig = defineConfig({
  jsPlugins: [
    {
      name: 'boolean',
      specifier: import.meta.resolve('eslint-plugin-de-morgan'),
    },
  ],
  rules: {
    'boolean/no-negated-conjunction': 'error',
    'boolean/no-negated-disjunction': 'error',
  },
});
