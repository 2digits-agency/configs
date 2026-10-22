import { fixupPluginRules } from '@eslint/compat';

import { GLOB_TS, GLOB_TSX } from '../globs';
import type { OptionsTypeScriptWithTypes, OptionsWithFiles, TypedFlatConfigItem } from '../types';
import { interopDefault, renameRules, typeAwareLanguageOptions } from '../utils';

export async function next(
  options: OptionsWithFiles & OptionsTypeScriptWithTypes = {},
): Promise<Array<TypedFlatConfigItem>> {
  const { files = [GLOB_TS, GLOB_TSX], overrides = {}, parserOptions } = options;

  const [next, languageOptions] = await Promise.all([
    interopDefault(import('@next/eslint-plugin-next')),
    typeAwareLanguageOptions(parserOptions),
  ]);

  const recommended = renameRules({
    ...next.configs.recommended.rules,
    ...next.configs['core-web-vitals'].rules,
  });

  return [
    {
      name: '2digits:next/setup',
      plugins: {
        next: fixupPluginRules(next),
      },
    },
    {
      name: '2digits:next/rules',
      files,
      languageOptions,
      rules: {
        ...recommended,

        'next/no-html-link-for-pages': 'off',

        ...overrides,
      },
    },
    {
      files: ['**/middleware.ts', '**/proxy.ts'],
      name: '2digits:next/proxy',
      rules: {
        'unicorn/prefer-string-raw': 'off',
      },
    },
  ];
}
