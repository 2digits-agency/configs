import eslintReactKit, { type RuleFunction } from '@eslint-react/kit';
import { renamePluginsInRules } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import { GLOB_TS, GLOB_TSX } from '../globs';
import { noUnnecessaryUseCallback } from '../rules/react/no-unnecessary-use-callback';
import { noUnnecessaryUseMemo } from '../rules/react/no-unnecessary-use-memo';
import { preferDestructuringAssignment } from '../rules/react/prefer-destructuring-assignment';
import { preferNamespaceImport } from '../rules/react/prefer-namespace-import';
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

  const { configs } = pluginReact;
  const {
    all: { plugins },
  } = configs;
  const reactExtraPlugin = plugins?.['@eslint-react'] ?? {};

  const recommended = renamePluginsInRules(
    {
      ...configs['disable-conflict-eslint-plugin-react'].rules,
      ...configs['disable-conflict-eslint-plugin-react-hooks'].rules,
      ...configs['strict-type-checked'].rules,
    },
    PluginNameMap,
  );

  return [
    {
      name: '2digits:react/setup',
      plugins: {
        stylistic,
        'react-extra': {
          ...reactExtraPlugin,
          rules: {
            ...reactExtraPlugin.rules,
            ...reactKitPlugin.rules,
          },
        },
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
        'react-extra/globals': 'error',
        'react-extra/purity': 'error',
        'react-extra/no-unused-class-component-members': 'error',
        'react-extra/no-unnecessary-use-callback': 'error',
        'react-extra/no-unnecessary-use-prefix': 'error',
        'react-extra/no-unnecessary-use-memo': 'error',
        'react-extra/set-state-in-effect': 'error',
        'react-extra/no-unused-state': 'error',
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
        'react-extra/static-components': 'error',

        'react-extra/dom-no-missing-button-type': 'error',
        'react-extra/dom-no-missing-iframe-sandbox': 'error',
        'react-extra/dom-no-unsafe-target-blank': 'error',
        'react-extra/web-api-no-leaked-fetch': 'error',

        'react-extra/naming-convention-context-name': 'error',
        'react-extra/naming-convention-id-name': 'error',
        'react-extra/naming-convention-ref-name': 'error',

        'react-extra/prefer-destructuring-assignment': 'error',
        'react-extra/prefer-namespace-import': 'error',

        'react-extra/jsx-no-leaked-dollar': 'error',
        'react-extra/jsx-no-useless-fragment': 'off',

        'stylistic/jsx-curly-newline': 'off',
        'stylistic/jsx-newline': ['error', { prevent: false }],
        'stylistic/jsx-self-closing-comp': 'error',

        ...overrides,
      },
    },
  ];
}

const reactKitPlugin = eslintReactKit()
  .use(withRuleName(noUnnecessaryUseCallback, 'noUnnecessaryUseCallback'))
  .use(withRuleName(noUnnecessaryUseMemo, 'noUnnecessaryUseMemo'))
  .use(withRuleName(preferDestructuringAssignment, 'preferDestructuringAssignment'))
  .use(withRuleName(preferNamespaceImport, 'preferNamespaceImport'))
  .getPlugin();

function withRuleName(factory: () => RuleFunction, name: string): () => RuleFunction {
  Object.defineProperty(factory, 'name', { value: name });

  return factory;
}
