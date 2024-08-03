import { renamePluginsInConfigs } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import { GLOB_SRC } from '../globs';
import type { OptionsTypeScriptWithTypes, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function typescript(
  options: OptionsTypeScriptWithTypes = {},
): Promise<TypedFlatConfigItem[]> {
  const { overrides = {}, parserOptions = {}, tsconfigPath = true } = options;

  const [{ plugin, configs, parser }, twoDigits] = await Promise.all([
    interopDefault(import('typescript-eslint')),
    interopDefault(import('@2digits/eslint-plugin')),
  ]);

  const strictConfig = renamePluginsInConfigs(configs.strictTypeChecked as never, PluginNameMap);

  const rules = Object.fromEntries(
    strictConfig.flatMap(({ rules }) => Object.entries(rules ?? {})),
  );

  return [
    {
      name: '2digits:typescript/setup',
      plugins: {
        ts: plugin,
        '@2digits': twoDigits,
      },
      languageOptions: {
        parser,
        parserOptions: {
          sourceType: 'module',
          tsconfigRootDir: process.cwd(),
          project: tsconfigPath,
          ...parserOptions,
        },
      },
    },

    {
      name: '2digits:typescript/rules',
      files: [GLOB_SRC],
      rules: {
        ...rules,
        'ts/restrict-template-expressions': ['error', { allowNumber: true }],
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
        'ts/no-explicit-any': ['error'],
        'ts/no-import-type-side-effects': ['error'],
        'ts/no-misused-promises': 'off',
        'ts/no-confusing-void-expression': 'off',
        'ts/no-unused-vars': [
          'error',
          {
            ignoreRestSiblings: true,
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
        'ts/unbound-method': 'off',

        ...(twoDigits.configs.recommended.rules as object),

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
      files: ['**/*.js', '**/*.cjs', '**/*.cts'],
      name: '2digits:typescript/disables/cjs',
      rules: {
        'ts/no-require-imports': 'off',
        'ts/no-var-requires': 'off',
      },
    },
  ];
}
