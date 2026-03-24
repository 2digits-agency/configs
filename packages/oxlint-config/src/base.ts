import { defineConfig } from 'oxlint';

import { importConfig } from './configs/import';
import { javascriptConfig } from './configs/javascript';
import { unicornConfig } from './configs/unicorn';
import { ignorePatterns } from './globs';

export const baseConfig = defineConfig({
  categories: {
    nursery: 'off',
    pedantic: 'off',
    correctness: 'off',
    perf: 'off',
    style: 'off',
    restriction: 'off',
    suspicious: 'off',
  },
  extends: [javascriptConfig, unicornConfig, importConfig],
  ignorePatterns: [...ignorePatterns],
});
