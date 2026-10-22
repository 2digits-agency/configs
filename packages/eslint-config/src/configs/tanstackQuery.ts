import { GLOB_SRC } from '../globs';
import type { OptionsOverrides, TypedFlatConfigItem } from '../types';
import { interopDefault, mergeRules, renameRules } from '../utils';

export async function tanstackQuery(options: OptionsOverrides = {}): Promise<Array<TypedFlatConfigItem>> {
  const { overrides = {} } = options;

  const tanstack = await interopDefault(import('@tanstack/eslint-plugin-query'));

  const recommended = renameRules(mergeRules(tanstack.configs['flat/recommended']));

  return [
    {
      files: [GLOB_SRC],
      name: '2digits:tanstack-query',
      plugins: { 'tanstack-query': tanstack },
      rules: {
        ...recommended,

        'tanstack-query/prefer-query-options': 'error',

        ...overrides,
      },
    },
  ];
}
