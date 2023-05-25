import SortImports from '@ianvs/prettier-plugin-sort-imports';

import { defineConfig } from './utils';

export default defineConfig({
  printWidth: 100,
  trailingComma: 'all',
  bracketSameLine: true,
  singleQuote: true,

  importOrder: [
    '^(react/(.*)$)|^(react$)',
    '^(next/(.*)$)|^(next$)',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@2digits/',
    '^@mod/',
    '',
    '^@/',
    '',
    '^[./]',
  ],
  importOrderSortSpecifiers: true,
  importOrderGroupNamespaceSpecifiers: true,
  importOrderMergeDuplicateImports: true,
  importOrderCombineTypeAndValueImports: true,

  tailwindFunctions: ['tv', 'cn', 'cnBase', 'classNames', 'clsx', 'cx'],

  plugins: [SortImports, require('prettier-plugin-tailwindcss')],
});
