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

  const [pluginReact, parser, pluginReactCompiler, stylistic] = await Promise.all([
    interopDefault(import('@eslint-react/eslint-plugin')),
    interopDefault(import('@typescript-eslint/parser')),
    reactCompiler ? interopDefault(import('eslint-plugin-react-compiler')) : Promise.resolve(undefined),
    interopDefault(import('@stylistic/eslint-plugin')),
  ]);

  const plugins = (pluginReact.configs.all as { plugins: Record<string, ESLint.Plugin> }).plugins;

  const recommended = renamePluginsInRules(
    {
      ...pluginReact.configs['disable-conflict-eslint-plugin-react'].rules,
      ...pluginReact.configs['disable-conflict-eslint-plugin-react-hooks'].rules,
      ...pluginReact.configs['strict-type-checked'].rules,
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
        'react-naming-convention': plugins['@eslint-react/naming-convention'],
        'react-rsc': plugins['@eslint-react/rsc'],
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

        'react-extra/exhaustive-deps': 'error',
        'react-extra/purity': 'error',
        'react-extra/no-unused-class-component-members': 'error',
        'react-extra/no-unnecessary-use-callback': 'error',
        'react-extra/no-unnecessary-use-prefix': 'error',
        'react-extra/no-unnecessary-use-memo': 'error',
        'react-extra/set-state-in-effect': 'error',
        'react-extra/use-state': 'error',

        'react-extra/no-unstable-context-value': 'error',
        'react-extra/no-unstable-default-props': 'error',
        'react-extra/no-unused-props': 'error',

        'react-extra/no-context-provider': 'error',
        'react-extra/no-forward-ref': 'error',
        'react-extra/no-use-context': 'error',

        'react-extra/immutability': 'error',
        'react-extra/refs': 'error',
        'react-extra/no-duplicate-key': 'error',

        'react-dom/no-missing-button-type': 'error',
        'react-dom/no-missing-iframe-sandbox': 'error',
        'react-dom/no-unsafe-target-blank': 'error',

        'react-naming-convention/context-name': 'error',
        'react-naming-convention/id-name': 'error',
        'react-naming-convention/ref-name': 'error',

        'react-extra/jsx-shorthand-boolean': 'error',
        'react-extra/jsx-shorthand-fragment': 'error',
        'react-extra/prefer-namespace-import': 'error',

        'react-extra/no-useless-fragment': 'off',

        'stylistic/jsx-curly-newline': 'off',
        'stylistic/jsx-newline': ['error', { prevent: false }],
        'stylistic/jsx-self-closing-comp': 'error',

        ...overrides,
      },
    },
  ];
}
