import { defineConfig } from '@oxlint-types/define-config';

import { ignorePatterns } from '@2digits/constants';

import { importConfig } from './configs/import';
import { javascriptConfig } from './configs/javascript';
import { jsdocConfig } from './configs/jsdoc';
import { nodeConfig } from './configs/node';
import { oxcConfig } from './configs/oxc';
import { unicornConfig } from './configs/unicorn';
import { zodConfig } from './configs/zod';

export const baseConfig = defineConfig({
  env: {
    browser: true,
    node: true,
  },
  options: {
    denyWarnings: true,
    reportUnusedDisableDirectives: 'deny',
  },
  categories: {
    nursery: 'off',
    pedantic: 'off',
    correctness: 'off',
    perf: 'off',
    style: 'off',
    restriction: 'off',
    suspicious: 'off',
  },
  extends: [javascriptConfig, unicornConfig, importConfig, nodeConfig, oxcConfig, jsdocConfig, zodConfig],
  ignorePatterns,
});
