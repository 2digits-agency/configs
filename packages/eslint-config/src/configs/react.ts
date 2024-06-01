import { renamePluginsInRules } from 'eslint-flat-config-utils';

import { GLOB_TS, GLOB_TSX } from '../globs';
import type { OptionsTypeScriptWithTypes, OptionsWithFiles, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

const pluginNameMap = {
  '@eslint-react/naming-convention': 'react-naming-convention',
  '@eslint-react/hooks-extra': 'react-hooks-extra',
  '@eslint-react/dom': 'react-dom',
  '@eslint-react': 'react-extra',
  'react-hooks': 'react-hooks',
  react: 'react',
};

export async function react(
  options: OptionsWithFiles & OptionsTypeScriptWithTypes = {},
): Promise<TypedFlatConfigItem[]> {
  const { files = [GLOB_TS, GLOB_TSX], overrides = {}, tsconfigPath, parserOptions } = options;

  const [pluginReact, pluginReactHooks, react, parser] = await Promise.all([
    interopDefault(import('@eslint-react/eslint-plugin')),
    interopDefault(import('eslint-plugin-react-hooks')),
    interopDefault(import('eslint-plugin-react')),
    interopDefault(import('@typescript-eslint/parser')),
  ]);

  const plugins = pluginReact.configs.all.plugins;

  const recommended = renamePluginsInRules(
    {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginReact.configs['recommended-type-checked'].rules,
    },
    pluginNameMap,
  );

  return [
    {
      name: '2digits:react/setup',
      plugins: {
        react,
        'react-dom': plugins['@eslint-react/dom'],
        'react-extra': plugins['@eslint-react'],
        'react-hooks': pluginReactHooks,
        'react-hooks-extra': plugins['@eslint-react/hooks-extra'],
        'react-naming-convention': plugins['@eslint-react/naming-convention'],
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
          project: tsconfigPath,
          ...(parserOptions as object),
        },
        sourceType: 'module',
      },
      rules: {
        ...recommended,

        'react-hooks-extra/ensure-use-memo-has-non-empty-deps': 'warn',
        'react-hooks-extra/prefer-use-state-lazy-initialization': 'warn',
        'react-hooks-extra/ensure-custom-hooks-using-other-hooks': 'error',
        'react-hooks-extra/ensure-use-callback-has-non-empty-deps': 'warn',

        'react/jsx-curly-newline': 'off',
        'react/jsx-newline': ['error', { prevent: false }],

        ...overrides,
      },
    },
  ];
}
