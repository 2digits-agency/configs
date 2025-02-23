import { tailwindFunctions } from '@2digits/constants';

import { defineConfig, getTypescriptVersion } from './utils';

export default defineConfig({
  printWidth: 120,
  trailingComma: 'all',
  bracketSameLine: true,
  singleQuote: true,
  experimentalOperatorPosition: 'start',

  importOrder: [
    '<BUILTIN_MODULES>',
    '',
    '^(react/(.*)$)|^(react$)',
    '^(react-native/(.*)$)|^(react-native$)',
    '',
    '^(next/(.*)$)|^(next$)',
    '',
    '^(expo/(.*)$)|^(expo$)|^(expo-(.*)$)|^(@expo/(.*)$)',
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

  language: 'sqlite',
  keywordCase: 'upper',

  experimentalWasm: true,
  indent: 2,

  plugins: [
    require.resolve('prettier-plugin-toml'),
    require.resolve('@prettier/plugin-xml'),
    require.resolve('@ianvs/prettier-plugin-sort-imports'),
    require.resolve('prettier-plugin-jsdoc'),
    require.resolve('prettier-plugin-sql'),
    require.resolve('prettier-plugin-sh'),
    require.resolve('prettier-plugin-embed'),
    require.resolve('prettier-plugin-tailwindcss'),
  ],

  overrides: [
    {
      files: ['pnpm-lock.yaml'],
      options: {
        requirePragma: true,
      },
    },
  ],
});
