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

  pluginSearchDirs: false,

  plugins: [
    require('prettier-plugin-toml'),
    require('@ianvs/prettier-plugin-sort-imports'),
    require('prettier-plugin-tailwindcss'),
  ],
});
