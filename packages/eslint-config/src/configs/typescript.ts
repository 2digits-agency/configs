import type { ParserOptions } from '@typescript-eslint/parser';
import { renamePluginsInConfigs } from 'eslint-flat-config-utils';

import { GLOB_SRC } from '../globs';
import type { OptionsTypeScriptWithTypes, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function typescript(
  options: OptionsTypeScriptWithTypes = {},
): Promise<TypedFlatConfigItem[]> {
  const { overrides = {}, parserOptions = {}, tsconfigPath } = options;

  const { plugin, configs, parser } = await interopDefault(import('typescript-eslint'));

  const strictConfig = renamePluginsInConfigs(configs.strictTypeChecked as never, {
    '@typescript-eslint': 'ts',
  });

  const rules = Object.fromEntries(
    strictConfig.flatMap(({ rules }) => Object.entries(rules ?? {})),
  );

  return [
    {
      name: '2digits:typescript/setup',
      plugins: {
        ts: plugin,
      },
      languageOptions: {
        parser: parser as never,
        parserOptions: {
          sourceType: 'module',
          tsconfigRootDir: process.cwd(),
          project: tsconfigPath,
          ...(parserOptions as object),
        } satisfies ParserOptions,
      },
    },

    {
      name: '2digits:typescript/rules',
      files: [GLOB_SRC],
      rules: {
        ...rules,
        'ts/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
        'ts/consistent-type-exports': ['error'],
        'ts/consistent-type-imports': [
          'error',
          {
            prefer: 'type-imports',
            disallowTypeAnnotations: false,
            fixStyle: 'inline-type-imports',
          },
        ],
        'ts/no-empty-interface': ['error', { allowSingleExtends: true }],
        'ts/no-explicit-any': ['warn'],
        'ts/no-import-type-side-effects': ['error'],
        'ts/no-misused-promises': 'off',
        'ts/no-confusing-void-expression': [
          'error',
          { ignoreArrowShorthand: true, ignoreVoidOperator: true },
        ],

        ...overrides,
      },
    },
    {
      files: ['**/*.d.ts'],
      name: '2digits:typescript/disables/dts',
      rules: {
        'unicorn/no-abusive-eslint-disable': 'off',
        'no-duplicate-imports': 'off',
        'no-restricted-syntax': 'off',
        'ts/no-unused-vars': 'off',
      },
    },
    {
      files: ['**/*.{test,spec}.ts?(x)'],
      name: '2digits:typescript/disables/test',
      rules: {
        'no-unused-expressions': 'off',
      },
    },
    {
      files: ['**/*.js', '**/*.cjs'],
      name: '2digits:typescript/disables/cjs',
      rules: {
        'ts/no-require-imports': 'off',
        'ts/no-var-requires': 'off',
      },
    },
  ];
}
