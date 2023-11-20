import sortImports from '@ianvs/prettier-plugin-sort-imports';
import * as tailwind from 'prettier-plugin-tailwindcss';
import * as toml from 'prettier-plugin-toml';

import { tailwindFunctions } from '@2digits/constants';

import { defineConfig, getTypescriptVersion } from './utils';

export default defineConfig({
  printWidth: 100,
  trailingComma: 'all',
  bracketSameLine: true,
  singleQuote: true,

  importOrder: [
    '<BUILTIN_MODULES>',
    '',
    '^(react/(.*)$)|^(react$)',
    '^(react-native/(.*)$)|^(react-native$)',
    '',
    '^(next/(.*)$)|^(next$)',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@2digits/',
    '^@mod/',
    '',
    '^@/',
    '^(@[A-Z](.*))',
    '',
    '.json$',
    '',
    '^[./]',
  ],
  importOrderTypeScriptVersion: getTypescriptVersion(),

  tailwindFunctions,

  plugins: [toml, sortImports, tailwind],
});
