import { renamePluginsInRules } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import type { OptionsWithFiles, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function graphql(options: OptionsWithFiles = {}): Promise<TypedFlatConfigItem[]> {
  const { overrides = {}, files = ['**/*.graphql', '**/*.gql'] } = options;

  const [gql, gqlSchema] = await Promise.all([
    interopDefault(import('@graphql-eslint/eslint-plugin')),
    import('graphql-config').then(({ loadConfig }) =>
      loadConfig({ throwOnEmpty: false, throwOnMissing: false }).then((g) => g?.getDefault().schema),
    ),
  ]);

  const flatRecommended = gql.configs['flat/operations-recommended'].rules;

  let rules = {} as typeof flatRecommended;

  if (gqlSchema) {
    rules = flatRecommended;
  } else {
    for (const rule of Object.keys(flatRecommended) as Array<keyof typeof rules>) {
      const ruleName = rule.replace('@graphql-eslint/', '') as keyof typeof gql.rules;

      if (
        ruleName in gql.rules
        && (gql.rules[ruleName].meta.docs?.requiresSchema || gql.rules[ruleName].meta.docs?.requiresSiblings)
      ) {
        continue;
      }
      rules[rule] = flatRecommended[rule] as never;
    }
  }

  const recommended = renamePluginsInRules(rules, PluginNameMap);

  return [
    {
      name: '2digits:graphql',
      plugins: {
        gql,
      },
      languageOptions: {
        parser: gql.parser,
      },
      files,
      rules: {
        ...recommended,

        'gql/naming-convention': ['error', { allowLeadingUnderscore: true } as never],

        ...overrides,
      },
    },
  ];
}
