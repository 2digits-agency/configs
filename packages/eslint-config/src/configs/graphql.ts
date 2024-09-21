import { fixupPluginRules } from '@eslint/compat';
import { renamePluginsInRules } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import type { OptionsWithFiles, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function graphql(options: OptionsWithFiles = {}): Promise<TypedFlatConfigItem[]> {
  const { overrides = {}, files = ['**/*.graphql', '**/*.gql'] } = options;

  const gql = await interopDefault(import('@graphql-eslint/eslint-plugin'));

  const recommended = renamePluginsInRules(
    gql.flatConfigs['operations-recommended'].rules,
    PluginNameMap,
  );

  return [
    {
      name: '2digits:graphql',
      plugins: {
        gql: fixupPluginRules(gql as never),
      },
      languageOptions: {
        parser: { ...gql, meta: { name: 'graphql' } },
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
