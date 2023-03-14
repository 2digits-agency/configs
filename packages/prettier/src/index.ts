import SortImports from '@trivago/prettier-plugin-sort-imports';

import { defineConfig } from './utils';

export default defineConfig({
  printWidth: 100,
  trailingComma: 'all',
  bracketSameLine: true,
  singleQuote: true,
  importOrder: ['<THIRD_PARTY_MODULES>', '^@2digits/', '^[./]'],
  importOrderGroupNamespaceSpecifiers: true,
  importOrderSortSpecifiers: true,
  importOrderSeparation: true,
  plugins: [SortImports],
});
