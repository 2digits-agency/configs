import { fixupPluginRules } from '@eslint/compat';
import { renamePluginsInRules } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import { GLOB_TS, GLOB_TSX } from '../globs';
import type { OptionsTypeScriptWithTypes, OptionsWithReact, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function react(
  options: OptionsWithReact & OptionsTypeScriptWithTypes = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    files = [GLOB_TS, GLOB_TSX],
    overrides = {},
    tsconfigPath,
    parserOptions,
    tsconfigRootDir,
    reactCompiler = true,
  } = options;

  const [pluginReact, pluginReactHooks, react, parser, pluginReactCompiler] = await Promise.all([
    interopDefault(import('@eslint-react/eslint-plugin')),
    interopDefault(import('eslint-plugin-react-hooks')),
    interopDefault(import('eslint-plugin-react')),
    interopDefault(import('@typescript-eslint/parser')),
    reactCompiler ? interopDefault(import('eslint-plugin-react-compiler')) : undefined,
  ]);

  const plugins = pluginReact.configs.all.plugins;

  const recommended = renamePluginsInRules(
    {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginReact.configs['recommended-type-checked'].rules,
    },
    PluginNameMap,
  );

  return [
    {
      name: '2digits:react/setup',
      plugins: {
        react,
        'react-dom': plugins['@eslint-react/dom'],
        'react-extra': plugins['@eslint-react'],
        'react-hooks': fixupPluginRules(pluginReactHooks as never),
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
          project: tsconfigPath,
          ...parserOptions,
        },
        sourceType: 'module',
      },
      rules: {
        ...recommended,

        ...(reactCompiler ? { 'react-compiler/react-compiler': 'error' } : {}),

        'react-hooks-extra/ensure-use-memo-has-non-empty-deps': 'error',
        'react-hooks-extra/prefer-use-state-lazy-initialization': 'error',
        'react-hooks-extra/ensure-custom-hooks-using-other-hooks': 'error',
        'react-hooks-extra/ensure-use-callback-has-non-empty-deps': 'error',

        'react/jsx-curly-newline': 'off',
        'react/jsx-newline': ['error', { prevent: false }],

        ...overrides,
      },
    },
  ];
}
