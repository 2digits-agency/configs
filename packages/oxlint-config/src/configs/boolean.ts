import type { FlatConfigItem } from 'oxlint-flat-config';

/**
 * De Morgan's laws for negated boolean expressions, under the `boolean` name the ESLint config also uses.
 */
export function boolean(): Array<FlatConfigItem> {
  return [
    {
      name: '2digits:boolean',
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
    },
  ];
}
