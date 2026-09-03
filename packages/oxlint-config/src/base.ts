import { defineConfig } from 'oxlint';

import { ignorePatterns } from '@2digits/constants';

import { twoDigitsPluginConfig } from './configs/2digits';
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
  extends: [
    javascriptConfig,
    unicornConfig,
    importConfig,
    nodeConfig,
    oxcConfig,
    jsdocConfig,
    zodConfig,
    twoDigitsPluginConfig,
  ],
  ignorePatterns,
});
