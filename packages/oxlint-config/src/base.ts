import { defineConfig } from 'oxlint';

import { twoDigitsPluginConfig } from './configs/2digits';
import { importConfig } from './configs/import';
import { javascriptConfig } from './configs/javascript';
import { jsdocConfig } from './configs/jsdoc';
import { nodeConfig } from './configs/node';
import { oxcConfig } from './configs/oxc';
import { presetConfig } from './configs/preset';
import { unicornConfig } from './configs/unicorn';
import { zodConfig } from './configs/zod';

export const baseConfig = defineConfig({
  ...presetConfig,
  env: {
    browser: true,
    node: true,
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
});
