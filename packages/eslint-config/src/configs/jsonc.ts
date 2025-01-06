import pluginJsonc from 'eslint-plugin-jsonc';
import parserJsonc from 'jsonc-eslint-parser';

import { GLOB_JSON, GLOB_JSON5, GLOB_JSONC } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function jsonc(): TypedFlatConfigItem[] {
  return [
    {
      name: '2digits:jsonc',
      files: [GLOB_JSON, GLOB_JSONC, GLOB_JSON5],
      languageOptions: {
        parser: parserJsonc,
      },
      plugins: {
        jsonc: pluginJsonc,
      },
      rules: {
        'jsonc/array-bracket-spacing': ['error', 'never'],
        'jsonc/comma-dangle': ['error', 'never'],
        'jsonc/comma-style': ['error', 'last'],
        'jsonc/indent': ['error', 2],
        'jsonc/key-spacing': ['error', { beforeColon: false, afterColon: true }],
        'jsonc/object-curly-newline': 'off', // ['error', { consistent: true, multiline: true }],
        'jsonc/object-curly-spacing': ['error', 'always'],
        'jsonc/object-property-newline': ['error', { allowMultiplePropertiesPerLine: true }],
        'jsonc/quote-props': 'error',
        'jsonc/quotes': 'error',
      },
    },
  ];
}
