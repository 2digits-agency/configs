import { renamePluginsInConfigs } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import { GLOB_SRC } from '../globs';
import type { OptionsTypeScriptWithTypes, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function typescript(options: OptionsTypeScriptWithTypes = {}): Promise<Array<TypedFlatConfigItem>> {
  const { overrides = {}, parserOptions = {} } = options;

  const [{ plugin, configs, parser }, twoDigits] = await Promise.all([
    interopDefault(import('typescript-eslint')),
    interopDefault(import('@2digits/eslint-plugin')),
  ]);

  const strictConfig = renamePluginsInConfigs(configs.strictTypeChecked as never, PluginNameMap);

  const rules = Object.fromEntries(strictConfig.flatMap(({ rules }) => Object.entries(rules ?? {})));

  return [
    {
      name: '2digits:typescript/setup',
      plugins: {
        ts: plugin,
        '@2digits': twoDigits,
      },
    },
    {
      name: '2digits:typescript/rules',
      files: [GLOB_SRC],
      languageOptions: {
        parser,
        parserOptions: {
          tsconfigRootDir: process.cwd(),
          projectService: true,
          warnOnUnsupportedTypeScriptVersion: false,
          ...parserOptions,
        },
        sourceType: 'module',
      },
      rules: {
        ...rules,
        'ts/array-type': ['error', { default: 'generic', readonly: 'generic' }],
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
        'ts/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends', allowObjectTypes: 'never' }],
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

        ...twoDigits.configs.recommended.rules,

        ...overrides,
      },
    },
    {
      name: '2digits:typescript/disables/dts',
      files: ['**/*.d.ts'],
      rules: {
        'unicorn/no-abusive-eslint-disable': 'off',
        'no-duplicate-imports': 'off',
        'no-restricted-syntax': 'off',
        'ts/no-unused-vars': 'off',
      },
    },
    {
      name: '2digits:typescript/disables/test',
      files: ['**/*.{test,spec}.ts?(x)'],
      rules: {
        'no-unused-expressions': 'off',
      },
    },
    {
      name: '2digits:typescript/disables/cjs',
      files: ['**/*.js', '**/*.cjs', '**/*.cts'],
      rules: {
        'ts/no-require-imports': 'off',
        'ts/no-var-requires': 'off',
      },
    },
  ];
}
