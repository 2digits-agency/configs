import type { ESLint } from 'eslint';
import { renamePluginsInRules } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import { GLOB_TS, GLOB_TSX } from '../globs';
import type { OptionsTypeScriptWithTypes, OptionsWithReact, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function react(
  options: OptionsWithReact & OptionsTypeScriptWithTypes = {},
): Promise<Array<TypedFlatConfigItem>> {
  const { files = [GLOB_TS, GLOB_TSX], overrides = {}, parserOptions, tsconfigRootDir, reactCompiler = true } = options;

  const [pluginReact, pluginReactHooks, parser, pluginReactCompiler, stylistic] = await Promise.all([
    interopDefault(import('@eslint-react/eslint-plugin')),
    interopDefault(import('eslint-plugin-react-hooks')),
    interopDefault(import('@typescript-eslint/parser')),
    reactCompiler ? interopDefault(import('eslint-plugin-react-compiler')) : Promise.resolve(undefined),
    interopDefault(import('@stylistic/eslint-plugin')),
  ]);

  const plugins = (pluginReact.configs.all as { plugins: Record<string, ESLint.Plugin> }).plugins;

  const recommended = renamePluginsInRules(
    {
      ...pluginReact.configs['disable-conflict-eslint-plugin-react'].rules,
      ...pluginReact.configs['recommended-type-checked'].rules,
    },
    PluginNameMap,
  );

  return [
    {
      name: '2digits:react/setup',
      plugins: {
        stylistic,
        'react-dom': plugins['@eslint-react/dom'],
        'react-web-api': plugins['@eslint-react/web-api'],
        'react-extra': plugins['@eslint-react'],
        'react-hooks': pluginReactHooks,
        'react-hooks-extra': plugins['@eslint-react/hooks-extra'],
        'react-naming-convention': plugins['@eslint-react/naming-convention'],
        ...(reactCompiler ? { 'react-compiler': pluginReactCompiler } : {}),
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
    {
      name: '2digits:react/rules',
      files,
      languageOptions: {
        parser,
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
          tsconfigRootDir,
          projectService: true,
          ...parserOptions,
        },
        sourceType: 'module',
      },
      rules: {
        ...recommended,

        ...(reactCompiler ? { 'react-compiler/react-compiler': 'error' } : {}),

        'react-extra/no-unnecessary-use-callback': 'error',
        'react-extra/prefer-use-state-lazy-initialization': 'error',
        'react-extra/no-unnecessary-use-prefix': 'error',
        'react-extra/no-unnecessary-use-memo': 'error',
        'react-hooks-extra/no-direct-set-state-in-use-effect': 'error',

        'react-extra/no-useless-fragment': 'off',
        'react-extra/prefer-read-only-props': 'off',
        'react-extra/jsx-shorthand-boolean': 'error',
        'react-extra/jsx-shorthand-fragment': 'error',
        'react-extra/prefer-namespace-import': 'error',

        'react-naming-convention/use-state': 'error',

        'stylistic/jsx-curly-newline': 'off',
        'stylistic/jsx-newline': ['error', { prevent: false }],
        'stylistic/jsx-self-closing-comp': 'error',

        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',

        ...overrides,
      },
    },
  ];
}
