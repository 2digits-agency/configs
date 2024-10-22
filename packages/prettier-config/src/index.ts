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

  language: 'postgresql',
  keywordCase: 'upper',

  plugins: [
    require.resolve('prettier-plugin-toml'),
    require.resolve('@ianvs/prettier-plugin-sort-imports'),
    require.resolve('prettier-plugin-jsdoc'),
    require.resolve('prettier-plugin-tailwindcss'),
    require.resolve('prettier-plugin-sql'),
  ],
});
