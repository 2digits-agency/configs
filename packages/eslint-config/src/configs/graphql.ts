import type { OptionsWithFiles, TypedFlatConfigItem } from '../types';
import { interopDefault, renameRules } from '../utils';

export async function graphql(options: OptionsWithFiles = {}): Promise<Array<TypedFlatConfigItem>> {
  const { overrides = {}, files = ['**/*.graphql', '**/*.gql'] } = options;

  const [gql, gqlSchema] = await Promise.all([
    interopDefault(import('@graphql-eslint/eslint-plugin')),
    import('graphql-config').then(({ loadConfig }) =>
      loadConfig({ throwOnEmpty: false, throwOnMissing: false }).then((g) => g?.getDefault().schema),
    ),
  ]);

  const { rules: operationsRecommended } = gql.configs['flat/operations-recommended'];

  /**
   * Without a schema, rules that need the schema or sibling operations cannot run.
   */
  const recommended = renameRules(
    gqlSchema
      ? operationsRecommended
      : Object.fromEntries(
          Object.entries(operationsRecommended).filter(([rule]) => {
            const docs = (gql.rules as Partial<typeof gql.rules>)[
              rule.replace('@graphql-eslint/', '') as keyof typeof gql.rules
            ]?.meta.docs;

            return !docs?.requiresSchema && !docs?.requiresSiblings;
          }),
        ),
  );

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
