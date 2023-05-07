import SortImports from '@trivago/prettier-plugin-sort-imports';

import { defineConfig } from './utils';

export default defineConfig({
  printWidth: 100,
  trailingComma: 'all',
  bracketSameLine: true,
  singleQuote: true,
  importOrder: [
    '^(react/(.*)$)|^(react$)',
    '^(next/(.*)$)|^(next$)',
    '<THIRD_PARTY_MODULES>',
    '^@2digits/',
    '^@mod/',
    '^@/',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderGroupNamespaceSpecifiers: true,
  plugins: [SortImports, require('prettier-plugin-tailwindcss')],
});
