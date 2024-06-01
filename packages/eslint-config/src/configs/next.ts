import { fixupPluginRules } from '@eslint/compat';
import { renamePluginsInRules } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import { GLOB_TS, GLOB_TSX } from '../globs';
import type { OptionsTypeScriptWithTypes, OptionsWithFiles, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function next(
  options: OptionsWithFiles & OptionsTypeScriptWithTypes = {},
): Promise<TypedFlatConfigItem[]> {
  const { files = [GLOB_TS, GLOB_TSX], overrides = {}, tsconfigPath, parserOptions } = options;

  const [next, parser] = await Promise.all([
    interopDefault(import('@next/eslint-plugin-next')),
    interopDefault(import('@typescript-eslint/parser')),
  ]);

  const recommended = renamePluginsInRules(
    {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
    PluginNameMap,
  );

  return [
    {
      name: '2digits:next/setup',
      plugins: {
        next: fixupPluginRules(next as never),
      },
    },
    {
      name: '2digits:next/rules',
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

        'next/no-html-link-for-pages': 'off',

        ...overrides,
      },
    },
  ];
}
