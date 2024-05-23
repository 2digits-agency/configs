import type { ESLint } from 'eslint';

import type { OptionsOverrides, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function react(options: OptionsOverrides = {}): Promise<TypedFlatConfigItem[]> {
  const { overrides = {} } = options;

  const [pluginReact, pluginReactHooks, pluginReactRefresh, parserTs, react] = await Promise.all([
    interopDefault(import('@eslint-react/eslint-plugin')),
    interopDefault(import('eslint-plugin-react-hooks')),
    interopDefault(import('eslint-plugin-react-refresh')),
    interopDefault(import('@typescript-eslint/parser')),
    interopDefault(import('eslint-plugin-react')),
  ] as const);

  const plugins = pluginReact.configs.all.plugins;

  return [
    {
      name: '2digits:react/setup',
      plugins: {
        react,
        'react-extra': plugins['@eslint-react'],
        'react-dom': plugins['@eslint-react/dom'],
        'react-hooks': pluginReactHooks,
        'react-hooks-extra': plugins['@eslint-react/hooks-extra'],
        'react-naming-convention': plugins['@eslint-react/naming-convention'],
        'react-refresh': pluginReactRefresh,
      },
    },
  ];
}
