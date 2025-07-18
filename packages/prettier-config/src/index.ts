import { tailwindFunctions } from '@2digits/constants';

import { getTypescriptVersion, type PrettierConfigWithPlugins } from './utils';

export default {
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

  plugins: [
    require.resolve('@prettier/plugin-xml'),
    require.resolve('@ianvs/prettier-plugin-sort-imports'),
    require.resolve('prettier-plugin-jsdoc'),
    require.resolve('@prettier/plugin-oxc'),
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
} as const satisfies PrettierConfigWithPlugins;
